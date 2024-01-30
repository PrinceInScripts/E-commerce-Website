import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Category } from "../models/category.models.js";
import { getMongoosePaginationOptions } from "../utils/helpers.js";

const createCategory=asyncHandler(async(req,res)=>{
    const {name}=req.body;
    const owner=req.user._id
    const existingCategory=await Category.findOne({owner})

    if(existingCategory){
        throw new ApiError(400,"Category already exists")
    }
    const category=await Category.create({
        name,
        owner
    })

    return res
             .status(200)
             .json(
                new ApiResponse(
                    200,
                    category,
                    "Category created successfully"
                )
             )
})

const getAllCategories=asyncHandler(async(req,res)=>{
    const { page = 1, limit = 10 } = req.query;
    const categoryAggregate=Category.aggregate([{$match:{}}])

    const categories=await Category.aggregatePaginate(
        categoryAggregate,
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels:{
                totalDocs:"totalCategories",
                docs:"categories"
            }
        })
    )

    return res
              .status(200)
              .json(new ApiResponse(200,categories,"Categories fetched successfully"))
})

const getCategoryById=asyncHandler(async(req,res)=>{
    const {categoryId}=req.params;
    const category= await Category.findById({
        _id:categoryId,
    })

    if(!category){
        throw new ApiError(404,"Category not found")
    }

    return res
              .status(200)
              .json(new ApiResponse(200,category,"Category fetched successfully"))
})



export {
    createCategory,
    getAllCategories,
    getCategoryById
}
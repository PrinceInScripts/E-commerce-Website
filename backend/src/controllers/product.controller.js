import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { getMongoosePaginationOptions } from "../utils/helpers.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Product } from "../models/product.models.js";
import { Category } from "../models/category.models.js";
import { validationResult } from "express-validator";


const getAllProducts=asyncHandler(async(req,res)=>{
    const {page=1,limit=10}=req.query;
    const productAggregate=Product.aggregate([{$match:{}}])

    const products=await Product.aggregatePaginate(
        productAggregate,
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels:{
                totalDocs:"totalProducts",
                docs:"products",
            }
        })
    )

    return res
              .status(200)
              .json(
                new ApiResponse(
                    200,
                    products,
                    "Products fetched successfully"
                )
              )
})

const createProduct=asyncHandler(async(req,res)=>{
    const {name,description,price,category,stock}=req.body;
    const categoryToBeAdded=await Category.findById(category);

    if(!categoryToBeAdded){
        throw new ApiError(404,"Category does not exist");
    }

    if(!req.files?.mainImage || !req.files?.mainImage.length){
        throw new ApiError(400,"Main image is required");
    }

    const mainImageLocalPath=req.files?.mainImage[0]?.path;

    if(!mainImageLocalPath){
        throw new ApiError(400,"Error while uploading on main image")
    }

    let mainImage=await uploadOnCloudinary(mainImageLocalPath);
    mainImage=mainImage.url;
   

    if(!mainImage){
        throw new ApiError(400,"Error while uploading on main image")
    }

    const subImages = req.files?.subImages && req.files?.subImages?.length
    ? await Promise.all(req.files?.subImages.map(async (image) => {
        const imageLocalPath = image.path;
        const imageUrl = await uploadOnCloudinary(imageLocalPath);
        return imageUrl.url;
    }))
    : [];

    const owner=req.user._id;

    const product=await Product.create({
        name,
        description,
        price,
        category,
        stock,
        owner,
        mainImage,
        subImages,
        category
    })

    return res
              .status(201)
              .json(
                new ApiResponse(
                    200,
                    product,
                    "Product created Successfully"
                )
              )
})

export {
    getAllProducts,
    createProduct
}
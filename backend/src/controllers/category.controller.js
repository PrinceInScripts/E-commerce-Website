import { asyncHandler } from "../utils/asyncHandler.js"
import {} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Category } from "../models/category.models.js";

const createCategory=asyncHandler(async(req,res)=>{
    const {name}=req.body;
    const owner=req.user._id
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

export {
    createCategory
}
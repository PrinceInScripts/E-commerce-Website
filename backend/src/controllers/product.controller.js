import mongoose from "mongoose";
import {} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { getMongoosePaginationOptions } from "../utils/helpers.js"
import {} from "../utils/cloudinary.js"
import { Product } from "../models/product.models.js";


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

export {
    getAllProducts
}
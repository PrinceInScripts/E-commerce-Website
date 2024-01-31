import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { getMongoosePaginationOptions } from "../utils/helpers.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Product } from "../models/product.models.js";
import { Category } from "../models/category.models.js";
import { MAXIMUM_SUB_IMAGE_COUNT } from "../constant.js"


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

    const subImages = req.files?.subImages && req.files?.subImages.length
        ? await Promise.all(req.files?.subImages.map(async (image) => {
            const imageLocalPath = image.path;
            const imageUrl = await uploadOnCloudinary(imageLocalPath);
            return {
                _id: new mongoose.Types.ObjectId(),
                imageUrl: imageUrl.url,
            };
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

const updateProduct=asyncHandler(async(req,res)=>{
    const {productId}=req.params;
    const {name,description,price,category,stock}=req.body;

    const product=await Product.findById(productId);

    if(!product){
        throw new ApiError(404,"Product not found")
    }

    let mainImage = req.files?.mainImage && req.files?.mainImage.length
    ? await uploadOnCloudinary(req.files?.mainImage[0]?.path)
    : product.mainImage;

    mainImage=req.files?.mainImage && req.files?.mainImage.length ? mainImage.url : product.mainImage;
 
    let subImages = req.files?.subImages && req.files?.subImages.length
    ? await Promise.all(req.files.subImages.map(async (image) => {
        const imageLocalPath = image.path;
        const imageUrl = await uploadOnCloudinary(imageLocalPath);
        return {
            _id: new mongoose.Types.ObjectId(),
            imageUrl: imageUrl.url,
        };
    }))
    : [];


    const existedSubImages=product.subImages.length
    const newSubImages=subImages.length
    const totalSubImages=existedSubImages+newSubImages

    if(totalSubImages>MAXIMUM_SUB_IMAGE_COUNT){
        throw new ApiError(
            400,
            "Maximum " +
              MAXIMUM_SUB_IMAGE_COUNT +
              " sub images are allowed for a product. There are already " +
              existedSubImages +
              " sub images attached to the product."
          );
    }

    subImages=[...product.subImages,...subImages]

    const updateProduct =await Product.findByIdAndUpdate(
        productId,
        {
            $set:{
                name,
                description,
                stock,
                price,
                category,
                mainImage,
                subImages,
            }
        },
        {new:true}
        
        )

        return res
                .status(200)
                .json(
                  new ApiResponse(
                    200,
                    updateProduct,
                    "Product updated successfully"
                   )
                )
    
})

const getProductById=asyncHandler(async(req,res)=>{
    const {productId}=req.params;
    const product=await Product.findById(productId);

    if(!product){
        throw new ApiError(404,"Product not found")
    }

    return res
              .status(200)
              .json(
                new ApiResponse(
                    200,
                    product,
                    "Product fetched successfully"
                )
              )
})

const getProductByCategory=asyncHandler(async(req,res)=>{
    const {categoryId}=req.params;
    const {page=1,limit=10}=req.query;

    const category=await Category.findById(categoryId).select("name _id")

    if(!category){
        throw new ApiError(404,"Category not found")
    }

    const productAggregate=Product.aggregate([
        {
            $match:{
                category:new mongoose.Types.ObjectId(categoryId)
            }
        }
    ])

    const product=await Product.aggregatePaginate(
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
                    {...product,category},
                    "Category products fetched successfully"
                )    
              )
})

const removeProductSubImages=asyncHandler(async(req,res)=>{
    const {productId,subImageId}=req.params;
    

    const product=await Product.findById(productId);
    if(!product){
        throw new ApiError(404,"Product not found")
    }

    const subImageRemove=product.subImages.find(image=>image._id.toString()===subImageId)

    if(!subImageRemove){
        throw new ApiError(404,"Sub image not found")
    }

    const updateProduct=await Product.findByIdAndUpdate(
        productId,
        {
            $pull:{
                subImages:{
                    _id:new mongoose.Types.ObjectId(subImageId)
                }
            }
        },
        {new:true}
    )

    return res
             .status(200)
             .json(
                new ApiResponse(
                    200,
                    updateProduct,
                    "Sub image is removed Successfully"
                )
             )
})

const deleteProduct=asyncHandler(async(req,res)=>{
    const {productId}=req.params;

    const product=await Product.findById(productId);

    if(!product){
        throw new ApiError(404,"Product not found")
    }

    const deleteProduct=await Product.findByIdAndDelete(productId)

    return res
             .status(200)
             .json(
                new ApiResponse(
                    200,
                    {"deleteProduct":deleteProduct},
                    "delete product succesfully"
                )
             )
})

export {
    getAllProducts,
    createProduct,
    updateProduct,
    getProductById,
    getProductByCategory,
    removeProductSubImages,
    deleteProduct
}
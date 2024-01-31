
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { CoupenTypeEnum } from "../constant.js"
import { Coupon } from "../models/coupen.models.js"


const createCoupon=asyncHandler(async(req,res)=>{
    const {name,couponCode,type=CoupenTypeEnum.FLAT,discountValue,minimumCartValue,startDate,expiryDate}=req.body

    const duplicateCoupon=await Coupon.findOne({
        couponCode:couponCode.trim().toUpperCase()  
    })

    if(duplicateCoupon){
        throw new ApiError(
            409,
            "Coupon with code " + duplicateCoupon.couponCode + " already exists"
          );
    }

    if(minimumCartValue && +minimumCartValue < +discountValue){
        throw new ApiError(
            400,
            "Minimum cart value must be greater than or equal to the discount value"
          );
    }

    const coupon=await Coupon.create({
        name,
        couponCode,
        type,
        discountValue,
        minimumCartValue,
        startDate,
        expiryDate,
        owner:req.user._id,
    })

    return res
             .status(201)
             .json(
                new ApiResponse(
                    200,
                    coupon,
                    "Coupon created successfully"
                )
             )
})


export {
    createCoupon
}
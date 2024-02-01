
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { CoupenTypeEnum } from "../constant.js"
import { Coupon } from "../models/coupen.models.js"
import { getCart } from "./cart.controller.js"
import { Cart } from "../models/cart.models.js"


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

const applyCoupon=asyncHandler(async(req, res)=>{
    const {couponCode}=req.body

    //check for oupon code existance
    let aggregatedCoupon = await Coupon.aggregate([
        {
          $match: {
            // check for coupon code availability
            couponCode: couponCode.trim().toUpperCase(),
            // coupon is valid if start date is less than current date
            startDate: {
              $lt: new Date(),
            },
            // coupon is valid if expiry date is less than current date
            expiryDate: {
              $gt: new Date(),
            },
            isActive: {
              $eq: true,
            },
          },
        },
      ]);
    
      const coupon = aggregatedCoupon[0];
      console.log(coupon);
      if (!coupon) {
        throw new ApiError(400, "Invalid coupon code");
      }
      
      const userCart=await getCart.apply(req.user._id)
      console.log(userCart);
      console.log("User Cart Total:", userCart.cartTotal);
console.log("Coupon Minimum Cart Value:", coupon.minimumCartValue);
     
      // check if the cart's total is greater than the minimum cart total requirement of the coupon
      if (userCart.cartTotal < coupon.minimumCartValue) {
        throw new ApiError(
            400,
            "Add items worth INR " +
            (coupon.minimumCartValue - userCart.cartTotal) +
            "/- or more to apply this coupon"
        );
    }

       // if all the above checks are passed
      // Find the user cart and apply coupon to it

      await Cart.findOneAndUpdate(
        {
            owner:req.user._id,
        },
        {
            $set:{
                coupon:coupon._id,
            }
        },
        {
            new:true
        }
      )

      const newCart=await getCart(req.user._id)

      return res
              .status(200)
              .json(
                new ApiResponse(
                    200,
                    newCart,
                    "Coupon applied successfully"
                )
              )
   
})
export {
    createCoupon,
    applyCoupon
}
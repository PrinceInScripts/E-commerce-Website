import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CoupenTypeEnum } from "../constant.js";
import { Coupon } from "../models/coupen.models.js";
import { getCart } from "./cart.controller.js";
import { Cart } from "../models/cart.models.js";
import { getMongoosePaginationOptions } from "../utils/helpers.js"
import mongoose from "mongoose";

const createCoupon = asyncHandler(async (req, res) => {
  const {
    name,
    couponCode,
    type = CoupenTypeEnum.FLAT,
    discountValue,
    minimumCartValue,
    startDate,
    expiryDate,
  } = req.body;

  const duplicateCoupon = await Coupon.findOne({
    couponCode: couponCode.trim().toUpperCase(),
  });

  if (duplicateCoupon) {
    throw new ApiError(
      409,
      "Coupon with code " + duplicateCoupon.couponCode + " already exists"
    );
  }

  if (minimumCartValue && +minimumCartValue < +discountValue) {
    throw new ApiError(
      400,
      "Minimum cart value must be greater than or equal to the discount value"
    );
  }

  const coupon = await Coupon.create({
    name,
    couponCode,
    type,
    discountValue,
    minimumCartValue,
    startDate,
    expiryDate,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(200, coupon, "Coupon created successfully"));
});

const applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;

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
  if (!coupon) {
    throw new ApiError(400, "Invalid coupon code");
  }

  const userCart = await getCart.apply(req.user._id);

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
      owner: req.user._id,
    },
    {
      $set: {
        coupon: coupon._id,
      },
    },
    {
      new: true,
    }
  );

  const newCart = await getCart(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, newCart, "Coupon applied successfully"));
});

const removeCouponFromCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate(
    {
      owner: req.user._id,
    },
    {
      $set: {
        coupon: null,
      },
    },
    { new: true }
  );

  const newCart = await getCart(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, newCart, "Coupon removed successfully"));
});

const getAllCoupons = asyncHandler(async (req, res) => {
    const {page=1,limit=10} = req.query;

    const couponAggregate=Coupon.aggregate([{$match:{}}])

    const coupons=await Coupon.aggregatePaginate(
        couponAggregate,
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels:{
                totalDocs:"totalCoupons",
                docs:"coupons"
            }
        })
    )

    return res
    .status(200)
    .json(new ApiResponse(200, coupons, "Coupons fetched successfully"));
})

const getValidCouponsForCustomer=asyncHandler(async (req,res)=>{
    const {page=1,limit=10}=req.query;  

    const userCart=await getCart(req.user._id);
    const cartTotal=userCart.cartTotal;
    const couponsAggregate=Coupon.aggregate([
        {
            $match:{
                startDate:{$lt:new Date()},
                expiryDate:{$gt:new Date()},
                isActive:{$eq:true},
                minimumCartValue:{$lte:cartTotal}
            }
        }
    ])

    const coupons=await Coupon.aggregatePaginate(
        couponsAggregate,
        getMongoosePaginationOptions({
            page,
            limit,  
            customLabels:{
                totalDocs:"totalCoupons",
                docs:"coupons"
            }
        })
    )

    return res
    .status(200)
    .json(
      new ApiResponse(200, coupons, "Customer coupons fetched successfully")
    );
})

const getCouponById=asyncHandler(async (req, res)=>{
    const {couponId}=req.params;

    const coupon=await Coupon.findById(couponId);

    if(!coupon){
        throw new ApiError(404,"Coupon not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, coupon, "Coupon fetched successfully"));
})

const updateCoupon=asyncHandler(async (req, res)=>{
    const {couponId}=req.params;
    const {
        name,
        couponCode,
        type = CoupenTypeEnum.FLAT,
        discountValue,
        minimumCartValue,
        startDate,
        expiryDate,
      } = req.body;

      const couponToBeUpdated=await Coupon.findById(couponId);

      if(!couponToBeUpdated){
          throw new ApiError(404, "Coupon not found")
      
      }

      const duplicateCoupon=await Coupon.aggregate([
       {
        $match:{
            couponCode:couponCode?.trim().toUpperCase(),
            _id: {
                $ne: new mongoose.Types.ObjectId(couponToBeUpdated._id),
              },
        }
       } 
      ])

      if(duplicateCoupon[0]){
          throw new ApiError(409, "Coupon with code "+duplicateCoupon[0].couponCode+" already exists")
      }
      
      // Variable to check if min cart value is greater than discount value
        const _minimumCartValue =minimumCartValue || couponToBeUpdated.minimumCartValue;
        const _discountValue = discountValue || couponToBeUpdated.discountValue;

        if (_minimumCartValue && +_minimumCartValue < +_discountValue) {
            throw new ApiError(
            400,
            "Minimum cart value must be greater than or equal to the discount value"
            );
        }

        const coupon = await Coupon.findByIdAndUpdate(
            couponId,
            {
              $set: {
                name,
                couponCode,
                type,
                discountValue: _discountValue,
                minimumCartValue: _minimumCartValue,
                startDate,
                expiryDate,
              },
            },
            { new: true }
          );

          
          return res
          .status(200)
          .json(new ApiResponse(200, coupon, "Coupon updated successfully"));
})
export {
     createCoupon,
     applyCoupon,
     removeCouponFromCart,
     getAllCoupons,
     getValidCouponsForCustomer,
     getCouponById,
     updateCoupon
     };

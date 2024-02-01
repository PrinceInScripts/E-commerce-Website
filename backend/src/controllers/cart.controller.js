
import { Cart } from "../models/cart.models.js";
import {} from "../utils/ApiError.js"
import {} from "../utils/ApiResponse.js"
import {} from "../utils/asyncHandler.js"

export const getCart=async (userId)=>{
    const cartAggregation=await Cart.aggregate([
        {
            $match:{
                owner:userId
            },
        },
        {
            $unwind:"$items"
        },
        {
            $lookup:{
                from:"products",
                localField:"items.productId",
                foreignField:"_id",
                as:"product"
            },
        },
        {
            $project:{
                product:{$first:"$product"},
                quantity:"$items.quantity",
                coupon:1,
            },
        },
        {
            $group:{
                _id:"$_id",
                items:{
                    $push:"$$ROOT",
                },
                coupon:{$first:"$coupon"},
                cartTotal:{
                    $sum:{
                        $multiply:["$product.price","$quantity"]
                    }
                }
            }
        },
        {
            $lookup:{
                from:"coupons",
                localField:"coupon",
                foreignField:"_id",
                as:"coupon"
            }
        },
        {
            $addFields:{
                coupon:{$first:"$coupon"},
            }
        },
        {
            $addFields:{
                discountedTotal:{
                    $ifNull:[
                        {
                            $subtract:["$cartTotal","$coupon.discountValue"],
                        },
                        "$cartTotal",
                    ]
                }
            }
        }
    ]);

    return (
        cartAggregation[0] ?? {
            _id:null,
            items:[],
            cartTotal:0,
            discountedTotal:0,
        }
    )
}
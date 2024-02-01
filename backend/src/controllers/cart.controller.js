
import { Cart } from "../models/cart.models.js";
import {} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

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

const getUserCart=asyncHandler(async (req,res)=>{
    let cart=await getCart(req.user._id);

    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                cart,
                "Cart fetched successfully"
            )
           )
})

export {
    getUserCart,
}
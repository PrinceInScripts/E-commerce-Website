
import { Cart } from "../models/cart.models.js";
import { Product } from "../models/product.models.js";
import { ApiError } from "../utils/ApiError.js"
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

const addItemOrUpdateItemQuantity=asyncHandler(async (req,res)=>{
    const {productId}=req.params;
    const {quantity=1}=req.body;

    const cart=await Cart.findOne({
        owner:req.user._id,
    })

    const product=await Product.findById(productId);

    if(!product){
        throw new ApiError(404, "Product not found");
    }
    
    if(quantity > product.stock){
        throw new ApiError(
            400,
            product.stock > 0
              ? "Only " +
                product.stock +
                " products are remaining. But you are adding " +
                quantity
              : "Product is out of stock"
          );
    }
   
    const addedProduct = cart.items?.find(
        (item) => item.productId.toString() === productId
      );
    

    if (addedProduct) {
        // If product already exist assign a new quantity to it
        // ! We are not adding or subtracting quantity to keep it dynamic. Frontend will send us updated quantity here
        addedProduct.quantity = quantity;
        // if user updates the cart remove the coupon associated with the cart to avoid misuse
        // Do this only if quantity changes because if user adds a new project the cart total will increase anyways
        if (cart.coupon) {
          cart.coupon = null;
        }
      } else {
        // if its a new product being added in the cart push it to the cart items
        cart.items.push({
          productId,
          quantity,
        });
      }

      await cart.save({validateBeforeSave:true});

      const newCart=await getCart(req.user._id);

      return res
               .status(200)
               .json(
                new ApiResponse(
                    200,
                    newCart,
                    "item added successfully"
                )
               )
    
})

const removeItemFromCart=asyncHandler(async (req, res)=>{
    const {productId}=req.params;

    const product=await Product.findById(productId);

    if(!product){
        throw new ApiError(404, "Product not found");
    }
    
    const updatedCart=await Cart.findOneAndUpdate(
        {
            owner:req.user._id,
        },
        {
            $pull:{
                items:{
                    productId:productId
                }
            }
        },
        {new:true}
        
    )
    let cart=await getCart(req.user._id);

      // check if the cart's new total is greater than the minimum cart total requirement of the coupon
  if (cart.coupon && cart.cartTotal < cart.coupon.minimumCartValue) {
    // if it is less than minimum cart value remove the coupon code which is applied
    updatedCart.coupon = null;
    await updatedCart.save({ validateBeforeSave: false });
    // fetch the latest updated cart
    cart = await getCart(req.user._id);
  }

  return res
  .status(200)
  .json(new ApiResponse(200, cart, "Cart item removed successfully"));
})

const clearCart=asyncHandler(async (req, res)=>{
    await Cart.findOneAndUpdate(
        {
            owner:req.user._id,
        },
        {
            $set:{
                items:[],
                coupon:null,
            }
        },{
            new:true,
        }
    )

    const cart=await getCart(req.user._id);

    return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart has been cleared"));
})

export {
    getUserCart,
    addItemOrUpdateItemQuantity,
    removeItemFromCart,
    clearCart
}
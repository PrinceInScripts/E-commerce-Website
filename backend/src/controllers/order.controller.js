
import { nanoid } from "nanoid"
import Razorpay from "razorpay"
import { PaymentProviderEnum, paypalBaseUrl } from "../constant.js"
import { Cart } from "../models/cart.models.js";
import { Order } from "../models/order.models.js";
import { Product } from "../models/product.models.js";
import { ApiError } from "../utils/ApiError.js";
import { orderConfirmationMailgenContent, sendEmail } from "../utils/mail.js";
import { getCart } from "./cart.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Address } from "../models/address.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";


//utility functions
const generatePaypalAccessToken = async ()=>{
    try {
        const auth=Buffer.from(
            process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET
        ).toString("base64");

        const response = await fetch(`${paypalBaseUrl.sandbox}/v1/oauth2/token`, {
            method: "POST",
            body: "grant_type=client_credentials",
            headers: {
              Authorization: `Basic ${auth}`,
            },
          });

          const data=await response.json();
          return data?.access_token;
    } catch (error) {
        throw new ApiError(500, "Error while generating paypal auth token");
    }
}

const orderFulfillmentHelper = async (orderPaymentId,req)=>{
    const order=await Order.findOneAndUpdate(
        {
            paymentId:orderPaymentId
        },
        {
            $set:{
                isPaymentDone:true
            }
        },{
            new:true
        }
    )

    if(!order){
        throw new ApiError(400, "Order not found");
    }

    //get the user's cart
    const cart=await Cart.findOne({
        owner:req.user._id
    })

    const userCart=await getCart(req.user._id);

    const bulkStockUpdated=userCart.items.map((item)=>{
        return {
            updateOne:{
                filter:{_id:item.product?._id},
                update:{$inc:{stock:-item.quantity}}
            }
        }
    
    })

    await Product.bulkWrite(bulkStockUpdated,{
        skipValidation:true
    })

    await sendEmail({
        email:req.user?.email,
        subject:"Order confirmed",
        mailgenContent: orderConfirmationMailgenContent(
            req.user?.name,
            userCart.items,
            order.discountedOrderPrice ?? 0 
        )
    })

    cart.items=[];
    cart.coupon=null;

    await cart.save({validateBeforeSave:false});
    return order;
}

const paypalApi=async (req, res, next)=>{
    const accessToken=await generatePaypalAccessToken();
    
    return await fetch(`${paypalBaseUrl.sandbox}/v2/checkout/orders${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });
}

let razorpayInstance;

try {
    razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
} catch (error) {
    console.error("RAZORPAY ERROR: ", error);
}



const generateRazorpayOrder = asyncHandler(async (req, res) => {
    const {addressId}=req.body;

    if(!razorpayInstance){
        console.error("RAZORPAY ERROR: `key_id` is mandatory");
        throw new ApiError(500, "Internal server error");
    }

    const address=await Address.findOne({
        _id:addressId,
        owner:req.user._id
    })

    if(!address){
        throw new ApiError(400, "Address does not exists");
    }

    const cart=await Cart.findOne({
        owner:req.user._id
    })

    if(!cart || !cart.items?.length){
        throw new ApiError(400, "User Cart is empty");
    }

    const orderItems=cart.items;
    const userCart=await getCart(req.user._id);

    const totalPrice=userCart.cartTotal;
    const totalDiscountedPrice = userCart.discountedTotal;
    
    const orderOptions={
        amount: parseInt(totalDiscountedPrice)*100,
        currency: "INR",
        receipt: nanoid(10),
    }

    razorpayInstance.orders.create(
        orderOptions,
        async function (err,razorpayOrder){
            if(!razorpayOrder || (err && error)){
                return res
                        .status(err.statusCode)
                        .json(
                            new ApiResponse(
                                err.statusCode,
                                null,
                                err.error.message ||  "Something went wrong while initialising the razorpay order."
                            )
                        )
            }

            const unpaidOrder=await Order.create({
                address:addressId,
                customer:req.user._id,
                items:orderItems,
                orderPrice: totalPrice ?? 0,
                discountedOrderPrice: totalDiscountedPrice ?? 0,
                paymentProvider: PaymentProviderEnum.RAZORPAY,
                paymentId: razorpayOrder.id,
                coupon: userCart.coupon?._id,
            });

            if(unpaidOrder){
                return res
                         .status(200)
                         .json(
                            new ApiResponse(200,razorpayOrder,"Razorpay order generated")
                         )
            } else {
                return res
                         .status(500)
                         .json(
                            new ApiResponse(500, null, "Something went wrong while generating the order")
                         )
            }
        }
    )
    
    
})

export {
    generateRazorpayOrder
}
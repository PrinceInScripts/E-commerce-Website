
import Razorpay from "razorpay"
import { paypalBaseUrl } from "../constant.js"
import { Cart } from "../models/cart.models";
import { Order } from "../models/order.models.js";
import { Product } from "../models/product.models.js";
import { ApiError } from "../utils/ApiError";
import { orderConfirmationMailgenContent, sendEmail } from "../utils/mail";
import { getCart } from "./cart.controller";


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


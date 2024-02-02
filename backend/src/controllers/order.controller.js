import crypto from "crypto";
import { nanoid } from "nanoid";
import Razorpay from "razorpay";
import {
  PaymentProviderEnum,
  orderStatusEnum,
  paypalBaseUrl,
} from "../constant.js";
import { Cart } from "../models/cart.models.js";
import { Order } from "../models/order.models.js";
import { Product } from "../models/product.models.js";
import { ApiError } from "../utils/ApiError.js";
import { orderConfirmationMailgenContent, sendEmail } from "../utils/mail.js";
import { getCart } from "./cart.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Address } from "../models/address.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

//utility functions
const generatePaypalAccessToken = async () => {
  try {
    const auth = Buffer.from(
      process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET
    ).toString("base64");

    const response = await fetch(`${paypalBaseUrl.sandbox}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();
    return data?.access_token;
  } catch (error) {
    throw new ApiError(500, "Error while generating paypal auth token");
  }
};

const orderFulfillmentHelper = async (orderPaymentId, req) => {
  const order = await Order.findOneAndUpdate(
    {
      paymentId: orderPaymentId,
    },
    {
      $set: {
        isPaymentDone: true,
      },
    },
    {
      new: true,
    }
  );

  if (!order) {
    throw new ApiError(400, "Order not found");
  }

  //get the user's cart
  const cart = await Cart.findOne({
    owner: req.user._id,
  });

  const userCart = await getCart(req.user._id);

  const bulkStockUpdated = userCart.items.map((item) => {
    return {
      updateOne: {
        filter: { _id: item.product?._id },
        update: { $inc: { stock: -item.quantity } },
      },
    };
  });

  await Product.bulkWrite(bulkStockUpdated, {
    skipValidation: true,
  });

  await sendEmail({
    email: req.user?.email,
    subject: "Order confirmed",
    mailgenContent: orderConfirmationMailgenContent(
      req.user?.name,
      userCart.items,
      order.discountedOrderPrice ?? 0
    ),
  });

  cart.items = [];
  cart.coupon = null;

  await cart.save({ validateBeforeSave: false });
  return order;
};

const paypalApi = async (endpoint, body = {}) => {
  const accessToken = await generatePaypalAccessToken();
  return await fetch(`${paypalBaseUrl.sandbox}/v2/checkout/orders${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
};

let razorpayInstance;

try {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} catch (error) {
  console.error("RAZORPAY ERROR: ", error);
}

const generateRazorpayOrder = asyncHandler(async (req, res) => {
  const { addressId } = req.body;

  if (!razorpayInstance) {
    console.error("RAZORPAY ERROR: `key_id` is mandatory");
    throw new ApiError(500, "Internal server error");
  }

  const address = await Address.findOne({
    _id: addressId,
    owner: req.user._id,
  });

  if (!address) {
    throw new ApiError(400, "Address does not exists");
  }

  const cart = await Cart.findOne({
    owner: req.user._id,
  });

  if (!cart || !cart.items?.length) {
    throw new ApiError(400, "User Cart is empty");
  }

  const orderItems = cart.items;
  const userCart = await getCart(req.user._id);

  const totalPrice = userCart.cartTotal;
  const totalDiscountedPrice = userCart.discountedTotal;

  const orderOptions = {
    amount: parseInt(totalDiscountedPrice) * 100,
    currency: "INR",
    receipt: nanoid(10),
  };

  razorpayInstance.orders.create(
    orderOptions,
    async function (err, razorpayOrder) {
      if (!razorpayOrder || (err && error)) {
        return res
          .status(err.statusCode)
          .json(
            new ApiResponse(
              err.statusCode,
              null,
              err.error.message ||
                "Something went wrong while initialising the razorpay order."
            )
          );
      }

      const unpaidOrder = await Order.create({
        address: addressId,
        customer: req.user._id,
        items: orderItems,
        orderPrice: totalPrice ?? 0,
        discountedOrderPrice: totalDiscountedPrice ?? 0,
        paymentProvider: PaymentProviderEnum.RAZORPAY,
        paymentId: razorpayOrder.id,
        coupon: userCart.coupon?._id,
      });

      if (unpaidOrder) {
        return res
          .status(200)
          .json(
            new ApiResponse(200, razorpayOrder, "Razorpay order generated")
          );
      } else {
        return res
          .status(500)
          .json(
            new ApiResponse(
              500,
              null,
              "Something went wrong while generating the order"
            )
          );
      }
    }
  );
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  let expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    const order = await orderFulfillmentHelper(razorpay_payment_id, req);
    return res
      .status(200)
      .json(new ApiResponse(200, order, "Order placed sucessfully"));
  } else {
    throw new ApiError(400, "Invalid razorpay signature");
  }
});

const generatedPaypalOrder = asyncHandler(async (req, res) => {
  const { addressId } = req.body;

  const address = await Address.findOne({
    _id: addressId,
    owner: req.user._id,
  });

  if (!address) {
    throw new ApiError(400, "Address does not exists");
  }

  const cart = await Cart.findOne({
    owner: req.user._id,
  });

  if (!cart || !cart.items?.length) {
    throw new ApiError(400, "User Cart is empty");
  }

  const orderItems = cart.items;
  const userCart = await getCart(req.user._id);

  const totalPrice = userCart.cartTotal;
  const totalDiscountedPrice = userCart.discountedTotal;

  const response = await paypalApi("/", {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: (totalDiscountedPrice * 0.012).toFixed(0), // convert indian rupees to dollars
        },
      },
    ],
  });

  const paypalOrder = await response.json();

  if (paypalOrder?.id) {
    const unpaidOrder = await Order.create({
      address: addressId,
      customer: req.user._id,
      items: orderItems,
      orderPrice: totalPrice ?? 0,
      discountedOrderPrice: totalDiscountedPrice ?? 0,
      paymentProvider: PaymentProviderEnum.PAYPAL,
      paymentId: paypalOrder._id,
      coupon: userCart.coupon?._id,
    });

    if (unpaidOrder) {
      return res
        .status(200)
        .json(new ApiResponse(200, paypalOrder, "Paypal order generated"));
    }
  }

  console.log(
    "Make sure you have provided your PAYPAL credentials in the .env file"
  );
  throw new ApiError(
    500,
    "Something went wrong while initialising the paypal order."
  );
});

const verifyPaypalPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const response = await paypalApi(`/${orderId}/capture`, {});
  const capturedData = await response.json();

  if (capturedData?.status === "COMPLETED") {
    const order = await orderFulfillmentHelper(capturedData.id, req);

    return res
      .status(200)
      .json(new ApiResponse(200, order, "Order placed successfully"));
  } else {
    throw new ApiError(500, "Something went wrong with the paypal payment");
  }
});

const updatedOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  let order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(400, "Order does not exist");
  }

  if (order.status === orderStatusEnum.DELIVERED) {
    throw new ApiError(400, "Order is already delivered");
  }

  order = await Order.findByIdAndUpdate(
    orderId,
    {
      $set: {
        status,
      },
    },
    { new: true }
  );
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status,
      },
      "Order status changed successfully"
    )
  );
});

const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(orderId),
      },
    },
    //lookup for address associtaed to the order
    {
      $lookup: {
        from: "addresses",
        localField: "address",
        foreignField: "_id",
        as: "address",
      },
    },
    //lookup for a customer associated to the order
    {
      $lookup: {
        from: "users",
        localField: "customer",
        foreignField: "_id",
        as: "customer",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              email: 1,
            },
          },
        ],
      },
    },
    //lookup for a  coupon applied while placing the order
    {
      $lookup: {
        from: "coupons",
        localField: "coupon",
        foreignField: "_id",
        as: "coupon",
        pipeline: [
          {
            $project: {
              name: 1,
              name: 1,
              coupon: 1,
            },
          },
        ],
      },
    },
    //lookup returns array so get the first element of adddress and customer
    {
      $addFields: {
        customer: { $first: "$customer" },
        address: { $first: "$address" },
        coupon: { $ifNull: [{ $first: "$coupon" }, null] },
      },
    },
    //unwind the items array
    {
      $unwind: "$items",
    },
    //lookup for product associated to the order
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "items.product",
      },
    },
    {
      $addFields: { "items.product": { $first: "$items.product" } },
    },
    {
      $group: {
        _id: "$_id",
        order: { $first: "$$ROOT" },
        orderItems: {
          $push: {
            _id: "$items._id",
            quantity: "$items.quantity",
            product: "$items.product",
          },
        },
      },
    },
    {
      $addFields: {
        "order.items": "$orderItems",
      },
    },
    {
      $project: {
        orderItems: 0,
      },
    },
  ]);

  if (!order[0]) {
    throw new ApiError(404, "Order does not exist");
  }

  return res
  .status(200)
  .json(new ApiResponse(200, order[0], "Order fetched successfully"));
});

export {
  generateRazorpayOrder,
  verifyRazorpayPayment,
  generatedPaypalOrder,
  verifyPaypalPayment,
  updatedOrderStatus,
  getOrderById
};

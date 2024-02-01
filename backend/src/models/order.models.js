import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"
import { AvailableOrderStatus, AvailablePaymentProvider, PaymentProviderEnum, orderStatusEnum } from "../constant.js"

const orderSchema=new Schema({
    orderPrice:{
        type:Number,
        required:true
    },
    discountOrderPrice:{
        type:Number,
        required:true
    },
    coupon:{
        type:Schema.Types.ObjectId,
        ref:"Coupon",
        default:null
    },
    customer:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    items: {
        type: [
          {
            productId: {
              type: Schema.Types.ObjectId,
              ref: "Product",
            },
            quantity: {
              type: Number,
              required: true,
              min: [1, "Quantity can not be less then 1."],
              default: 1,
            },
          },
        ],
        default: [],
      },
      address:{
        type:Schema.Types.ObjectId,
        ref:"Address",
      },
      status:{
        type:String,
        enum:AvailableOrderStatus,
        default:orderStatusEnum.PENDING
      },
      paymentProvider:{
        type:String,
        enum:AvailablePaymentProvider,
        default:PaymentProviderEnum
      },
      paymentId:{
        type:String,
      },
      isPaymentDone:{
        type:Boolean,
        default:false,
      }
},{timestamps:true})

orderSchema.plugin(mongooseAggregatePaginate)

export const Order=mongoose.model("Order",orderSchema)
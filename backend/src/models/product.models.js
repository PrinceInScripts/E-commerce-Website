import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new Schema({
        category:{
            type:Schema.Types.ObjectId,
            ref:"Category",
            required:true
        },
        description:{
            type:String,
            required:true,
        },
        mainImage:{
            type:String,
            required:true,
        },
        name:{
            type:String,
            required:true,
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User",
        },
        price:{
            type:Number,
            default:0
        },
        stock:{
            type:Number,
            default:0
        },
        subImages: [
            {
                _id: {
                    type: Schema.Types.ObjectId,
                    default: mongoose.Types.ObjectId
                },
                imageUrl: {
                    type: String,
                    required: true
                },
            }
        ]

},{timestamps:true})

productSchema.plugin(mongooseAggregatePaginate);

export const Product=mongoose.model("Product",productSchema)
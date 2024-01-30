import moongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"


const addressSchema = new Schema(
  {
    addressLine1: {
      type: String,
      required: true,
    },
    addressLine2:{
        type:String,
    },
    city:{
        type:String,
        required:true,
    },
    country:{
        type:String,
        required:true,
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    pincode:{
        type:String,
        required:true,
    },
    state:{
        type:String,
        required:true,
    }
  },
  { timestamps: true }
);


addressSchema.plugin(mongooseAggregatePaginate);

export const Address = moongoose.model("Address", addressSchema);

import { Address } from "../models/address.models.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {} from "../utils/ApiError.js"

const createAddress=asyncHandler(async(req,res)=>{
    const {addressLine1,addressLine2,city,state,country,pincode}=req.body
    const owner=req.user._id;

    const existingAddress=await Address.findOne({owner})    

    if(existingAddress){
        return res.status(400).json(
            new ApiResponse(
              400,
              null,
              "User already has an address. To update the address, use the update endpoint."
            )
          );
    }
 
    const address=await Address.create({
        addressLine1,
        addressLine2,
        city,
        country,
        owner,
        pincode,
        state
    })

    return res.status(201).json(
        new ApiResponse(
            200,
            address,
            "Address created successfully"
        )
    )
})



export {
    createAddress
}
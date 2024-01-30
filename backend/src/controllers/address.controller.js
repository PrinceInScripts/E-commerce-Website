import { Address } from "../models/address.models.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {} from "../utils/ApiError.js"
import { getMongoosePaginationOptions } from "../utils/helpers.js"

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

const getAllAddress=asyncHandler(async(req,res)=>{
    const {page=1,limit=10}=req.query;
    const addressAggregation=Address.aggregate([
        {
            $match:{
                owner:req.user._id,
            }
        }
    ])

    const addresses = await Address.aggregatePaginate(
        addressAggregation,
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels:{
                totalDocs:"totalAddresses",
                docs:"addresses"
            }
        })
    )

    return res
              .status(200)
              .json(
                new ApiResponse(
                    200,
                    addresses,
                    "Address fetched succesfully"
                )
              )
})



export {
    createAddress,
    getAllAddress
}
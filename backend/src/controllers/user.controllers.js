import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.models.js"
import {userLoginType, userRolesEnum} from "../constant.js"
import {emailVerificationMailgenContent, sendEmail} from "../utils/mail.js"
import crypto from "crypto"
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshTokens=async (userId)=>{
    try {
        const user=await User.findById(userId)

        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken;

        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating the access token")
    }
}

const registerUser=asyncHandler(async(req,res)=>{
    const {username,email,password,role}=req.body

    if(!username || !email || !password){
       throw new ApiError(400,"All fields are required");
    }

    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"User already exists");
    }

    const user=await User.create({
        email,
        password,
        username,
        isEmailVerified:false,
        role:role || userRolesEnum.USER,
    })

    const { unHashedToken, hashedToken, tokenExpiry }=user.generateTemporaryToken()

    user.emailVerificationToken=hashedToken
    user.emailVerificationExpiry=tokenExpiry
    await user.save({validateBeforeSave:false})
    
    await sendEmail({
        email:user?.email,
        subject:"Please verify your email",
        mailgenContent:emailVerificationMailgenContent(
            user?.username,
            `${req.protocol}://${req.get(
                "host"
              )}/api/v1/user/verify-email/${unHashedToken}`
        )
    });

    const createUser=await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        )

    if(!createUser){
        throw new ApiError(500,"User not created")
    }

    return res
              .status(201)
              .json(
                new ApiResponse(
                    200,
                    {user:createUser},
                    "Users registered successfully and verification email has been sent on your email."
                )
              )
    
})

const loginInUser=asyncHandler(async(req,res)=>{
     const {email,username,password}=req.body

     if(!username && !email){
        throw new ApiError(400,"Email or username is required")
     }

     const user=await User.findOne({
        $or:[{email},{username}]
     })

     if(!user){
        throw new ApiError(401,"Invalid credentials")
     }

     if(user.loginType !== userLoginType.EMAIL_PASSWORD){
        throw new ApiError(
            400,
            "You have previously registered using " +
              user.loginType?.toLowerCase() +
              ". Please use the " +
              user.loginType?.toLowerCase() +
              " login option to access your account."
          );
     }

     const isPasswordValid=await user.isPasswordCorrect(password)

     if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
     }

     const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)

     const loggedInUser=await User.findById(user._id).select( "-password -refreshToken -emailVerificationToken -emailVerificationExpiry")

     const options={
        httpOnly:true,
        secure:true
        // secure: process.env.NODE_ENV === "production",
     }

     return res
               .status(200)
               .cookie("accessToken",accessToken,options)
               .cookie("refreshToken",refreshToken,options)
               .json(
                new ApiResponse(
                    200,
                    {user:loggedInUser,accessToken,refreshToken},
                    "User Logged in Successfully"
                )
               )
})

const logoutUser=asyncHandler(async(req,res)=>{
      await User.findByIdAndUpdate(req.user._id,{
        $set:{
            refreshToken:undefined,
        }
      },
      {new:true}
      )
    
      const options={
        httpOnly:true,
        secure:true
        // secure: process.env.NODE_ENV === "production",
     }

     return res
                .status(200)
                .clearCookie("accessToken", options)
                .clearCookie("refreshToken", options)
                .json(new ApiResponse(200, {}, "User logged out"));


})

const verifyEmail=asyncHandler(async(req,res)=>{
    const {verificationToken}=req.params;

    if(!verificationToken){
        throw new ApiError(400,"Email verification token is missing")
    }

    let hashedToken=crypto
                        .createHash("sha256")
                        .update(verificationToken)
                        .digest("hex")

    const user=await User.findOne({
        emailVerificationToken:hashedToken,
        emailVerificationExpiry:{$gt:Date.now()}
    })

    if(!user){
        throw new ApiError(400,"token is invalid or expired")
    }

    user.emailVerificationToken=undefined
    user.emailVerificationExpiry=undefined

    user.isEmailVerified=true
    await user.save({validateBeforeSave:false})

    return res
             .status(200)
             .json(new ApiResponse(200, {isEmailVerified:true}, "Email verified successfully"));
})

const resendEmailVerification=asyncHandler(async (req,res)=>{
  
    const user=await User.findById(req.user?._id)
   
    if(!user){
        throw new ApiError(400,"User does not exists",[])
    }

    if(user.isEmailVerified){
        throw new ApiError(400,"Email is already verified!",)
    }

    const { unHashedToken, hashedToken, tokenExpiry }=user.generateTemporaryToken()

    user.emailVerificationToken=hashedToken
    user.emailVerificationExpiry=tokenExpiry
    await user.save({validateBeforeSave:false})
 

    await sendEmail({
        email:user?.email,
        subject:"Please verify your email",
        mailgenContent:emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get(
                "host"
              )}/api/v1/user/verify-email/${unHashedToken}`
        )
    })

    return res
            .status(200)
            .json(new ApiResponse(200, {}, "Mail has been sent to your mail ID"));
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const inComingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!inComingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken=await jwt.verify(inComingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user=await User.findById(decodedToken?._id)

        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }

        if(inComingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }

        const options={
            httpOnly:true,
            // secure: process.env.NODE_ENV === "production",
            secure:true
        }

        const {accessToken,refreshToken:newRefreshToken}=await generateAccessAndRefreshTokens(user._id)

        return res
                  .status(200)
                  .cookie("accessToken",accessToken,options)
                  .cookie("refreshToken",newRefreshToken,options)
                  .json(
                    new ApiResponse(
                        200,
                        {accessToken,refreshToken:newRefreshToken},
                        "Access token refreshed"
                    )
                  )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
})



export {
    registerUser,
    loginInUser,
    logoutUser,
    verifyEmail,
    resendEmailVerification,
    refreshAccessToken
}
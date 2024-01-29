import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.models.js"
import {userLoginType, userRolesEnum} from "../constant.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {emailVerificationMailgenContent, forgotPasswordMailgenContent, sendEmail} from "../utils/mail.js"
import crypto from "crypto"
import jwt from 'jsonwebtoken'

// ++++++++++++++++++++++++++ generateAccessAndRefreshToken ++++++++++++++++++++++++++
// This function generates the access token and refresh token for the user.
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

// ++++++++++++++++++++++++++ registerUser ++++++++++++++++++++++++++

// This function registers a new user.
// It takes in a request object, a response object, and a callback function.
// It first checks if the request body contains a username, email, and password.
// If not, it throws an error with a status code of 400 and a message saying "All fields are required".
// It then checks if a user with the same username or email already exists in the database.
// If so, it throws an error with a status code of 409 and a message saying "User already exists".
// If not, it creates a new user with the provided username, email, and password.
// It then generates a temporary token and a hashed token for the user's email verification.
// It then sets the user's emailVerificationToken and emailVerificationExpiry properties to the hashed token and the token expiry date.
// It then saves the user to the database.
// It then sends an email to the user with a link to verify their email.
// Finally, it returns a response with a status code of 201 and a message saying "Users registered successfully and verification email has been sent on your email."
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

// ++++++++++++++++++++++++++ loginInUser ++++++++++++++++++++++++++
// This function logs in a user.
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


// ++++++++++++++++++++++++++ logoutUser ++++++++++++++++++++++++++
// This function logs out a user.
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

// ++++++++++++++++++++++++++ verifyEmail ++++++++++++++++++++++++++
// This function verifies an email.
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

// ++++++++++++++++++++++++++ resendEmailVerification ++++++++++++++++++++++++++
// This function resends an email verification email to the user.
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

// ++++++++++++++++++++++++++ refreshAccessToken ++++++++++++++++++++++++++
// This function refreshes an access token for a user.
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

// ++++++++++++++++++++++++++ forgotPassword ++++++++++++++++++++++++++
// This function sends a password reset email to the user.
const forgotPassword=asyncHandler(async(req,res)=>{
   const {email}=req.body

   const user=await User.findOne({email})

   if(!user){
    throw new ApiError(400,"User does not exists",[])
   }

   const {unHashedToken,hashedToken,tokenExpiry}=user.generateTemporaryToken()

   user.forgotPasswordToken=hashedToken
   user.forgotPasswordExpiry=tokenExpiry
   await user.save({validateBeforeSave:false})

   await sendEmail({ 
     email:user?.email,
     subject:"Reset your password",
     mailgenContent: forgotPasswordMailgenContent(
        user.username,
        `${req.protocol}://${req.get(
        "host"
      )}/api/v1/user/reset-password/${unHashedToken}`
     )
   })

   return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password reset mail has been sent on your mail id"));
})

// ++++++++++++++++++++++++++ resetForgotPassword ++++++++++++++++++++++++++
// This function resets a password for a user.
const resetForgotPassword=asyncHandler(async(req,res)=>{
    const {resetToken}=req.params
    const {newPassword}=req.body

    let hashedToken=crypto
                        .createHash("sha256")
                        .update(resetToken)
                        .digest("hex")
    
    const user=await User.findOne({
        forgotPasswordToken:hashedToken,
        forgotPasswordExpiry:{$gt:Date.now()}
    })

    if(!user){
        throw new ApiError(400,"token is invalid or expired")
    }

    user.password=newPassword;
    await user.save({validateBeforeSave:false})

    return res
              .status(200)
              .json(new ApiResponse(200, {}, "Password reset successfully"));
})

// ++++++++++++++++++++++++++ changeCurrentPassword ++++++++++++++++++++++++++
// This function changes a current password for a user.
const changeCurrentPassword =asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body    
    
    const user=await User.findById(req.user?._id)

    const isPasswordValid=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new ApiError(400,"Invalid old password")
    }

    user.password=newPassword;  
    await user.save({validateBeforeSave:false})

    return res 
              .status(200)
              .json(new ApiResponse(200, {}, "Password changed successfully"));

})

// ++++++++++++++++++++++++++ assignRole ++++++++++++++++++++++++++
// This function assigns a role to a user.
const assignRole=asyncHandler(async(req,res)=>{ 
    const {userId}=req.params;
    const {role}=req.body
    const user=await User.findById(userId)

    if(!user){
        throw new ApiError(400,"User does not exists")
    }

    user.role=role;
    await user.save({validateBeforeSave:false})

    return res
              .status(200)
              .json(new ApiResponse(200, {}, "Role chnaged for the user")); 
    
  

})

// ++++++++++++++++++++++++++ getCurrentUser ++++++++++++++++++++++++++
const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
              .status(200)
              .json(new ApiResponse(200, req.user, "User fetched successfully"));
})

// ++++++++++++++++++++++++++ handlerSocialLogin ++++++++++++++++++++++++++
// This function handles social login.
const handlerSocialLogin=asyncHandler(async(req,res)=>{
    const user=await User.findById(req.user?._id)

    if(!user){
        throw new ApiError(400,"User does not exists")
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)

    const options={
        httpOnly:true,
        secure:true
        // secure: process.env.NODE_ENV === "production",
     }
    
     return res
              .status(301)
              .cookie("accessToken",accessToken,options)
              .cookie("refreshToken",refreshToken,options)
              .redirect(
                `${process.env.CLIENT_SSO_REDIRECT_URL}?accessToken=${accessToken}&refreshToken=${refreshToken}`
              )
    

})

// ++++++++++++++++++++++++++ updateUserAvatar ++++++++++++++++++++++++++
// This function updates a user's avatar.
const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
   
    if(!avatar){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,{
            $set:{
                avatar:avatar?.url
            }
        },
        {new:true}
    ).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")

    return res
             .status(200)
             .json(
                new ApiResponse(
                    200,
                    user,
                    "User avatar successfully"
                )
             )
    
})

const updateProfile=asyncHandler(async(req,res)=>{
    const {firstName,lastName,countryCode,phoneNumber}=req.body;
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                firstName,
                lastName,
                countryCode,
                phoneNumber
            }
        },
        {
            new:true,
        }
    )

    return res.
              status(200)
              .json(
                new ApiResponse(
                    200,
                    user,
                    "User profile updated successfully"
                )
              )
})

export {
    registerUser,
    loginInUser,
    logoutUser,
    verifyEmail,
    resendEmailVerification,
    refreshAccessToken,
    forgotPassword,
    resetForgotPassword,
    changeCurrentPassword ,
    assignRole,
    getCurrentUser,
    handlerSocialLogin,
    updateUserAvatar,
    updateProfile
}
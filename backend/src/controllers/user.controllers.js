import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.models.js"
import {userLoginType, userRolesEnum} from "../constant.js"
import {emailVerificationMailgenContent, sendEmail} from "../utils/mail.js"

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
              )}/api/v1/users/verify-email/${unHashedToken}`
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





export {
    registerUser,
    loginInUser
}
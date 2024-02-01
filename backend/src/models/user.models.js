import bcrypt from "bcrypt"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import mongoose,{Schema} from "mongoose"
import {AvailableUserLoginType, AvailableUserRoles,USER_TEMPORARY_TOKEN_EXPIRY,userLoginType,userRolesEnum} from "../constant.js"
import { Cart } from "./cart.models.js"


const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
    },
    avatar:{
        type:String,
    },
    role:{
        type:String,
        enum:AvailableUserRoles,
        default:userRolesEnum.USER,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    firstName:{
        type:String,
        default:""
    },
    lastName:{
        type:String,
        default:""
    },
    countryCode:{
        type:String,
        default:""
    },
    phoneNumber:{
        type:String,
        default:""
    },
    loginType:{
        type:String,
        enum:AvailableUserLoginType,
        default:userLoginType.EMAIL_PASSWORD
    },
    isEmailVerified:{
        type:Boolean,
        default:false,
    },
    refreshToken:{
        type:String,
    },
    forgotPasswordToken: {
        type: String,
    },
    forgotPasswordExpiry: {
        type: Date,
    },
    emailVerificationToken: {
        type: String,
    },
    emailVerificationExpiry: {
        type: Date,
    },
},{timestamps:true})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next()
    }
    this.password = await bcrypt.hash(this.password,10)
    next();
})

userSchema.post("save",async function(user,next){
    const cart=await Cart.findOne({owner:user._id})

    if(!cart){
        await Cart.create({owner:user._id})
        next()
    }
    
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            role: this.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}

userSchema.methods.generateRefreshToken= function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

userSchema.methods.generateTemporaryToken =  function(){
    const unHashedToken = crypto.randomBytes(20).toString("hex");

    const hashedToken = crypto
                            .createHash("sha256")
                            .update(unHashedToken)
                            .digest("hex");

    const tokenExpiry = Date.now() + USER_TEMPORARY_TOKEN_EXPIRY;

    return { unHashedToken, hashedToken, tokenExpiry };

}

export const User = mongoose.model("User",userSchema)
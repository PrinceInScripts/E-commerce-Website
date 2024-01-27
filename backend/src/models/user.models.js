import bcrypt from "bcrypt"
import crypto from "crypto"
import json from "jsonwebtoken"
import mongoose,{Schema} from "mongoose"
import {AvailableUserLoginType, AvailableUserRoles,userLoginType,userRolesEnum} from "../constant"


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
        default:"John"
    },
    lastName:{
        type:String,
        default:"Doe"
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

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

export const User = mongoose.model("User",userSchema)
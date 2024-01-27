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

export const User = mongoose.model("User",userSchema)
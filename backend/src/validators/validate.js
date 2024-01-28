import {validationResult} from "express-validator"
import {errorHandler} from "../middlewares/error.middlewares.js"
import {ApiError} from "../utils/ApiError.js"

export const validate = (req, res, next) => {
    const errors=validationResult(req)

    if(errors.isEmpty()){
        return next()
    }
    const extractedErrors=[]
    errors.array().map(err=>extractedErrors.push({[err.param]:err.msg}))

    throw new ApiError(400, "Validation error", extractedErrors)
}
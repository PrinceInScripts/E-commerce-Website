import {body,param} from "express-validator"

export const mongoIdPathVariableValidator = (idName)=>{
    return [
        param(idName)
                   .notEmpty()
                   .isMongoId()
                   .withMessage(`${idName} is not valid mongoId`)
    ]
}

export const mongoIdRequestBodyValidator = (idName)=>{
    return [
        body(idName)
                    .notEmpty()
                    .isMongoId()
                    .withMessage(`${idName} is not valid mongoId`)
    ]
}
import {body} from "express-validator"


const categoryRequestBodyValidator = ()=>{
    return [
        body("name")
               .notEmpty()
               .trim()
               .withMessage("name is required"),
    ]
}

export {categoryRequestBodyValidator}
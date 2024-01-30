import {body} from "express-validator"

const createAddressValidator=()=>{
    return [
        body("addressLine1")
                         .notEmpty()
                         .trim()
                         .withMessage("addressLine1 is required"),
        body("city")
                   .trim()
                   .notEmpty()
                   .withMessage("city is required"),
        body("country")
                   .notEmpty()
                   .trim()
                   .withMessage("country is required"),
        body("pincode")
                   .notEmpty()
                   .trim()
                   .withMessage("pincode is required")
                   .isNumeric()
                   .isLength({min:6,max:6})
                   .withMessage("pincode is invalid"),
        body("state")
                   .notEmpty()
                   .trim()
                   .withMessage("state is required"),
    ]
}

const updateAddressValidator=()=>{
    return [
        body("addressLine1")
                         .optional()
                         .trim()
                         .notEmpty()
                         .withMessage("addressLine1 is required"),
        body("city")
                   .optional()
                   .trim()
                   .notEmpty()
                   .withMessage("city is required"),
        body("country")
                   .optional()
                   .trim()
                   .notEmpty()
                   .withMessage("country is required"),
        body("pincode")
                   .optional()
                   .trim()
                   .notEmpty()
                   .withMessage("pincode is required")
                   .isNumeric()
                   .isLength({min:6,max:6})
                   .withMessage("pincode is invalid"),
        body("state")
                   .optional()  
                   .trim()
                   .notEmpty()
                   .withMessage("state is required"),
    ]
}

export {
    createAddressValidator,
    updateAddressValidator

}
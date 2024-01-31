import { body } from 'express-validator'
import { AvailableCouponType } from "../../constant.js"

const createCouponValidator = ()=>{
    return [
        body("name")
                    .trim()
                    .notEmpty()
                    .withMessage("Name is required"),
        body("couponCode")
                     .trim()
                     .notEmpty()
                     .withMessage("Coupon Code is required")
                     .isLength({min:4})
                     .withMessage("Coupon Code must be at least 4 characters long"),
        body("type")
                    .optional()
                    .trim()
                    .notEmpty()
                    .isInt(AvailableCouponType)
                    .withMessage("Invalid coupon type"),
        body("discountValue")
                    .trim()
                    .notEmpty()
                    .withMessage("Discount Value is required")
                    .isInt({min:1})
                    .withMessage("Discount Value must be greather than 0"),
        body("minimumCartValue")
                     .optional()
                     .trim()
                     .notEmpty()
                     .withMessage("Invalid minimum cart value")
                     .isInt({min:0})
                     .withMessage("Minimum cart value cannot be negative"),
        body("startDate")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Start date is required")
                    .isISO8601()
                    .withMessage("Invalid start date. Date must be in ISO8601 format"),
        body("expiryDate")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Expiry date is required")
                    .isISO8601()
                    .withMessage("Invalid expiry date. Date must be in ISO8601 format"),
                     
    ]
}

const updateCouponValidator = ()=>{
    return [
        body("name")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Name is required"),
        body("couponCode")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Coupon Code is required")
                    .isLength({min:4})
                    .withMessage("Coupon Code must be at least 4 characters long"),
        body("type")
                    .optional()
                    .trim()
                    .notEmpty()
                    .isInt(AvailableCouponType)
                    .withMessage("Invalid coupon type"),
        body("discountValue")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Discount Value is required")
                    .isInt({min:1})
                    .withMessage("Discount Value must be greather than 0"),
        body("minimumCartValue")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Minimum cart value cannot be negative"),
        body("startDate")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Start date is required")
                    .isISO8601()
                    .withMessage("Invalid start date. Date must be in ISO8601 format"),
        body("expiryDate")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Expiry date is required")
                    .isISO8601()
                    .withMessage("Invalid expiry date. Date must be in ISO8601 format"),
    ]
}

const applyCouponCodeValidator = ()=>{
    return [
        body("couponCode")
                    .trim()
                    .notEmpty()
                    .withMessage("Coupon Code is required")
                    .isLength({min:4})
                    .withMessage("Invalid coupon code"),
    ]
}

const couponActivityStatusValidator = ()=>{
    return [
        body("isActive")
                    .notEmpty()
                    .withMessage("Activity status is required")
                    .isBoolean({strict:true})
                    .withMessage("isActive must be a boolean. Either true or false"),
    ]
}



export {
    createCouponValidator,
    updateCouponValidator,
    applyCouponCodeValidator,
    couponActivityStatusValidator
}
import {Router} from "express"
import { verifyJWT, verifyPermission } from "../middlewares/auth.middlewares.js"
import { userRolesEnum } from "../constant.js"
import { applyCouponCodeValidator, createCouponValidator } from "../validators/app/coupon.validators.js"
import { validate } from "../validators/validate.js"
import { applyCoupon, createCoupon, getAllCoupons, getCouponById, getValidCouponsForCustomer, removeCouponFromCart } from "../controllers/coupon.controller.js"
import { mongoIdPathVariableValidator } from "../validators/mongodb.validators.js"
const router=Router()

router.use(verifyJWT)

router.route("/c/apply")
                .post(applyCouponCodeValidator(),validate,applyCoupon)

router.route("/c/remove")
                .post(removeCouponFromCart)

router.route("/customer/available")
                .get(getValidCouponsForCustomer)

router.use(verifyPermission([userRolesEnum.ADMIN]))


router.route("/")
                .get(getAllCoupons)
                .post(createCouponValidator(),validate,createCoupon)

router.route("/:couponId")
                .get(mongoIdPathVariableValidator("couponId"),validate,getCouponById)          
             

export default router;
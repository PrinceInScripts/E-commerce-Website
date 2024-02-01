import {Router} from "express"
import { verifyJWT, verifyPermission } from "../middlewares/auth.middlewares.js"
import { userRolesEnum } from "../constant.js"
import { applyCouponCodeValidator, createCouponValidator } from "../validators/app/coupon.validators.js"
import { validate } from "../validators/validate.js"
import { applyCoupon, createCoupon, removeCouponFromCart } from "../controllers/coupon.controller.js"

const router=Router()

router.use(verifyJWT)

router.route("/c/apply")
                .post(applyCouponCodeValidator(),validate,applyCoupon)

router.route("/c/remove")
                .post(removeCouponFromCart)

router.use(verifyPermission([userRolesEnum.ADMIN]))

router.route("/")
                .post(createCouponValidator(),validate,createCoupon)

               
             

export default router;
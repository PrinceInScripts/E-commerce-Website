import {Router} from "express"
import { verifyJWT, verifyPermission } from "../middlewares/auth.middlewares.js"
import { userRolesEnum } from "../constant.js"
import { createCouponValidator } from "../validators/app/coupon.validators.js"
import { validate } from "../validators/validate.js"
import { createCoupon } from "../controllers/coupon.controller.js"

const router=Router()

router.use(verifyJWT)


router.use(verifyPermission([userRolesEnum.ADMIN]))

router.route("/")
                .post(createCouponValidator(),validate,createCoupon)
               
             

export default router;
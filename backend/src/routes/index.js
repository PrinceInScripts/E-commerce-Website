import {Router} from "express"
import userRoute from "./user.routes.js"
import addressesRoute from "./address.routes.js"
import categoriesRoute from "./category.routes.js"
import productsRoute from "./product.routes.js"
import couponsRoute from "./coupon.routes.js"

const router=Router()

router.use("/user",userRoute)
router.use("/addresses",addressesRoute)
router.use("/categories",categoriesRoute)
router.use("/coupons",couponsRoute)


export default router
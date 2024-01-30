import {Router} from "express"
import userRoute from "./user.routes.js"
import addressesRoute from "./address.routes.js"
import categoriesRoute from "./category.routes.js"
import productsRoute from "./product.routes.js"

const router=Router()

router.use("/user",userRoute)
router.use("/addresses",addressesRoute)
router.use("/categories",categoriesRoute)
router.use("/products",productsRoute)


export default router
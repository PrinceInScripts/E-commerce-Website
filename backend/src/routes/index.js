import {Router} from "express"
import userRoute from "./user.routes.js"
import addressesRoute from "./address.routes.js"

const router=Router()

router.use("/user",userRoute)
router.use("/addresses",addressesRoute)


export default router
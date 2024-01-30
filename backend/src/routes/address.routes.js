import {Router} from "express"
import { createAddressValidator } from "../validators/app/address.validators.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"
import { validate } from "../validators/validate.js"
import { createAddress, getAllAddress } from "../controllers/address.controller.js"

const router=Router()

router.use(verifyJWT)

router.route("/")
              .post(createAddressValidator(),validate,createAddress)
              .get(getAllAddress)

export default router

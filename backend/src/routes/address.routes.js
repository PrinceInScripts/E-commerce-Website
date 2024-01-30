import {Router} from "express"
import { createAddressValidator } from "../validators/app/address.validators.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"
import { validate } from "../validators/validate.js"
import { createAddress, getAddressById, getAllAddress } from "../controllers/address.controller.js"
import { mongoIdPathVariableValidator } from "../validators/mongodb.validators.js"

const router=Router()

router.use(verifyJWT)

router.route("/")
              .post(createAddressValidator(),validate,createAddress)
              .get(getAllAddress)

router.route("/:addressId")
                .get(mongoIdPathVariableValidator("addressId"),validate,getAddressById)

export default router

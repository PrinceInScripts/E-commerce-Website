import {Router} from "express"
import {} from "../validators/mongodb.validators.js"
import { validate } from "../validators/validate.js"
import { verifyJWT, verifyPermission } from "../middlewares/auth.middlewares.js"
import { userRolesEnum } from "../constant.js"
import { categoryRequestBodyValidator } from "../validators/app/category.validators.js"
import { createCategory } from "../controllers/category.controller.js"



const router=Router()

router.route("/")
                .post(verifyJWT,categoryRequestBodyValidator(),verifyPermission([userRolesEnum.ADMIN]),validate,createCategory)



export default router;
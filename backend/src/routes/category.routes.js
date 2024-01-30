import {Router} from "express"
import { mongoIdPathVariableValidator } from "../validators/mongodb.validators.js"
import { validate } from "../validators/validate.js"
import { verifyJWT, verifyPermission } from "../middlewares/auth.middlewares.js"
import { userRolesEnum } from "../constant.js"
import { categoryRequestBodyValidator } from "../validators/app/category.validators.js"
import { createCategory, deletecategory, getAllCategories, getCategoryById, updateCategory } from "../controllers/category.controller.js"



const router=Router()

router.route("/")
                .post(verifyJWT,categoryRequestBodyValidator(),verifyPermission([userRolesEnum.ADMIN]),validate,createCategory)
                .get(getAllCategories)

router.route("/:categoryId")
                .get(mongoIdPathVariableValidator("categoryId"),validate,getCategoryById)               
                .patch(verifyJWT,verifyPermission([userRolesEnum.ADMIN]),categoryRequestBodyValidator(),mongoIdPathVariableValidator("categoryId"),validate,updateCategory)
                .delete(verifyJWT,verifyPermission([userRolesEnum.ADMIN]),mongoIdPathVariableValidator("categoryId"),validate,deletecategory)


export default router;
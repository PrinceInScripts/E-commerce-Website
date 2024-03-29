import {Router} from "express"
import { createProduct, deleteProduct, getAllProducts, getProductByCategory, getProductById, removeProductSubImages, updateProduct } from "../controllers/product.controller.js"
import { verifyJWT, verifyPermission } from "../middlewares/auth.middlewares.js"
import { MAXIMUM_SUB_IMAGE_COUNT, userRolesEnum } from "../constant.js"
import { createProductvalidator, updateProductValidator } from "../validators/app/product.validatos.js"
import { validate } from "../validators/validate.js"
import { upload } from "../middlewares/multer.middlewares.js"
import { mongoIdPathVariableValidator } from "../validators/mongodb.validators.js"

const router = Router()


router.route("/")
                .get(getAllProducts)
                .post(verifyJWT,verifyPermission([userRolesEnum.ADMIN]),upload.fields([
                    {name:"mainImage",maxCount:1},
                    {name:"subImages",maxCount:MAXIMUM_SUB_IMAGE_COUNT}
                ]),
                createProductvalidator(),validate,createProduct)

router.route("/:productId")
                .patch(
                    verifyJWT,
                    verifyPermission([userRolesEnum.ADMIN]),
                    upload.fields([
                        {
                            name:"mainImage",
                            maxCount:1
                        },
                        {
                            name:"subImages",
                            maxCount:MAXIMUM_SUB_IMAGE_COUNT
                        }
                    ]),
                    mongoIdPathVariableValidator("productId"),
                    updateProductValidator(),
                    validate,
                    updateProduct
                )
                .get(mongoIdPathVariableValidator("productId"),validate,getProductById)
                .delete(verifyJWT,verifyPermission([userRolesEnum.ADMIN]),mongoIdPathVariableValidator("productId"),validate,deleteProduct)
    

    router.route("/category/:categoryId")
                .get(mongoIdPathVariableValidator("categoryId"),validate,getProductByCategory)


    
    router.route("/remove/subimage/:productId/:subImageId")
                .patch(
                    verifyJWT,
                    verifyPermission([userRolesEnum.ADMIN]),
                    mongoIdPathVariableValidator("productId"),
                    mongoIdPathVariableValidator("subImageId"),
                    validate,
                    removeProductSubImages
                )

export default router
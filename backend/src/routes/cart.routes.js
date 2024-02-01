import { Router } from "express";
import { addItemOrUpdateItemQuantityValidator } from "../validators/app/cart.validatiors.js"
import { mongoIdPathVariableValidator } from "../validators/mongodb.validators.js"
import { validate } from "../validators/validate.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { addItemOrUpdateItemQuantity, clearCart, getUserCart, removeItemFromCart } from "../controllers/cart.controller.js";


const router=Router();

router.use(verifyJWT)

router.route("/").get(getUserCart)

router.route("/clear").delete(clearCart)

router.route("/item/:productId")
                    .post(mongoIdPathVariableValidator("productId"),addItemOrUpdateItemQuantityValidator(),validate,addItemOrUpdateItemQuantity)
                    .delete(mongoIdPathVariableValidator("productId"), validate, removeItemFromCart)


export default router;
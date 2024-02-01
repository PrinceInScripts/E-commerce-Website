import { Router } from "express";

import {} from "../validators/mongodb.validators.js"
import {} from "../validators/validate.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { getUserCart } from "../controllers/cart.controller.js";


const router=Router();

router.use(verifyJWT)

router.route("/").get(getUserCart)


export default router;
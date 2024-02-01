import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { validate } from "../validators/validate.js";
import { generateRazorpayOrder } from "../controllers/order.controller.js";
import { mongoIdPathVariableValidator, mongoIdRequestBodyValidator } from "../validators/mongodb.validators.js";


const router = Router();

router.use(verifyJWT)

router.route("/provider/razorpay")
                  .post(mongoIdRequestBodyValidator("addressId"),validate,generateRazorpayOrder)


export default router;
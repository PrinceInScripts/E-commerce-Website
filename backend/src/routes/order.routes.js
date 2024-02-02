import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { validate } from "../validators/validate.js";
import { generateRazorpayOrder, generatedPaypalOrder, verifyPaypalPayment, verifyRazorpayPayment } from "../controllers/order.controller.js";
import { mongoIdPathVariableValidator, mongoIdRequestBodyValidator } from "../validators/mongodb.validators.js";
import { verifyPaypalPaymentValidator, verifyRazorpayPaymentValidator } from "../validators/app/order.validators.js";


const router = Router();

router.use(verifyJWT)

router.route("/provider/razorpay")
                  .post(mongoIdRequestBodyValidator("addressId"),validate,generateRazorpayOrder)

router.route("/provider/paypal")
                  .post(mongoIdRequestBodyValidator("addressId"), validate, generatedPaypalOrder)

router.route("/provider/razorpay/verify-payment")
                  .post(verifyRazorpayPaymentValidator(),validate,verifyRazorpayPayment)

router.route("/provider/paypal/verify-payment")
                  .post(verifyPaypalPaymentValidator(),validate,verifyPaypalPayment)
export default router;
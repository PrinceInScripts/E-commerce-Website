import { Router } from "express";
import { verifyJWT, verifyPermission } from "../middlewares/auth.middlewares.js";
import { validate } from "../validators/validate.js";
import { generateRazorpayOrder, generatedPaypalOrder, updatedOrderStatus, verifyPaypalPayment, verifyRazorpayPayment } from "../controllers/order.controller.js";
import { mongoIdPathVariableValidator, mongoIdRequestBodyValidator } from "../validators/mongodb.validators.js";
import { orderUpdateStatusValidator, verifyPaypalPaymentValidator, verifyRazorpayPaymentValidator } from "../validators/app/order.validators.js";
import { userRolesEnum } from "../constant.js";


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



router.route("/status/:orderId")
                  .patch(mongoIdPathVariableValidator("orderId"),verifyPermission([userRolesEnum.ADMIN]),orderUpdateStatusValidator(),validate,updatedOrderStatus)
export default router;
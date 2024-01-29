import { Router } from "express";
import { changeCurrentPassword, forgotPassword, loginInUser, logoutUser, refreshAccessToken, registerUser, resendEmailVerification, resetForgotPassword, verifyEmail } from "../controllers/user.controllers.js";
import { userChangeCurrentPasswordValidator, userForgotPasswordValidator, userLoginValidator, userRegisterValidator, userResetForgottenPasswordValidator } from "../validators/user.validators.js"
import { validate } from "../validators/validate.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";


const router=Router();

router.route("/register").post(userRegisterValidator(),validate,registerUser)
router.route("/login").post(userLoginValidator(),validate,loginInUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/verify-email/:verificationToken").get(verifyEmail);

router.route("/forgot-password").post(userForgotPasswordValidator(),validate,forgotPassword);
router.route("/reset-password/:resetToken").post(userResetForgottenPasswordValidator(),validate,resetForgotPassword);


router.route("/logout").post(verifyJWT,logoutUser)
router.route("/resend-email-verification").post(verifyJWT,resendEmailVerification)
router.route("/change-password").post(verifyJWT,userChangeCurrentPasswordValidator(),validate,changeCurrentPassword)



export default router;
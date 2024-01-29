import { Router } from "express";
import passport from "passport";
import { assignRole, changeCurrentPassword, forgotPassword, getCurrentUser, loginInUser, logoutUser, refreshAccessToken, registerUser, resendEmailVerification, resetForgotPassword, updateProfile, updateUserAvatar, verifyEmail } from "../controllers/user.controllers.js";
import { userAssignRoleValidator, userChangeCurrentPasswordValidator, userForgotPasswordValidator, userLoginValidator, userRegisterValidator, userResetForgottenPasswordValidator, userUpdateValidator } from "../validators/user.validators.js"
import { validate } from "../validators/validate.js";
import { verifyJWT, verifyPermission } from "../middlewares/auth.middlewares.js";
import "../passport/index.js"
import { upload } from "../middlewares/multer.middlewares.js"
import { userRolesEnum } from "../constant.js";
import { mongoIdPathVariableValidator } from "../validators/mongodb.validators.js";


const router=Router();

router.route("/register").post(userRegisterValidator(),validate,registerUser)
router.route("/login").post(userLoginValidator(),validate,loginInUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/verify-email/:verificationToken").get(verifyEmail);

router.route("/forgot-password").post(userForgotPasswordValidator(),validate,forgotPassword);
router.route("/reset-password/:resetToken").post(userResetForgottenPasswordValidator(),validate,resetForgotPassword);


router.route("/logout").post(verifyJWT,logoutUser)
router.route("/avatar").post(verifyJWT,upload.single('avatar'),updateUserAvatar)
router.route("/current-user").post(verifyJWT,getCurrentUser)
router.route("/resend-email-verification").post(verifyJWT,resendEmailVerification)
router.route("/change-password").post(verifyJWT,userChangeCurrentPasswordValidator(),validate,changeCurrentPassword)
router.route("/update-profile").post(verifyJWT,userUpdateValidator(),validate,updateProfile)
router.route("/assign-role/:userId").post(verifyJWT,verifyPermission([userRolesEnum.ADMIN]),mongoIdPathVariableValidator("userId"),userAssignRoleValidator(),validate,assignRole)

router.route("/google").get(
    passport.authenticate('google',{scope:["profile","email"]}),
    (req,res)=>{res.send("redirecting to google....")}
)

router.route("/github").get(
    passport.authenticate('github',{scope:["profile","email"]}),
    (req,res)=>{res.send("redirecting to github....")}
)

router.route("/google/callback").get(passport.authenticate("google"))
router.route("/github/callback").get(passport.authenticate("github"))

export default router;
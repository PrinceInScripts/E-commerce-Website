import { Router } from "express";
import { loginInUser, logoutUser, registerUser } from "../controllers/user.controllers.js";
import { userLoginValidator, userRegisterValidator } from "../validators/user.validators.js"
import { validate } from "../validators/validate.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";


const router=Router();

router.route("/register").post(userRegisterValidator(),validate,registerUser)
router.route("/login").post(userLoginValidator(),validate,loginInUser)


router.route("/logout").post(verifyJWT,logoutUser)


export default router;
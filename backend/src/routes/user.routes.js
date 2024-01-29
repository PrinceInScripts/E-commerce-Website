import { Router } from "express";
import { loginInUser, registerUser } from "../controllers/user.controllers.js";
import { userLoginValidator, userRegisterValidator } from "../validators/user.validators.js"
import { validate } from "../validators/validate.js";


const router=Router();

router.route("/register").post(userRegisterValidator(),validate,registerUser)
router.route("/login").post(userLoginValidator(),validate,loginInUser)


export default router;
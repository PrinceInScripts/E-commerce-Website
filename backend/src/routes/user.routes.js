import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
import { userRegisterValidator } from "../validators/user.validators.js"
import { validate } from "../validators/validate.js";


const router=Router();

router.route("/register").post(userRegisterValidator(),validate,registerUser)


export default router;
import {Router} from "express"
import { getAllProducts } from "../controllers/product.controller.js"

const router = Router()


router.route("/")
                .get(getAllProducts)

export default router
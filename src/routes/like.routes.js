import {Router} from "express"
import { verifyJwt } from "../middlewares/auth.middleware";
import {toggleVideoLike} from "../controllers/like.controller.js"

const router = Router();

router.route("/toggle/v/:videoId").post(
    verifyJwt,
    toggleVideoLike
)
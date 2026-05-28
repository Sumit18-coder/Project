import {Router} from "express"
import { verifyJwt } from "../middlewares/auth.middleware";
import {toggleVideoLike,toggleCommentLike,toggleTweetLike, getLikedVideos} from "../controllers/like.controller.js"

const router = Router();

router.route("/toggle/v/:videoId").post(
    verifyJwt,
    toggleVideoLike
)

router.route("/toggle/c/:commentId").post(
    verifyJwt,
    toggleCommentLike
)

router.route("toggle/t/:tweetId").post(
    verifyJwt,
    toggleTweetLike
)

router.route("/videos").get(
    verifyJwt,
    getLikedVideos
)
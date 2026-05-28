import {Router} from "express"
import {verifyJwt} from "../middlewares/auth.middleware.js"
import {getVideoComment, addComment, updateComment, deleteComment} from "../controllers/comment.controller.js"

const router = Router();

router.route("/:videoId").get(
    getVideoComment
)

router.route("/:videoId").post(
    verifyJwt,
    addComment
)

router.route("/:commentId").patch(
    verifyJwt,
    updateComment
)

router.route(":commentId").delete(
    verifyJwt,
    deleteComment
)
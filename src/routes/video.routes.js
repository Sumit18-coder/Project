import {Router} from "express";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJwt} from "../middlewares/auth.middleware.js"
import {deleteVideo, publishAVideo, togglePublishedStatus, updateVideo} from "../controllers/video.controller.js"

const router = Router();

router.route("/publish-video").post(
   verifyJwt,
   upload.fields([
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
   ]),
   publishAVideo
)

router.route("/:videoId").patch(
    verifyJwt,
    upload.single("thumbnail"),
    updateVideo
)

router.route("/:videoId")
.delete(
    verifyJwt,
    deleteVideo
)

router.route("/toggle/publish/:videoId").patch(
    verifyJwt,
    togglePublishedStatus
)
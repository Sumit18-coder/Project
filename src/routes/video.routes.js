import {Router} from "express";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJwt} from "../middlewares/auth.middleware.js"
import {getAllVideos, getVideoById, deleteVideo, publishAVideo, togglePublishedStatus, updateVideo} from "../controllers/video.controller.js"

const router = Router();

router.route("/").get(
    verifyJwt,
    getAllVideos
)

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

router.route("/:videoId").get(
    verifyJwt,
    getVideoById
)

router.route("/:videoId")
.delete(
    verifyJwt,
    deleteVideo
)

router.route("/:videoId").patch(
    verifyJwt,
    upload.single("thumbnail"),
    updateVideo
)

router.route("/toggle/publish/:videoId").patch(
    verifyJwt,
    togglePublishedStatus
)

export default router;
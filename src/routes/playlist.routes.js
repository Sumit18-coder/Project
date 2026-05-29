import {Router} from "express"
import {verifyJwt} from "../middlewares/auth.middleware"
import {createPlaylist, getUserPlaylist, getPlaylistById, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist} from "../controllers/playlist.controller.js"

const router = Router();

router.route("/").post(
    verifyJwt,
    createPlaylist
)

router.route("/user/:userId").get(
    getUserPlaylist
)

router.route("/:playlistId").get(
    getPlaylistById
)

router.route("/:playlistId/videos/:videoId").post(
    verifyJwt,
    addVideoToPlaylist
)

router.route("/:playlistId/videos/:videoId").delete(
    verifyJwt,
    removeVideoFromPlaylist
)

router.route("/:playlistId").delete(
    verifyJwt,
    deletePlaylist
)

router.route("/:playlistId").patch(
    verifyJwt,
    updatePlaylist
)

export default router;
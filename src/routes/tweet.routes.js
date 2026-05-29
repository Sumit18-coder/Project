import {Router} from "express"
import {verifyJwt} from "../middlewares/auth.middleware.js"
import {createTweet, getUserTweets, updateTweet, deleteTweet} from "../controllers/tweet.controller.js"

const router = Router();

router.route("/").post(
    verifyJwt,
    createTweet
)

router.route("/user/:userId").get(
    verifyJwt,
    getUserTweets
)

router.route("/:tweetId").patch(
    verifyJwt,
    updateTweet
)

router.route("/:tweetId").delete(
    verifyJwt,
    deleteTweet
)

export default router;

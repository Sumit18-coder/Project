import {Router} from "express";
import {verifyJwt} from "../middlewares/auth.middleware.js"
import {toggleSubscription, getUserChannelSubscriber, getSubscribedChannel} from "../controllers/subcription.controller.js"

const router = Router();

router.route("/c/:channelId")
      .post(verifyJwt,toggleSubscription)

router.route("/channel/:channelId/subscribers")
      .get(
        verifyJwt,
        getUserChannelSubscriber
      )

router.route("/subscribed/:subscriberId")
      .get(
        verifyJwt,
        getSubscribedChannel
      )
export default router;
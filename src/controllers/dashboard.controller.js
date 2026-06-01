import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import supabase from "../../config/supabase.js";

const getChannelStats = asyncHandler(async(req, res) => {
    const userId = req.user.id;

    //total views
    const { count: totalVideos, error: videoError } = await supabase
         .from("videos")
         .select("*", {
            count: "exact",
            head: true
         })
         .eq("owner", userId)

    if(videoError){
        throw new ApiError(
            500,
            videoError.message
        )
    }

    //get all user videos
    const { data: userVideos, error: userVideoError} = await supabase
          .from("videos")
          .select("id, views")
          .eq("owner",userId)

    if(userVideoError){
        throw new ApiError(
            500,
            userVideoError.message
        )
    }

    //total views
    const totalViews = userVideos.reduce(
        (acc, video) => acc + (video.views || 0),
        0
    )

    //video ids
    const videoIds = userVideos.map(
        (video) => video.id
    );

    //total likes on videos
    let totalLikes = 0;
    if(videoIds.length > 0){
        const {count: likesCount, error: likesError} = await supabase
           .from("likes")
           .select("*",{
            count: "exact",
            head: true
           })
           .in("video",videoIds)

        if(likesError){
            throw new ApiError(
                404,
                likesError.message
            )
        }

        totalLikes = likesCount;
    }

    //total subscribers
    const { count: totalSubscribers, error: subscriberError} = await supabase
       .from("subscription")
       .select("*",{
        count: "exact",
        head: true
       })
       .eq("channel",userId)

    if(subscriberError){
        throw new ApiError(
            500,
            subscriberError.message
        )
    }

    const stats = {
        totalVideos,
        totalViews,
        totalLikes,
        totalSubscribers
    }

    return res
         .status(200)
         .json(
            new ApiResponse(
                200,
                stats,
                "Channel stats fetched successfully"
            )
         )
})

const getChannelVideos = asyncHandler(async(req, res) => {
     const { channelId } = req.params;

    // validate channel id
    if (!channelId) {
        throw new ApiError(
            400,
            "Channel id is required"
        );
    }

    //fetch channel videos
    const {data: videos, error} = await supabase
          .from("videos")
          .select(`
            *,
            users: owner (
            id,
            username,
            fullname,
            avatar
        )
    `)
    .eq("owner",channelId)
    .order("created_at", {
        ascending: false
    })

    if(error){
        throw new ApiError(
            500,
            error.message
        )
    }

    return res
         .status(200)
         .json(
            new ApiResponse(
                200,
                videos,
                "Channel videos fetched successfully"
            )
         )
})

export {getChannelStats, getChannelVideos};
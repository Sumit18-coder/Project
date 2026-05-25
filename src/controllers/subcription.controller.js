import supabase from "../../config/supabase.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    //validate channel id
    if (!channelId) {
        throw new ApiError(
            400,
            "Channel id is required"
        )
    }

    //prevent self subscribe 
    if (channelId === req.user.id) {
        throw new ApiError(
            400,
            "You cannot subscribe to yourself"
        )
    }

    //check if subscription already exists
    const {
        data: existingSubscription,
        error: fetchError
    } = await supabase
        .from("subscription")
        .select("*")
        .eq("subscriber", req.user.id)
        .eq("channel", channelId)
        .maybeSingle();

    if (fetchError) {
        throw new ApiError(
            500,
            fetchError.message
        )
    }

    //unsubscribe
    if (existingSubscription) {
        const { error: deleteError } = await supabase
            .from("subscription")
            .delete()
            .eq("id", existingSubscription.id);

        if (deleteError) {
            throw new ApiError(
                500,
                deleteError.message
            )
        }
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Channel unsubscribed successfully"
                )
            )
    }

    //subscriber
    const {
        data: newSubscription,
        error: insertError
    } = await supabase
        .from("subscription")
        .insert([
            {
                subscriber: req.user.id,
                channel: channelId
            }
        ])
        .select()
        .single()

    if (insertError) {
        throw new ApiError(
            500,
            insertError.message
        )
    }

    return res
        .status(200)
        .json(
            new ApiError(
                200,
                newSubscription,
                "Channel subscribed successfully"
            )
        )
})

const getUserChannelSubscriber = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    //validate channel id
    if (!channelId) {
        throw new ApiError(
            400,
            "Channel id is required"
        )
    }

    //get subscriber
    const { data: subscribers,
        error
    } = await supabase
        .from("subscription")
        .select(`
            id,
            created_at,
            users:subscriber(
            id,
            username,
            fullname,
            avatar,
            email
        )
    `)
        .eq("channel", channelId)

    if (error) {
        throw new ApiError(
            500,
            error.message
        )
    }

    //format response
    const formattedSubscribers = subscribers.map((item) => ({
        subscriptionId: item.id,
        subscribedAt: item.created_at,
        subscriber: item.users
    }))

    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                formattedSubscribers,
                "Subscribers fetched successfully"
            )
           )
})

const getSubscribedChannel = asyncHandler(async(req, res) => {
    const {subscriberId} = req.params

    //validate subscriberId
    if(!subscriberId){
        throw new ApiError(
            400,
            "Subscriber id is required"
        )
    }

    //get subscribed channel
    const {data: subscriptions,  error} = await supabase
         .from("subscription")
         .select(`
            id,
            created_at,
            users: channel (
            id,
            username,
            fullname,
            avatar,
            email,
            cover_image
        )
    `)
    .eq("subscriber", subscriberId)

    if(error){
        throw new ApiError(
            500,
            error.message
        )
    }

    //format response
    const subscribedChannels = subscriptions.map((item) => ({
        subscriberId: item.id,
        subscribedAt: item.created_at,
        channel: item.users
    }))

    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                subscribedChannels,
                "Subscribed channels fetched successfully"
            )
           )
})

export { toggleSubscription, getUserChannelSubscriber, getSubscribedChannel };
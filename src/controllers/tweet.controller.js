import supabase from "../../config/supabase.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content?.trim) {
        throw new ApiError(
            400,
            "Tweet content is required"
        )
    }

    //create a tweet
    const { data: tweet, error } = await supabase
        .from("tweets")
        .insert([
            {
                content,
                owner: req.user.id
            }
        ])
        .select(`
        *,
        users:owner (
            id,
            username,
            fullname,
            avatar
        )`)
        .single()

    if (error) {
        throw new ApiError(
            500,
            error.message
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                tweet,
                "Tweet created successfully"
            )
        )


})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(
            400,
            "user id is required"
        )
    }

    //fetch user tweets
    const { data: tweets, error } = await supabase
        .from("tweets")
        .select(`
            *,
            users: owner(
                 id, 
                 username,
                 fullname,
                 avatar
            )
        `)
        .eq("owner", userId)
        .order("created_at", {
            ascending: false
        })

    if (error) {
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
                tweets,
                "User tweets fetched successfully"
            )
        )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    //validate tweet id
    if (!tweetId) {
        throw new ApiError(
            400,
            "tweet id is required"
        )
    }

    //validate content
    if (!content) {
        throw new ApiError(
            400,
            "tweet content is required"
        )
    }

    //check if tweet exists
    const { data: existingTweet, error: fetchError } = await supabase
        .from("tweets")
        .select("*")
        .eq("id", tweetId)
        .single();

    if (fetchError || !existingTweet) {
        throw new ApiError(
            404,
            "tweet not found"
        )
    }
    //ownership check
    if (existingTweet.owner !== req.user.id) {
        throw new ApiError(
            403,
            "Unauthorized request"
        )
    }

    //update tweet
    const { data: updatedTweet, error: updateError } = await supabase
        .from("tweets")
        .update({
            content
        })
        .eq("id", tweetId)
        .select(`
            *,
            users: owner(
            id,
            username,
            fullname,
            avatar
        )
    `)
        .single()

    if (updateError) {
        throw new ApiError(
            500,
            updateError.message
        )
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            updatedTweet,
            "Tweet updated successfully"
        ))
})

const deleteTweet = asyncHandler(async(req, res) => {
    const {tweetId} = req.params;

    //validate tweet id
    if (!tweetId) {
        throw new ApiError(
            400,
            "tweet id is required"
        )
    }

     //check if tweet exists
    const { data: existingTweet, error: fetchError } = await supabase
        .from("tweets")
        .select("*")
        .eq("id", tweetId)
        .single();

    if (fetchError || !existingTweet) {
        throw new ApiError(
            404,
            "tweet not found"
        )
    }
    //ownership check
    if (existingTweet.owner !== req.user.id) {
        throw new ApiError(
            403,
            "Unauthorized request"
        )
    }

    const {error : deleteError} = await supabase
          .from("tweets")
          .delete()
          .eq("id",tweetId)


    if(deleteError){
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
                "Tweet deleted successfully"
            )
        )
})

export { createTweet, getUserTweets, updateTweet, deleteTweet }
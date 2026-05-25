import supabase from "../../config/supabase.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    //validate video id
    if (!videoId) {
        throw new ApiError(
            400,
            "Video id is required"
        )
    }

    //check if already liked
    const {
        data: existingLike,
        error: fetchError
    } = await supabase
        .from("likes")
        .select("*")
        .eq("video", videoId)
        .eq("liked_by", req.user.id)
        .maybeSingle();


    if (error) {
        throw new ApiError(
            500,
            fetchError.error
        )
    }

    //unlike
    if (existingLike) {
        const {
            error: deleteError
        } = await supabase
            .from("likes")
            .delete()
            .eq("id", existingLike.id)

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
                    "Video unliked successfully"
                )
            )
    }

    //like
    const { data: newLike,
        error: insertError
    } = await supabase
        .from("likes")
        .insert([
            {
                video: videoId,
                liked_by: req.user.id
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
            new ApiResponse(
                200,
                newLike,
                "Video liked successfully"
            )
        )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    //validate comment id
    if (commentId) {
        throw new ApiError(
            200,
            "commentId is required"
        )
    }

    //check if already liked
    const {
        data: existingLike,
        error: fetchError
    } = await supabase
        .from("likes")
        .select("*")
        .eq("comment", commentId)
        .eq("liked_by", req.user.id)
        .maybeSingle()

    if (fetchError) {
        throw new ApiError(
            500,
            fetchError.message
        )
    }

    //unlike
    if (existingLike) {
        const { error: deleteError } = await supabase
            .from("likes")
            .delete()
            .eq("id", existingLike.id)

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
                    "Comment unliked successfully"
                )
            )
    }
    //like
    const {
        data: newLike,
        error: insertError } = await supabase
            .from("likes")
            .insert([
                {
                    comment: commentId,
                    liked_by: req.user.id
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
            200,
            newLike,
            "Comment liked successfully"
        )
})

export { toggleVideoLike, toggleCommentLike };
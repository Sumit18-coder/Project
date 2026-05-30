import supabase from "../../config/supabase.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComment = asyncHandler(async (req, res) => {
    //get all comments for the videos
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    //validate video
    if (!videoId) {
        throw new ApiError(
            400,
            "video id is required"
        )
    }
    //pagination values
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const from = (pageNumber - 1) * limitNumber;
    const to = from + limitNumber - 1;

    //fetch comments
    const { data: comments, error, count } = await supabase
        .from("comments")
        .select(`
        id,
        content,
        created_at,

        users:owner (
            id,
            username,
            fullname,
            avatar
        )
    `, {
            count: "exact"
        })
        .eq("video", videoId)
        .order("created_at", {
            ascending: false
        })
        .range(from, to);

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
                {
                    comments,
                    totalComments: count,
                    currentPage: pageNumber,
                    totalComments: Math.ceil(
                        count / limitNumber
                    )
                },
                "Video comments fetched successfully"
            )
        )

})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const { content } = req.body;

    // validate video id
    if (!videoId) {
        throw new ApiError(
            400,
            "Video id is required"
        );
    }

    // validate content
    if (!content?.trim()) {
        throw new ApiError(
            400,
            "Comment content is required"
        );
    }

    //create comment
    const { data: comment, error } = await supabase
        .from("comments")
        .insert([
            {
                content,
                video: videoId,
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
        )
    `)
        .single();

    if (error) {
        throw new ApiError(
            500,
            error.message
        )
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                comment,
                "Comment added successfully"
            )
        )

})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const { content } = req.body;

    // validate video id
    if (!commentId) {
        throw new ApiError(
            400,
            "Comment id is required"
        );
    }

    // validate content
    if (!content?.trim()) {
        throw new ApiError(
            400,
            "Comment content is required"
        );
    }

    //check if comment exists
    const { data: existingComment, error: fetchError } = await supabase
        .from("comments")
        .select("*")
        .eq("id", commentId)
        .single()

    if (fetchError || !existingComment) {
        throw new ApiError(
            404,
            "Comment not found"
        )
    }

    //ownership check
    if (existingComment.owner !== req.user.id) {
        throw new ApiError(
            403,
            "Unauthorized request"
        )
    }

    //update the comment
    const { data: updatedComment, error: updatedError } = await supabase
        .from("comments")
        .update({
            content
        })
        .eq("id", commentId)
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

    if (updatedError) {
        throw ApiResponse(
            500,
            updatedError.error
        )
    }

    return res
        .json(
            new ApiResponse(
                200,
                updatedComment,
                "Comment updated successfully"
            )
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

     //check if comment exists
    const { data: existingComment, error: fetchError } = await supabase
        .from("comments")
        .select("*")
        .eq("id", commentId)
        .single()

    if (fetchError || !existingComment) {
        throw new ApiError(
            404,
            "Comment not found"
        )
    }

    //ownership check
    if (existingComment.owner !== req.user.id) {
        throw new ApiError(
            403,
            "Unauthorized request"
        )
    }

    //delete the comment
    const { error: deletedError } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        

    if (deletedError) {
        throw ApiResponse(
            500,
            deletedError.message
        )
    }

    return res
          .status(200)
          .json(
            new ApiResponse(
                200,
                {},
                "Comment deleted successfully"
            )
          )
})

export { getVideoComment, addComment, updateComment, deleteComment };
import supabase from "../../config/supabase.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { createVideo, incrementViews } from "../models/video.models.js"
import {
    getVideoById as getVideoByIdModel,
    incrementViews
} from "../models/video.models.js";
const getAllVideos = asyncHandler(async (req, res) => {
    let {
        page = 1,
        limit = 10,
        query,
        sortBy = "created_at",
        sortType = "desc",
        userId
    } = req.query

    //convert to numbers
    page = parseInt(page);
    limit = parseInt(limit)

    //pagination calculation
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    //base query
    let supabaseQuery = supabase
        .from("videos")
        .select(`
            *,
            users (
            id,
            username,
            fullname,
            avatar
            )
        `, { count: "exact" });

    //search filter
    if (query) {
        supabaseQuery = supabaseQuery.or(
            `title.ilike.%${query}%,description.ilike.%${query}%`
        );
    }

    //filter by user
    if (userId) {
        supabaseQuery = supabaseQuery.eq(
            "owner",
            userId
        )
    }

    //sorting
    supabaseQuery = supabaseQuery.order(
        sortBy,
        {
            ascending: sortType === "asc"
        }
    )

    //pagination
    supabaseQuery = supabaseQuery.range(
        from,
        to
    )

    //execute query
    const {
        data: videos,
        error,
        count
    } = await supabaseQuery;

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
                    videos,
                    pagination: {
                        totalVideos: count,
                        currentPage: page,
                        totalPages: Math.ceil(
                            count / limit
                        ),
                        limit
                    }
                },
                "Videos fetched successfully"
            )
        )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    //validation
    if (!title || !description) {
        throw new ApiError(
            400,
            "Title and description are required"
        )
    }

    //get local file paths from multer
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(
            400,
            "Video file is required"
        )
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(
            400,
            "Video file is required"
        )
    }

    //upload video to cloudinary
    const videoFile = await uploadOnCloudinary(
        videoLocalPath
    )

    //upload thumbnail to cloudinary
    const thumbnailFile = await uploadOnCloudinary(
        thumbnailLocalPath
    )

    //check if the videoFile is uploaded or not
    if (!videoFile) {
        throw new ApiError(
            400,
            "Error uploading video"
        )
    }

    //check if the thumbnailFile is uploaded or not
    if (!thumbnailFile) {
        throw new ApiError(
            400,
            "Error uploading thumbnail"
        )
    }

    //save video in database
    const video = await createVideo({
        title,
        description,
        video_file: videoFile.secure_url,
        thumbnail: thumbnail.secure_url,
        duration: videoFile.duration || 0,
        owner: req.user.id,
        is_published: true
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                video,
                "Video published successfully"
            )
        )
})

const getVideoById = asyncHandler(async (req, res) => {

    const { videoId } = req.params;

    // validation
    if (!videoId) {
        throw new ApiError(
            400,
            "Video id is required"
        );
    }

    // fetch video
    const video =
        await getVideoByIdModel(videoId);

    if (!video) {
        throw new ApiError(
            404,
            "Video not found"
        );
    }

    // increment views
    await incrementViews(
        video.id,
        video.views
    );

    // fetch updated video
    const updatedVideo =
        await getVideoByIdModel(videoId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Video fetched successfully"
            )
        );
});

export { getAllVideos, publishAVideo, getVideoById };
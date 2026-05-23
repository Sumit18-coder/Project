import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { createUser, getUserByUsernameOrEmail, getUserById, getSafeUserById, updateRefreshToken, isPasswordCorrect, updateUserById } from '../models/user.models.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import supabase from "../../config/supabase.js";
import jwt from "jsonwebtoken"
import cookieParser from "cookie-parser"
import { comparePassword, hashPassword } from "../utils/auth.js"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single()

        if (error || !user) {
            throw new ApiError(404, "User not found")
        }

        //generate access token
        const accessToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                username: user.username
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        )

        //generate refresh token
        const refreshToken = jwt.sign(
            {
                id: user.id
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        )
        //save refresh token in db
        const { error: updateError } = await supabase
            .from("users")
            .update({
                refresh_token: refreshToken
            })
            .eq("id", user.id);

        if (updateError) {
            throw new ApiError(
                500,
                "Failed to save refresh token"
            )
        }

        return {
            accessToken,
            refreshToken
        }
    } catch (error) {
        console.log(error)
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access tokens"
        )
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validation  - not empty
    //check if user already exists: username, email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    //create user object - create entry in db
    //remove password and fresh token fields from response
    //check for user creation
    //return res

    //extract data points from request body
    const { fullname, email, username, password } = req.body
    // console.log("email", email);

    //check if any field is empty
    if (
        [fullname, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    //if user with the same email or username already exists, then throw an error
    const existedUser = await getUserByUsernameOrEmail(
        username,
        email
    );

    if (existedUser) {
        throw new ApiError(
            409,
            "User with email or username already exists"
        );
    }

    //get the local file path of avatar and cover image frm multer
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    //if avatar is not present, then throw an error as avatar is required
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    //if avatar and cover image found, then upload it on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    //if avatar is not uploaded, then throw an error
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    //hash the password as it must not be stored in plain text
    const hashedPassword = await bcrypt.hash(password, 10);
    //creae user in database
    const user = await createUser({
        fullname: fullname,
        avatar: avatar.secure_url,
        cover_image: coverImage?.secure_url || "",
        email,
        password: hashedPassword,
        username: username.toLowerCase()
    })
    //remove password and fresh token from the user object
    const {
        password: _,
        refresh_token,
        ...userWithoutSensitiveFields
    } = user;

    const createdUser = await getUserById(user.id);

    //if user is not created, then throw an error else return success
    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }

    return res.status(201).json(
        new ApiResponse(
            200,
            userWithoutSensitiveFields,
            "User registered successfully"
        )
    )

})

const loginUser = asyncHandler(async (req, res) => {
    //take data from req body(req body -> data)
    //login using username or email
    //find the user
    //if user exist then password check
    //generate access and refresh token and send it to user
    //send in form of cookies


    const { email, username, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .or(`username.eq.${username},email.eq.${email}`);

    if (error) {
        throw new ApiError(500, error.message);
    }

    const user = users?.[0];

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    //password check
    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    )

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id)

    //get safe user
    const loggedInUser = await getSafeUserById(user.id)

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,//status code
                //data
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in Successfully"//message
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await updateRefreshToken(
        req.user.id,
        null
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out"
            )
        )
})

const refreshAccessToken = asyncHandler(
    async (req, res) => {

        // get refresh token from cookies or body
        const incomingRefreshToken =
            req.cookies.refreshToken ||
            req.body.refreshToken

        // check token exists
        if (!incomingRefreshToken) {
            throw new ApiError(
                401,
                "Unauthorized request"
            )
        }

        try {

            // verify token
            const decodedToken = jwt.verify(
                incomingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET
            )

            // get user from database
            const user = await getUserById(
                decodedToken?.id
            )

            if (!user) {
                throw new ApiError(
                    401,
                    "Invalid refresh token"
                )
            }

            // compare with DB token
            if (
                incomingRefreshToken !==
                user.refresh_token
            ) {
                throw new ApiError(
                    401,
                    "Refresh token is expired or used"
                )
            }

            // generate new tokens
            const {
                accessToken,
                refreshToken
            } = await generateAccessAndRefreshTokens(
                user.id
            )

            const options = {
                httpOnly: true,
                secure: true
            }

            return res
                .status(200)
                .cookie(
                    "accessToken",
                    accessToken,
                    options
                )
                .cookie(
                    "refreshToken",
                    refreshToken,
                    options
                )
                .json(
                    new ApiResponse(
                        200,
                        {
                            accessToken,
                            refreshToken
                        },
                        "Access token refreshed successfully"
                    )
                )

        } catch (error) {

            throw new ApiError(
                401,
                error?.message ||
                "Invalid refresh token"
            )
        }
    })

const changeCurrentPassword = asyncHandler(
    async (req, res) => {

        const {
            oldPassword,
            newPassword
        } = req.body

        // validation here
        if (!oldPassword || !newPassword) {
            throw new ApiError(
                400,
                "Old password and new password are required"
            )
        }

        const user = await getUserById(
            req.user.id
        )

        if (!user) {
            throw new ApiError(
                404,
                "User not found"
            )
        }

        const isPasswordValid =
            await comparePassword(
                oldPassword,
                user.password
            )

        if (!isPasswordValid) {
            throw new ApiError(
                400,
                "Invalid password"
            )
        }

        // hash new password
        const hashedPassword =
            await hashPassword(
                newPassword
            )

        // update password
        await updateUserById(
            req.user.id,
            {
                password: hashedPassword
            }
        )

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Password changed successfully"
                )
            )
    })

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            200,
            req.user,
            "current user fetched successfully"
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body

    if (!(fullname || email)) {
        throw new ApiError(
            400,
            "All fields are required"
        )
    }

    const user = await updateUserById(
        req.user?.id,
        {
            fullname: fullname,
            email: email
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Account details updated successfully"
            )
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(
            400,
            "Avatar file is missing"
        )
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.secure_url) {
        throw new ApiError(
            400,
            "Error while uploading on avatar"
        )
    }

    const user = await updateUserById(
        req.user?.id,
        {
            avatar: avatar.secure_url
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Avatar image updated successfully"
            )
        )
})

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(
            400,
            "cover image file is missing"
        )
    }
    const cover_image = await uploadOnCloudinary(coverImageLocalPath)

    if (!cover_image.secure_url) {
        throw new ApiError(
            400,
            "Error while uploading on cover image"
        )
    }

    const user = await updateUserById(
        req.user?.id,
        {
            cover_image: cover_image.secure_url
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Cover image updated successfully"
            )
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    
    if (!username?.trim()) {
        throw new ApiError(
            400,
            "username is missing"
        )
    }

    //get channel user
    const { data: channel, error: channelError } = await supabase
        .from("users")
        .select(`
            id,
            fullname,
            username,
            email,
            avatar,
            cover_image
        `)
        .eq("username", username.toLowerCase())
        .single()

    if (channelError || !channel) {
        throw new ApiError(
            404,
            "Channel does not exist"
        )
    }

    //subscribers count
    const { count: subscribersCount } = await supabase
        .from("subscription")
        .select("*", { count: "exact", head: true })
        .eq("channel", channel.id)

    //channels subscribed to count
    const { count: channelsSubscribedToCount } = await supabase
        .from("subscription")
        .select("*", { count: "exact", head: true })
        .eq("subscriber", channel.id)

    //check if logged user subscribed
    const {
        data: subscription
    } = await supabase
        .from("subscription")
        .select("*")
        .eq("channel", channel.id)
        .eq("subscriber", req.user?.id)
        .maybeSingle()

    const isSubscribed = !!subscription

    const channelProfile = {
        fullname: channel.fullname,
        username: channel.username,
        email: channel.email,
        avatar: channel.avatar,
        cover_image: channel.cover_image,
        subscribersCount,
        channelsSubscribedToCount,
        isSubscribed
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channelProfile,
                "User channel fetched successfully"
            )
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const { data: watchHistory, error } = await supabase
        .from("watch_history")
        .select(`
            id,
            watch_at,
            
            video: video_id (
                id,
                title,
                description,
                thumbnail,
                video_file,
                views,
                created_at,

                owner(
                   id,
                   fullname,
                   username,
                   avatar
                )
            )
        `)
        .eq("user_id", req.user?.id)
        .order("watch_at", {
            ascending: false
        })

    if (error) {
        throw new ApiError(
            500,
            error.message
        )
    }

    //extract only videos
    const videos = watchHistory.map(
        item => item.video
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "Watch history fetched successfully"
            )
        )
})


export { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, changeCurrentPassword, updateAccountDetails, updateUserAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory }
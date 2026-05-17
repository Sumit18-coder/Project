import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { createUser, getUserByUsernameOrEmail, getUserById } from '../models/user.models.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";

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
        password,
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
            createdUser,
            "User registered successfully"
        )
    )

})

export { registerUser }
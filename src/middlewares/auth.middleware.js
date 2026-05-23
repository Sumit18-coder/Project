import supabase from "../../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { getUserById } from "../models/user.models.js"

export const verifyJwt = asyncHandler(
    async (req, _, next) => {

        try {

            const token =
                req.cookies?.accessToken ||
                req.header("Authorization")
                    ?.replace("Bearer ", "")

            if (!token) {
                throw new ApiError(
                    401,
                    "Unauthorized request"
                )
            }

            // verify token
            const decodedToken =
                jwt.verify(
                    token,
                    process.env
                        .ACCESS_TOKEN_SECRET
                )

            const user =
                await getUserById(
                    decodedToken?.id
                )

            if (!user) {
                throw new ApiError(
                    401,
                    "Invalid access token"
                )
            }

            // remove sensitive fields
            delete user.password
            delete user.refresh_token

            req.user = user

            next()

        } catch (error) {

            throw new ApiError(
                401,
                error?.message ||
                "Invalid access token"
            )
        }
})
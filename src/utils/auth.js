import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

export const comparePassword = async (
    password,
    hashedPassword
) => {
    return await bcrypt.compare(password, hashedPassword);
};

export const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            username: user.username,
            fullname: user.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            experiesIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

export const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            experiesIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
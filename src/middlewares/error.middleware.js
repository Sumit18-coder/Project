const errorHandler = (err, req, res, next) => {
    console.log("ERROR => ", err);

    return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
        stack: err.stack
    })
}

export { errorHandler }
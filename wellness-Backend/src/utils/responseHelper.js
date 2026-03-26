/**
 * Formats success API response
 * @param {Object} res - Express response object
 * @param {Object} data - Data to send back
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default 200)
 */
const success = (res, data, message = "Success", statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

/**
 * Formats error API response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default 400)
 */
const error = (res, message, statusCode = 400) => {
    return res.status(statusCode).json({
        success: false,
        message,
        code: statusCode
    });
};

module.exports = { success, error };

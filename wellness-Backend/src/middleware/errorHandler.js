const { error } = require('../utils/responseHelper');

/**
 * Global Express error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';

    console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
    if (err.stack && process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    return error(res, message, statusCode);
};

module.exports = errorHandler;

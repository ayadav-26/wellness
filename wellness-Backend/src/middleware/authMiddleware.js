const jwt = require('jsonwebtoken');
const { error } = require('../utils/responseHelper');
const { JWT_SECRET } = process.env;

/**
 * JWT Authentication Middleware
 * Verifies the token provided in the Authorization header.
 */
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return error(res, 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return error(res, 'Invalid or expired token', 401);
    }
};

module.exports = authMiddleware;

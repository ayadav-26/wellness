const { error } = require('../utils/responseHelper');

/**
 * Role-Based Access Control Middleware
 * Checks if the user's role is permitted to access the route.
 */
const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return error(res, 'Access denied', 403);
        }
        next();
    };
};

module.exports = roleMiddleware;

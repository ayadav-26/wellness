const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { success, error } = require('../utils/responseHelper');
const notificationService = require('../services/notificationService');
const ROLES = require('../constants/roles');
const { Op } = require('sequelize');

/**
 * Auth Controller for managing user authentication
 */
const authController = {
    /**
     * Public self-registration — always creates a USER account.
     * Role injection via API body is rejected.
     */
    register: async (req, res, next) => {
        try {
            const { firstName, lastName, email, phoneNumber, password } = req.body;

            // Block any role injection attempt
            if (req.body.role && req.body.role !== ROLES.USER) {
                return error(res, 'Role assignment is not permitted during public registration', 403);
            }

            // Basic validation
            if (!firstName || !email || !phoneNumber || !password) {
                return error(res, 'Missing required fields', 400);
            }

            // Unique email check
            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) return error(res, 'Email already exists', 409);

            // Unique phone check
            const existingPhone = await User.findOne({ where: { phoneNumber } });
            if (existingPhone) return error(res, 'Phone number already exists', 409);

            // Password complexity validation
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(password)) {
                return error(res, 'Password does not meet requirements (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character)', 400);
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Create user — role is always USER
            const newUser = await User.create({
                firstName,
                lastName,
                email,
                phoneNumber,
                passwordHash,
                role: ROLES.USER,
                status: true,
            });

            const userData = newUser.toJSON();
            delete userData.passwordHash;

            return success(res, userData, 'User registered successfully', 201);
        } catch (err) {
            next(err);
        }
    },

    /**
     * Login user and generate JWT
     */
    login: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return error(res, 'Email and password are required', 400);
            }

            // Find active user
            const user = await User.findOne({ where: { email, status: true } });
            if (!user) {
                return error(res, 'Invalid credentials', 401);
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.passwordHash);
            if (!isMatch) {
                return error(res, 'Invalid credentials', 401);
            }

            // Generate JWT
            const token = jwt.sign(
                { 
                    userId: user.userId, 
                    email: user.email, 
                    role: user.role,
                    centerId: user.centerId
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
            );

            return success(res, {
                token,
                user: {
                    userId:    user.userId,
                    firstName: user.firstName,
                    lastName:  user.lastName,
                    email:     user.email,
                    phone:     user.phoneNumber,
                    role:      user.role,
                    centerId:  user.centerId
                },
            }, 'Login successful');
        } catch (err) {
            next(err);
        }
    },

    /**
     * Logout (client-side disposal)
     */
    logout: async (req, res, next) => {
        try {
            return success(res, null, 'Logged out successfully');
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/v1/auth/me/permissions
     * Returns the logged-in user's role and full flat permission set.
     * Frontend calls this once after login to drive all UI visibility.
     */
    getMyPermissions: async (req, res, next) => {
        try {
            const user = await User.findOne({
                where: { userId: req.user.userId },
                attributes: ['userId', 'firstName', 'lastName', 'email', 'role', 'centerId'],
            });

            if (!user) return error(res, 'User not found', 404);

            // Fetch dynamic permissions from DB instead of static mapping
            const { RolePermission } = require('../models');
            const perms = await RolePermission.findAll({
                where: { role: user.role }
            });

            // Map them into the expected Frontend array format
            const permissions = perms.map(p => ({
                module: p.moduleName,
                isVisible: p.isVisible,
                canCreate: p.canCreate,
                canEdit: p.canEdit,
                canDelete: p.canDelete
            }));

            return success(res, {
                user: {
                    userId:    user.userId,
                    firstName: user.firstName,
                    lastName:  user.lastName,
                    email:     user.email,
                    role:      user.role,
                    centerId:  user.centerId
                },
                permissions: permissions,
                isSuperAdmin: user.userId === 1,
            }, 'Permissions retrieved successfully');
        } catch (err) {
            next(err);
        }
    },

    /**
     * Forgot Password - Send reset link
     */
    forgotPassword: async (req, res, next) => {
        try {
            const { email } = req.body;
            if (!email) return error(res, 'Email is required', 400);

            const user = await User.findOne({ where: { email, status: true } });
            if (!user) {
                // Return success even if user not found for security (prevent email enumeration)
                // but for this project's simplicity we can just return success
                return success(res, null, 'If that email exists in our system, a reset link has been sent.');
            }

            // Generate token
            const token = crypto.randomBytes(20).toString('hex');
            const expiry = Date.now() + 3600000; // 1 hour

            // Save to user
            await user.update({
                resetPasswordToken: token,
                resetPasswordExpires: expiry
            });

            // Send email
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password/${token}`;
            await notificationService.sendPasswordResetEmail(user.email, resetUrl);

            return success(res, null, 'Reset link sent to your email.');
        } catch (err) {
            next(err);
        }
    },

    /**
     * Reset Password - Update password with token
     */
    resetPassword: async (req, res, next) => {
        try {
            const { token } = req.params;
            const { password } = req.body;

            if (!password) return error(res, 'New password is required', 400);

            // Find user with valid token
            const user = await User.findOne({
                where: {
                    resetPasswordToken: token,
                    resetPasswordExpires: { [Op.gt]: Date.now() }
                }
            });

            if (!user) {
                return error(res, 'Password reset token is invalid or has expired', 400);
            }

            // Password complexity validation
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(password)) {
                return error(res, 'Password does not meet requirements (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character)', 400);
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Update user and clear token
            await user.update({
                passwordHash,
                resetPasswordToken: null,
                resetPasswordExpires: null
            });

            return success(res, null, 'Password reset successful. You can now login with your new password.');
        } catch (err) {
            next(err);
        }
    },
};

module.exports = authController;

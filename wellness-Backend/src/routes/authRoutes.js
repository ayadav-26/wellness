const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Public self-registration — always creates a USER account
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login and get JWT
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout (client-side disposal)
 * @access  Private
 */
router.post('/logout', [authMiddleware], authController.logout);

/**
 * @route   GET /api/v1/auth/me/permissions
 * @desc    Returns the logged-in user's role and full permission set
 * @access  Private (all authenticated roles)
 */
router.get('/me/permissions', [authMiddleware], authController.getMyPermissions);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset link
 * @access  Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password/:token
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;

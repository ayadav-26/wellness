const express = require('express');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * @route   GET /api/v1/slots
 * @desc    Get available appointment slots (Corrected mapping for frontend)
 * @access  Private (Admin, Receptionist, User)
 */
router.get('/', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist', 'User'])], bookingController.getAvailableSlots);

module.exports = router;

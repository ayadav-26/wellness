const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const authMiddleware = require('../middleware/authMiddleware');

// The prompt specifies Access: Admin, Receptionist, User.
// Since all authenticated roles should have access, a general authentication is enough.
// We can apply role middleware explicitly if we want to secure against completely undefined roles, 
// but authMiddleware already validates a valid user.

const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * @route   GET /api/v1/search/therapies
 * @desc    Search therapies by center (Direction A) or centers by therapy name (Direction B)
 * @access  Admin, Receptionist, User
 */
router.get('/therapies', authMiddleware, roleMiddleware(['Admin', 'Receptionist', 'User']), searchController.searchTherapies);

module.exports = router;

const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.use([authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])]);

router.get('/stats', dashboardController.getStats);

module.exports = router;

const express = require('express');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * All report routes are Admin-only
 */
router.use([authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])]);

router.get('/booking-trends',       reportController.getBookingTrends);
router.get('/therapist-utilization', reportController.getTherapistUtilization);
router.get('/peak-times',           reportController.getPeakTimes);
router.get('/cancellations',        reportController.getCancellationStats);
router.get('/customer-history',     reportController.getCustomerHistory);

module.exports = router;

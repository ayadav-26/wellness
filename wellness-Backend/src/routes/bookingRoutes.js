const express = require('express');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * Slot Routes
 */
router.get('/slots', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist', 'User'])], bookingController.getAvailableSlots);

/**
 * Booking Routes
 */
router.post('/',       [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist', 'User'])], bookingController.createBooking);
router.get('/',        [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist', 'User'])], bookingController.listBookings);
router.get('/:id',     [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist', 'User'])], bookingController.getBookingById);
router.put('/:id',    [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist', 'User'])], bookingController.rescheduleBooking);
router.put('/:id/status', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist'])], bookingController.updateStatus);
router.patch('/:id',   [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist'])], bookingController.updateBooking);
router.delete('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist', 'User'])], bookingController.cancelBooking);

module.exports = router;

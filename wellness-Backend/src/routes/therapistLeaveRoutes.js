const express = require('express');
const therapistLeaveController = require('../controllers/therapistLeaveController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/',   [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], therapistLeaveController.createLeave);
router.get('/',    [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist'])], therapistLeaveController.listLeaves);
router.delete('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], therapistLeaveController.deleteLeave);

module.exports = router;

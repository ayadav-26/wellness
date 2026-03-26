const express = require('express');
const workingHoursController = require('../controllers/workingHoursController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/',   [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], workingHoursController.createWorkingHours);
router.get('/',    [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist'])], workingHoursController.listWorkingHours);
router.put('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], workingHoursController.updateWorkingHours);
router.delete('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], workingHoursController.deleteWorkingHours);

module.exports = router;

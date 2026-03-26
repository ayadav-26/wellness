const express = require('express');
const therapistController = require('../controllers/therapistController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/',   [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], therapistController.createTherapist);
router.get('/',    [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist'])], therapistController.listTherapists);
router.get('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist'])], therapistController.getTherapist);
router.put('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], therapistController.updateTherapist);
router.delete('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], therapistController.deleteTherapist);

module.exports = router;

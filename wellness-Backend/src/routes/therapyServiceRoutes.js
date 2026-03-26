const express = require('express');
const therapyServiceController = require('../controllers/therapyServiceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/',   [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], therapyServiceController.createTherapy);
router.get('/',    [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist', 'User'])], therapyServiceController.listTherapies);
router.get('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist', 'User'])], therapyServiceController.getTherapy);
router.put('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], therapyServiceController.updateTherapy);
router.delete('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], therapyServiceController.deleteTherapy);

module.exports = router;

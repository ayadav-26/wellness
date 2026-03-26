const express = require('express');
const centerController = require('../controllers/centerController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const centerTherapyCategoryRoutes = require('./centerTherapyCategoryRoutes');

const router = express.Router();

// Mount nested routes
router.use('/:centerId/categories', centerTherapyCategoryRoutes);

router.post('/',   [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], centerController.createCenter);
router.get('/',    [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist', 'User'])], centerController.listCenters);
router.get('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist', 'User'])], centerController.getCenter);
router.put('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], centerController.updateCenter);
router.delete('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], centerController.deleteCenter);

module.exports = router;

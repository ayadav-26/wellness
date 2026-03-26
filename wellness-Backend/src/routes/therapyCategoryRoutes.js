const express = require('express');
const therapyCategoryController = require('../controllers/therapyCategoryController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/',   [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], therapyCategoryController.createCategory);
router.get('/',    [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist', 'User'])], therapyCategoryController.listCategories);
router.get('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist', 'User'])], therapyCategoryController.getCategory);
router.put('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], therapyCategoryController.updateCategory);
router.delete('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], therapyCategoryController.deleteCategory);

module.exports = router;

const express = require('express');
const centerTherapyCategoryController = require('../controllers/centerTherapyCategoryController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router({ mergeParams: true }); // Important: to access :centerId from parent route

/**
 * @route   POST /api/v1/centers/:centerId/categories
 * @desc    Link a therapy category to a center
 * @access  Private (Admin)
 */
router.post('/', [authMiddleware, roleMiddleware(['Admin'])], centerTherapyCategoryController.linkCategory);

/**
 * @route   DELETE /api/v1/centers/:centerId/categories/:categoryId
 * @desc    Unlink a therapy category from a center
 * @access  Private (Admin)
 */
router.delete('/:categoryId', [authMiddleware, roleMiddleware(['Admin'])], centerTherapyCategoryController.unlinkCategory);

/**
 * @route   GET /api/v1/centers/:centerId/categories
 * @desc    List all therapy categories available at a center
 * @access  Private (Admin, Receptionist, User)
 */
router.get('/', [authMiddleware, roleMiddleware(['Admin', 'Receptionist', 'User'])], centerTherapyCategoryController.listLinkedCategories);

module.exports = router;

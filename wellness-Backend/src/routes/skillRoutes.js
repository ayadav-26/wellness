const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * @route   GET /api/skills
 * @desc    Get all skills
 * @access  Private
 */
router.get('/', authMiddleware, skillController.listSkills);

/**
 * @route   GET /api/skills/:id
 * @desc    Get skill by ID
 * @access  Private
 */
router.get('/:id', authMiddleware, skillController.getSkill);

/**
 * @route   POST /api/skills
 * @desc    Create a new skill
 * @access  Private (Admin)
 */
router.post('/', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], skillController.createSkill);

/**
 * @route   PUT /api/skills/:id
 * @desc    Update a skill
 * @access  Private (Admin)
 */
router.put('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], skillController.updateSkill);

/**
 * @route   DELETE /api/skills/:id
 * @desc    Delete a skill
 * @access  Private (Admin)
 */
router.delete('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], skillController.deleteSkill);

module.exports = router;

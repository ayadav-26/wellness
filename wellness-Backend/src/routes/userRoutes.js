const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * @route   GET /api/v1/users
 * @desc    List all users
 * @access  Super_Admin only
 */
router.get('/', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], userController.listUsers);

/**
 * @route   POST /api/v1/users/create-admin
 * @desc    Create an Admin account
 * @access  Super_Admin only
 */
router.post('/create-admin', [authMiddleware, roleMiddleware(['Super_Admin']), upload.single('profileImage')], userController.createAdmin);

/**
 * @route   POST /api/v1/users/create-receptionist
 * @desc    Create a Receptionist account
 * @access  Super_Admin, Admin
 */
router.post('/create-receptionist', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin']), upload.single('profileImage')], userController.createReceptionist);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Soft-delete a user (status=false). Super Admin (id=1) is immutable.
 * @access  Super_Admin only
 */
router.get('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist', 'User'])], userController.getUser);
router.put('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist', 'User']), upload.single('profileImage')], userController.updateUser);
router.delete('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], userController.deleteUser);

module.exports = router;

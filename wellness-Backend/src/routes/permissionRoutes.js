const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const ROLES = require('../constants/roles');

// Permissions are strictly managed by Super Admin
const superAdminOnly = [authMiddleware, roleMiddleware([ROLES.SUPER_ADMIN])];

router.get('/roles', superAdminOnly, permissionController.getAllRolesPermissions);
router.put('/roles/:role', superAdminOnly, permissionController.updateRolePermissions);

module.exports = router;

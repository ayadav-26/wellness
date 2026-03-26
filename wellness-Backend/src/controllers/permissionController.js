const { RolePermission } = require('../models');
const { success, error } = require('../utils/responseHelper');
const ROLES = require('../constants/roles');

const permissionController = {
    /**
     * GET /api/v1/permissions/roles
     * Gets all permission configurations grouped by Role. 
     */
    getAllRolesPermissions: async (req, res, next) => {
        try {
            const allPerms = await RolePermission.findAll();
            
            // Group by Role
            const grouped = {};
            for (const role of Object.values(ROLES)) {
                grouped[role] = allPerms.filter(p => p.role === role).map(p => ({
                    rolePermissionId: p.rolePermissionId,
                    moduleName: p.moduleName,
                    isVisible: p.isVisible,
                    canView: p.canView,
                    canCreate: p.canCreate,
                    canEdit: p.canEdit,
                    canDelete: p.canDelete
                }));
            }

            return success(res, grouped, 'Role permissions retrieved');
        } catch (err) {
            next(err);
        }
    },

    /**
     * PUT /api/v1/permissions/roles/:role
     * Bulk updates permissions for a specific role
     * Default body structure: { permissions: [{ moduleName: 'xyz', isVisible: true, canView: true... }] }
     */
    updateRolePermissions: async (req, res, next) => {
        try {
            const { role } = req.params;
            const { permissions } = req.body; // Array of configurations

            if (!Object.values(ROLES).includes(role)) {
                return error(res, 'Invalid role specified', 400);
            }

            if (!Array.isArray(permissions)) {
                return error(res, 'Permissions payload must be an array', 400);
            }

            // Iterate and update each module's configuration
            for (const p of permissions) {
                if (!p.moduleName) continue;
                
                await RolePermission.update({
                    isVisible: !!p.isVisible,
                    canView: !!p.canView,
                    canCreate: !!p.canCreate,
                    canEdit: !!p.canEdit,
                    canDelete: !!p.canDelete,
                }, {
                    where: { role, moduleName: p.moduleName }
                });
            }

            return success(res, null, `Permissions for ${role} updated successfully`);
        } catch (err) {
            next(err);
        }
    }
};

module.exports = permissionController;

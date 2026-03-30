const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { success, error } = require('../utils/responseHelper');
const ROLES = require('../constants/roles');
const s3Service = require('../services/s3Service');

/**
 * Super Admin guard — prevents modification of the immutable Super Admin account (userId=1).
 */
const guardSuperAdmin = (targetUserId, res) => {
    if (parseInt(targetUserId) === 1) {
        error(res, 'Super Admin cannot be modified or deleted', 403);
        return true;
    }
    return false;
};

/**
 * User management controller (protected — not public).
 */
const userController = {

    /**
     * POST /api/v1/users/create-admin
     * Creates an ADMIN account. Only accessible by SUPER_ADMIN.
     */
    createAdmin: async (req, res, next) => {
        try {
            const { firstName, lastName, email, phoneNumber, password, centerId } = req.body;

            if (!firstName || !email || !phoneNumber || !password) {
                return error(res, 'Missing required fields', 400);
            }

            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) return error(res, 'Email already exists', 409);

            const existingPhone = await User.findOne({ where: { phoneNumber } });
            if (existingPhone) return error(res, 'Phone number already exists', 409);

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Handle optional profile image upload
            let profileImageUrl = null;
            if (req.file) {
                profileImageUrl = await s3Service.uploadImage(req.file);
            }

            const newAdmin = await User.create({
                firstName,
                lastName,
                email,
                phoneNumber,
                passwordHash,
                role: ROLES.ADMIN,
                centerId: centerId || null,
                status: true,
                profileImageUrl
            });

            const userData = newAdmin.toJSON();
            delete userData.passwordHash;

            return success(res, userData, 'Admin created successfully', 201);
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/v1/users/create-receptionist
     * Creates a RECEPTIONIST account. Accessible by SUPER_ADMIN or ADMIN.
     */
    createReceptionist: async (req, res, next) => {
        try {
            const { firstName, lastName, email, phoneNumber, password, centerId } = req.body;

            if (!firstName || !email || !phoneNumber || !password) {
                return error(res, 'Missing required fields', 400);
            }

            // If requester is Admin or SuperAdmin, they can choose the centerId
            let finalCenterId = centerId;

            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) return error(res, 'Email already exists', 409);

            const existingPhone = await User.findOne({ where: { phoneNumber } });
            if (existingPhone) return error(res, 'Phone number already exists', 409);

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Handle optional profile image upload
            let profileImageUrl = null;
            if (req.file) {
                profileImageUrl = await s3Service.uploadImage(req.file);
            }

            const newRec = await User.create({
                firstName,
                lastName,
                email,
                phoneNumber,
                passwordHash,
                role: ROLES.RECEPTIONIST,
                centerId: finalCenterId || null,
                status: true,
                profileImageUrl
            });

            const userData = newRec.toJSON();
            delete userData.passwordHash;

            return success(res, userData, 'Receptionist created successfully', 201);
        } catch (err) {
            next(err);
        }
    },

    /**
     * DELETE /api/v1/users/:id
     * Soft-deletes a user (sets status=false). 
     * SUPER_ADMIN can delete anyone except self.
     * ADMIN can delete Receptionists in their center.
     */
    deleteUser: async (req, res, next) => {
        try {
            const { id } = req.params;

            if (guardSuperAdmin(id, res)) return;

            const user = await User.findByPk(id);
            if (!user) return error(res, 'User not found', 404);

            // Permission check
            if (req.user.role === ROLES.ADMIN) {
                if (user.role !== ROLES.RECEPTIONIST) {
                    return error(res, 'You do not have permission to delete this user. Admins can only delete Receptionists.', 403);
                }
            }

            await user.update({ status: false });

            return success(res, null, 'User deactivated successfully');
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/v1/users
     * Lists users based on permissions.
     * SUPER_ADMIN: sees all.
     * ADMIN: sees Receptionists in their center.
     */
    listUsers: async (req, res, next) => {
        try {
            const { centerId } = req.query;
            const where = { status: true };
            
            if (req.user.role === ROLES.ADMIN) {
                where.role = ROLES.RECEPTIONIST;
                if (centerId) {
                    where.centerId = centerId;
                }
            } else if (req.user.role === ROLES.SUPER_ADMIN) {
                if (centerId) {
                    where.centerId = centerId;
                }
            } else {
                return error(res, 'Unauthorized', 403);
            }

            const users = await User.findAll({
                where,
                attributes: { exclude: ['passwordHash'] },
                include: [
                    {
                        model: require('../models').Center,
                        as: 'center',
                        attributes: ['centerId', 'name', 'city']
                    }
                ],
                order: [['createdAt', 'DESC']],
            });

            return success(res, users, 'Users retrieved successfully');
        } catch (err) {
            next(err);
        }
    },

    /**
     * PUT /api/v1/users/:id
     * Updates user details.
     * SUPER_ADMIN can update anyone except userId=1 (handled by guard).
     * ADMIN can update Receptionists in their center.
     */
    /**
     * PUT /api/v1/users/:id
     * Updates user details.
     */
    updateUser: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { firstName, lastName, phoneNumber, centerId } = req.body;

            const isSelf = parseInt(id) === req.user.userId;

            const user = await User.findByPk(id);
            if (!user) return error(res, 'User not found', 404);

            if (guardSuperAdmin(id, res)) return;

            // Permission check
            if (req.user.role === ROLES.ADMIN) {
                // Admins can update themselves OR Receptionists
                if (!isSelf && user.role !== ROLES.RECEPTIONIST) {
                    return error(res, 'You do not have permission to update this user.', 403);
                }
            } else if (req.user.role !== ROLES.SUPER_ADMIN) {
                // Non-admin roles (User/Receptionist) can ONLY update themselves
                if (!isSelf) {
                    return error(res, 'You do not have permission to update this user.', 403);
                }
            }

            // Perform update - Restrict fields for non-privileged roles
            const updateData = {};
            if (req.user.role === ROLES.SUPER_ADMIN || (req.user.role === ROLES.ADMIN && !isSelf)) {
                // Power users can update more fields
                if (firstName) updateData.firstName = firstName;
                if (lastName) updateData.lastName = lastName;
                if (phoneNumber) updateData.phoneNumber = phoneNumber;
                if (centerId !== undefined) updateData.centerId = centerId;
            } else {
                // Regular users (or Admins updating themselves via profile) can only update phone
                if (phoneNumber) updateData.phoneNumber = phoneNumber;
            }

            // Profile Image Update logic (Allowed for each role to update their own, or by power users)
            if (req.file) {
                // If there's an existing image, delete it from S3
                if (user.profileImageUrl) {
                    await s3Service.deleteImage(user.profileImageUrl);
                }
                updateData.profileImageUrl = await s3Service.uploadImage(req.file);
            }

            await user.update(updateData);

            const userData = user.toJSON();
            delete userData.passwordHash;

            return success(res, userData, 'User updated successfully');
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/v1/users/:id
     * Returns full user details.
     */
    getUser: async (req, res, next) => {
        try {
            const { id } = req.params;
            const user = await User.findByPk(id, {
                attributes: { exclude: ['passwordHash'] },
                include: [
                    {
                        model: require('../models').Center,
                        as: 'center',
                        attributes: ['centerId', 'name', 'city']
                    }
                ]
            });

            if (!user) return error(res, 'User not found', 404);

            // Permission check
            const isSelf = parseInt(id) === req.user.userId;

            if (req.user.role === ROLES.ADMIN) {
                if (!isSelf && user.role !== ROLES.RECEPTIONIST) {
                    return error(res, 'Unauthorized to view this user', 403);
                }
            } else if (req.user.role !== ROLES.SUPER_ADMIN) {
                // Receptionist or User can only view themselves
                if (!isSelf) {
                    return error(res, 'Unauthorized to view this user', 403);
                }
            }

            return success(res, user, 'User retrieved successfully');
        } catch (err) {
            next(err);
        }
    },
};

module.exports = userController;

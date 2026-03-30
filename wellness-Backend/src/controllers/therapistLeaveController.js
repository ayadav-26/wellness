const { TherapistLeave, Therapist, Center } = require('../models');
const { success, error } = require('../utils/responseHelper');

/**
 * Therapist Leave Controller
 */
const therapistLeaveController = {
    /**
     * Create a leave record
     */
    createLeave: async (req, res, next) => {
        try {
            const { therapistId, leaveDate, reason } = req.body;

            if (!therapistId || !leaveDate) {
                return error(res, "Therapist ID and leave date are required", 400);
            }

            // Validate therapist
            const therapist = await Therapist.findByPk(therapistId);
            if (!therapist) return error(res, "Therapist not found", 404);

            if (req.user && req.user.role === 'Receptionist' && therapist.centerId !== req.user.centerId) {
                return error(res, "Access denied. Therapist belongs to another center.", 403);
            }

            const leave = await TherapistLeave.create({
                therapistId,
                leaveDate,
                reason
            });

            return success(res, leave, "Leave record created successfully", 201);
        } catch (err) {
            next(err);
        }
    },

    /**
     * List therapist leaves
     */
    listLeaves: async (req, res, next) => {
        try {
            let { page = 1, limit = 10, therapistId } = req.query;
            page = parseInt(page);
            limit = parseInt(limit);
            const offset = (page - 1) * limit;

            const where = {};
            if (therapistId) where.therapistId = therapistId;

            const includeQuery = [
                {
                    model: Therapist,
                    as: 'therapist',
                    attributes: ['therapistId', 'firstName', 'lastName', 'centerId']
                }
            ];

            if (req.user && req.user.role === 'Receptionist') {
                includeQuery[0].where = { centerId: req.user.centerId };
            }

            const { count, rows } = await TherapistLeave.findAndCountAll({
                where,
                include: includeQuery,
                limit,
                offset,
                order: [['leaveDate', 'DESC']]
            });

            return success(res, {
                data: rows,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            }, "Leave records retrieved successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Hard delete leave record
     */
    deleteLeave: async (req, res, next) => {
        try {
            const { id } = req.params;
            const leave = await TherapistLeave.findByPk(id, { 
                include: [{ model: Therapist, as: 'therapist' }] 
            });

            if (!leave) {
                return error(res, "Leave record not found", 404);
            }

            if (req.user && req.user.role === 'Receptionist' && leave.therapist.centerId !== req.user.centerId) {
                return error(res, "Access denied. Cannot delete leave for another center's therapist.", 403);
            }

            await leave.destroy();

            return success(res, null, "Leave record deleted successfully");
        } catch (err) {
            next(err);
        }
    }
};

module.exports = therapistLeaveController;

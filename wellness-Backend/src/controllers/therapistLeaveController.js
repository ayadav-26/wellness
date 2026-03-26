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

            const { count, rows } = await TherapistLeave.findAndCountAll({
                where,
                include: [
                    {
                        model: Therapist,
                        as: 'therapist',
                        attributes: ['therapistId', 'firstName', 'lastName', 'centerId']
                    }
                ],
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
            const leave = await TherapistLeave.findByPk(id);

            if (!leave) {
                return error(res, "Leave record not found", 404);
            }

            await leave.destroy();

            return success(res, null, "Leave record deleted successfully");
        } catch (err) {
            next(err);
        }
    }
};

module.exports = therapistLeaveController;

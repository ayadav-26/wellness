const { WorkingHours, Therapist, Center, sequelize } = require('../models');
const { success, error } = require('../utils/responseHelper');

/**
 * Working Hours Controller
 */
const workingHoursController = {
    /**
     * Create working hours
     */
    createWorkingHours: async (req, res, next) => {
        const transaction = await sequelize.transaction();
        try {
            let { centerId, therapistId, dayOfWeek, slots } = req.body;

            if (!centerId || !therapistId || !dayOfWeek || !slots) {
                await transaction.rollback();
                return error(res, "Missing required fields", 400);
            }

            // Validate therapist and center
            const therapist = await Therapist.findByPk(therapistId);
            if (!therapist) {
                await transaction.rollback();
                return error(res, "Therapist not found", 404);
            }

            const center = await Center.findByPk(centerId);
            if (!center) {
                await transaction.rollback();
                return error(res, "Center not found", 404);
            }

            // Handle multiple days (comma separated string or array)
            let days = [];
            if (Array.isArray(dayOfWeek)) {
                days = dayOfWeek;
            } else if (typeof dayOfWeek === 'string') {
                days = dayOfWeek.split(',').map(d => d.trim()).filter(d => d);
            } else {
                days = [dayOfWeek];
            }

            const results = [];
            for (const day of days) {
                // Upsert logic: find existing or create new
                const [record, created] = await WorkingHours.findOrCreate({
                    where: { centerId, therapistId, dayOfWeek: day },
                    defaults: {
                        slots
                    },
                    transaction
                });

                if (!created) {
                    // Update existing record
                    await record.update({
                        slots
                    }, { transaction });
                }
                results.push(record);
            }

            await transaction.commit();
            return success(res, results, `${results.length} working hour(s) processed successfully`, 201);
        } catch (err) {
            await transaction.rollback();
            next(err);
        }
    },

    /**
     * List working hours
     */
    listWorkingHours: async (req, res, next) => {
        try {
            let { page = 1, limit = 10, therapistId, centerId } = req.query;
            page = parseInt(page);
            limit = parseInt(limit);
            const offset = (page - 1) * limit;

            const where = {};
            if (therapistId) where.therapistId = therapistId;
            if (centerId) where.centerId = centerId;

            const { count, rows } = await WorkingHours.findAndCountAll({
                where,
                include: [
                    {
                        model: Therapist,
                        as: 'therapist',
                        attributes: ['therapistId', 'firstName', 'lastName']
                    },
                    {
                        model: Center,
                        as: 'center',
                        attributes: ['centerId', 'name']
                    }
                ],
                limit,
                offset
            });

            return success(res, {
                data: rows,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            }, "Working hours retrieved successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Update working hours
     */
    updateWorkingHours: async (req, res, next) => {
        try {
            const { id } = req.params;
            const workingHoursInRange = await WorkingHours.findByPk(id);

            if (!workingHoursInRange) {
                return error(res, "Working hours record not found", 404);
            }

            await workingHoursInRange.update(req.body);

            return success(res, workingHoursInRange, "Working hours updated successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Hard delete working hours
     */
    deleteWorkingHours: async (req, res, next) => {
        try {
            const { id } = req.params;
            const workingHoursInRange = await WorkingHours.findByPk(id);

            if (!workingHoursInRange) {
                return error(res, "Working hours record not found", 404);
            }

            await workingHoursInRange.destroy();

            return success(res, null, "Working hours record deleted successfully");
        } catch (err) {
            next(err);
        }
    }
};

module.exports = workingHoursController;

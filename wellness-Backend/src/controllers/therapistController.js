const { Therapist, Center, WorkingHours, TherapistLeave } = require('../models');
const { success, error } = require('../utils/responseHelper');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

/**
 * Therapist Controller
 */
const therapistController = {
    /**
     * Create a new therapist
     */
    createTherapist: async (req, res, next) => {
        const transaction = await sequelize.transaction();
        try {
            const { firstName, lastName, gender, experienceYears, skillSet, centerId, phoneNumber } = req.body;

            if (!firstName || !gender || !centerId) {
                await transaction.rollback();
                return error(res, "Missing required fields", 400);
            }

            const center = await Center.findByPk(centerId);
            if (!center || !center.status) {
                await transaction.rollback();
                return error(res, "Invalid or inactive center", 400);
            }

            if (req.user && req.user.role === 'Receptionist' && centerId != req.user.centerId) {
                await transaction.rollback();
                return error(res, "Receptionists can only create therapists for their assigned center", 403);
            }

            const therapist = await Therapist.create({
                firstName,
                lastName,
                gender,
                experienceYears,
                skillSet,
                centerId,
                phoneNumber,
                status: true
            }, { transaction });

            // If working hours are provided, create them
            if (req.body.workingHours && Array.isArray(req.body.workingHours)) {
                for (const wh of req.body.workingHours) {
                    await WorkingHours.create({
                        centerId,
                        therapistId: therapist.therapistId,
                        dayOfWeek: wh.dayOfWeek,
                        slots: wh.slots
                    }, { transaction });
                }
            }

            await transaction.commit();

            // Fetch with includes for response
            const newTherapist = await Therapist.findByPk(therapist.therapistId, {
                include: [
                    { model: Center, as: 'center', attributes: ['centerId', 'name', 'city'] },
                    { model: WorkingHours, as: 'workingHours', attributes: ['dayOfWeek', 'slots'] }
                ]
            });

            return success(res, newTherapist, "Therapist created successfully", 201);
        } catch (err) {
            await transaction.rollback();
            next(err);
        }
    },

    /**
     * List therapists with center and working hours
     */
    listTherapists: async (req, res, next) => {
        try {
            let { page = 1, limit = 10, includeInactive = false, centerId, status, search } = req.query;
            page = parseInt(page);
            limit = parseInt(limit);
            const offset = (page - 1) * limit;

            const where = {};
            if (status !== undefined && status !== '') {
                where.status = status === 'true';
            } else if (includeInactive === 'true' && req.user.role === 'Admin') {
                // All
            } else {
                where.status = true;
            }

            if (req.user && req.user.role === 'Receptionist') {
                where.centerId = req.user.centerId;
            } else if (centerId) {
                where.centerId = centerId;
            }

            if (search && search.trim() !== '') {
                where[Op.or] = [
                    { firstName: { [Op.iLike]: `%${search.trim()}%` } },
                    { lastName: { [Op.iLike]: `%${search.trim()}%` } },
                    { phoneNumber: { [Op.iLike]: `%${search.trim()}%` } }
                ];
            }

            const { count, rows } = await Therapist.findAndCountAll({
                where,
                attributes: ['therapistId', 'firstName', 'lastName', 'gender', 'phoneNumber', 'experienceYears', 'status', 'centerId'],
                include: [
                    {
                        model: Center,
                        as: 'center',
                        attributes: ['centerId', 'name']
                    }
                ],
                limit,
                offset,
                order: [['firstName', 'ASC']]
            });

            return success(res, {
                data: rows,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            }, "Therapists retrieved successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Get therapist details including leaves
     */
    getTherapist: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { includeInactive = false } = req.query;

            const where = { therapistId: id };
            if (!(includeInactive === 'true' && req.user.role === 'Admin')) {
                where.status = true;
            }

            const therapist = await Therapist.findOne({
                where,
                include: [
                    {
                        model: Center,
                        as: 'center',
                        attributes: ['centerId', 'name', 'city']
                    },
                    {
                        model: WorkingHours,
                        as: 'workingHours',
                        attributes: ['dayOfWeek', 'slots']
                    },
                    {
                        model: TherapistLeave,
                        as: 'leaves',
                        attributes: ['leaveId', 'leaveDate', 'reason'],
                        required: false
                    }
                ]
            });

            if (!therapist) {
                return error(res, "Therapist not found", 404);
            }

            if (req.user && req.user.role === 'Receptionist' && therapist.centerId !== req.user.centerId) {
                return error(res, "Access denied. Therapist belongs to another center.", 403);
            }

            return success(res, therapist, "Therapist retrieved successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Update therapist
     */
    updateTherapist: async (req, res, next) => {
        const transaction = await sequelize.transaction();
        try {
            const { id } = req.params;
            const therapist = await Therapist.findByPk(id);

            if (!therapist) {
                await transaction.rollback();
                return error(res, "Therapist not found", 404);
            }

            if (req.user && req.user.role === 'Receptionist' && therapist.centerId !== req.user.centerId) {
                await transaction.rollback();
                return error(res, "Access denied. Therapist belongs to another center.", 403);
            }

            if (req.body.centerId) {
                const center = await Center.findByPk(req.body.centerId);
                if (!center || !center.status) {
                    await transaction.rollback();
                    return error(res, "Invalid or inactive center", 400);
                }
            }

            await therapist.update(req.body, { transaction });

            // Handle nested working hours if provided (Robust Delete & Recreate Pattern)
            if (req.body.workingHours && Array.isArray(req.body.workingHours)) {
                // Delete ALL existing days to ensure a clean slate and avoid duplicates
                await WorkingHours.destroy({
                    where: { therapistId: therapist.therapistId },
                    transaction
                });

                // Recreate from incoming payload
                for (const wh of req.body.workingHours) {
                    await WorkingHours.create({
                        centerId: therapist.centerId,
                        therapistId: therapist.therapistId,
                        dayOfWeek: wh.dayOfWeek,
                        slots: wh.slots
                    }, { transaction });
                }
            } else if (req.body.workingHours === null || (Array.isArray(req.body.workingHours) && req.body.workingHours.length === 0)) {
                // Explicitly clear
                await WorkingHours.destroy({
                    where: { therapistId: therapist.therapistId },
                    transaction
                });
            }

            await transaction.commit();
            
            // Re-fetch updated therapist with includes for response
            const updatedTherapist = await Therapist.findByPk(id, {
                include: [
                    { model: Center, as: 'center', attributes: ['centerId', 'name', 'city'] },
                    { model: WorkingHours, as: 'workingHours', attributes: ['dayOfWeek', 'slots'] }
                ]
            });

            return success(res, updatedTherapist, "Therapist updated successfully");
        } catch (err) {
            await transaction.rollback();
            next(err);
        }
    },

    /**
     * Soft delete therapist
     */
    deleteTherapist: async (req, res, next) => {
        try {
            const { id } = req.params;
            const therapist = await Therapist.findByPk(id);

            if (!therapist) {
                return error(res, "Therapist not found", 404);
            }

            if (req.user && req.user.role === 'Receptionist' && therapist.centerId !== req.user.centerId) {
                return error(res, "Access denied. Therapist belongs to another center.", 403);
            }

            await therapist.update({ status: false });

            return success(res, null, "Therapist deactivated successfully");
        } catch (err) {
            next(err);
        }
    }
};

module.exports = therapistController;

const { TherapyService, TherapyCategory } = require('../models');
const { success, error } = require('../utils/responseHelper');
const { Op } = require('sequelize');

/**
 * Therapy Service Controller
 */
const therapyServiceController = {
    /**
     * Create a new therapy service
     */
    createTherapy: async (req, res, next) => {
        try {
            const { therapyName, categoryId, durationMinutes, price, requiredRoomType, requiredSkill } = req.body;

            if (!therapyName || !categoryId || !durationMinutes) {
                return error(res, "Missing required fields", 400);
            }

            // Validate category
            const category = await TherapyCategory.findByPk(categoryId);
            if (!category || !category.status) {
                return error(res, "Invalid or inactive therapy category", 400);
            }

            const therapy = await TherapyService.create({
                therapyName,
                categoryId,
                durationMinutes,
                price,
                requiredRoomType,
                requiredSkill,
                status: true
            });

            return success(res, therapy, "Therapy service created successfully", 201);
        } catch (err) {
            next(err);
        }
    },

    /**
     * List therapy services
     */
    listTherapies: async (req, res, next) => {
        try {
            const { page = 1, limit = 10, includeInactive = false, status, search } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            const where = {};

            // Priority: status filter > includeInactive
            if (status === 'true') {
                where.status = true;
            } else if (status === 'false') {
                where.status = false;
            } else if (includeInactive !== 'true') {
                where.status = true;
            }

            if (search && search.trim() !== '') {
                where.therapyName = { [Op.iLike]: `%${search.trim()}%` };
            }

            const { count, rows } = await TherapyService.findAndCountAll({
                where,
                include: [
                    {
                        model: TherapyCategory,
                        as: 'category',
                        attributes: ['categoryId', 'categoryName']
                    }
                ],
                limit,
                offset,
                order: [['therapyName', 'ASC']]
            });

            return success(res, {
                data: rows,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            }, "Therapy services retrieved successfully");
        } catch (err) {
            next(err);
        }
    },

    getTherapy: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { includeInactive = false } = req.query;

            const where = { therapyId: id };
            if (includeInactive !== 'true') {
                where.status = true;
            }

            const therapy = await TherapyService.findOne({
                where,
                include: [
                    {
                        model: TherapyCategory,
                        as: 'category',
                        attributes: ['categoryId', 'categoryName']
                    }
                ]
            });

            if (!therapy) {
                return error(res, "Therapy service not found", 404);
            }

            return success(res, therapy, "Therapy service retrieved successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Update therapy service
     */
    updateTherapy: async (req, res, next) => {
        try {
            const { id } = req.params;
            const therapy = await TherapyService.findByPk(id);

            if (!therapy) {
                return error(res, "Therapy service not found", 404);
            }

            if (req.body.categoryId) {
                const category = await TherapyCategory.findByPk(req.body.categoryId);
                if (!category || !category.status) {
                    return error(res, "Invalid or inactive therapy category", 400);
                }
            }

            await therapy.update(req.body);

            return success(res, therapy, "Therapy service updated successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Soft delete therapy service
     */
    deleteTherapy: async (req, res, next) => {
        try {
            const { id } = req.params;
            const therapy = await TherapyService.findByPk(id);

            if (!therapy) {
                return error(res, "Therapy service not found", 404);
            }

            await therapy.update({ status: false });

            return success(res, null, "Therapy service deactivated successfully");
        } catch (err) {
            next(err);
        }
    }
};

module.exports = therapyServiceController;

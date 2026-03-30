const { TherapyCategory } = require('../models');
const { success, error } = require('../utils/responseHelper');
const { Op } = require('sequelize');

/**
 * Therapy Category Controller
 */
const therapyCategoryController = {
    /**
     * Create a new category
     */
    createCategory: async (req, res, next) => {
        try {
            const { categoryName, description } = req.body;

            if (!categoryName) {
                return error(res, "Category name is required", 400);
            }

            const category = await TherapyCategory.create({
                categoryName,
                description,
                status: true
            });

            return success(res, category, "Category created successfully", 201);
        } catch (err) {
            next(err);
        }
    },

    /**
     * List categories
     */
    listCategories: async (req, res, next) => {
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
                where.categoryName = { [Op.iLike]: `%${search.trim()}%` };
            }

            const { count, rows } = await TherapyCategory.findAndCountAll({
                where,
                attributes: ['categoryId', 'categoryName','description', 'status'],
                limit,
                offset,
                order: [['categoryName', 'ASC']]
            });

            return success(res, {
                data: rows,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            }, "Categories retrieved successfully");
        } catch (err) {
            next(err);
        }
    },

    getCategory: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { includeInactive = false } = req.query;

            const where = { categoryId: id };
            if (includeInactive !== 'true') {
                where.status = true;
            }

            const category = await TherapyCategory.findOne({ where });

            if (!category) {
                return error(res, "Category not found", 404);
            }

            return success(res, category, "Category retrieved successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Update category
     */
    updateCategory: async (req, res, next) => {
        try {
            const { id } = req.params;
            const category = await TherapyCategory.findByPk(id);

            if (!category) {
                return error(res, "Category not found", 404);
            }

            await category.update(req.body);

            return success(res, category, "Category updated successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Soft delete category
     */
    deleteCategory: async (req, res, next) => {
        try {
            const { id } = req.params;
            const category = await TherapyCategory.findByPk(id);

            if (!category) {
                return error(res, "Category not found", 404);
            }

            await category.update({ status: false });

            return success(res, null, "Category deactivated successfully");
        } catch (err) {
            next(err);
        }
    }
};

module.exports = therapyCategoryController;

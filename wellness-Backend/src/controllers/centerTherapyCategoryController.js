const { CenterTherapyCategory, Center, TherapyCategory, TherapyService } = require('../models');
const { success, error } = require('../utils/responseHelper');

const centerTherapyCategoryController = {
    /**
     * POST /centers/:centerId/categories
     * Link a therapy category to a center
     */
    linkCategory: async (req, res, next) => {
        try {
            const { centerId } = req.params;
            const { categoryId, categoryIds } = req.body;

            if (!categoryId && (!categoryIds || !Array.isArray(categoryIds))) {
                return error(res, "categoryId or categoryIds array is required", 400);
            }

            // Validate Center
            const center = await Center.findOne({ where: { centerId, status: true } });
            if (!center) return error(res, "Center not found or inactive", 404);

            const idsToLink = categoryIds || [categoryId];
            const results = [];
            const errors = [];

            for (const id of idsToLink) {
                // Validate Category
                const category = await TherapyCategory.findOne({ where: { categoryId: id, status: true } });
                if (!category) {
                    errors.push(`Category ID ${id} not found or inactive`);
                    continue;
                }

                // Check if mapping already exists
                const existingMapping = await CenterTherapyCategory.findOne({
                    where: { centerId, categoryId: id }
                });

                if (existingMapping) {
                    results.push({ categoryId: id, status: 'already_linked' });
                    continue;
                }

                // Create mapping
                const mapping = await CenterTherapyCategory.create({
                    centerId,
                    categoryId: id
                });
                results.push({ categoryId: id, status: 'linked', data: mapping });
            }

            return success(res, { results, errors }, "Categories processed successfully", 201);
        } catch (err) {
            next(err);
        }
    },

    /**
     * DELETE /centers/:centerId/categories/:categoryId
     * Unlink a therapy category from a center
     */
    unlinkCategory: async (req, res, next) => {
        try {
            const { centerId, categoryId } = req.params;

            const mapping = await CenterTherapyCategory.findOne({
                where: { centerId, categoryId }
            });

            if (!mapping) return error(res, "Mapping not found", 404);

            await mapping.destroy();

            return success(res, null, "Therapy category unlinked from center successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /centers/:centerId/categories
     * List all therapy categories available at a center
     */
    listLinkedCategories: async (req, res, next) => {
        try {
            const { centerId } = req.params;

            const center = await Center.findByPk(centerId, {
                include: [
                    {
                        model: TherapyCategory,
                        as: 'therapyCategories',
                        where: { status: true },
                        through: { attributes: [] }, // hide junction table fields
                        required: false, // Don't filter out the center if it has no categories
                        include: [
                            {
                                model: TherapyService,
                                as: 'therapies',
                                where: { status: true },
                                required: false,
                                attributes: ['therapyId', 'therapyName', 'durationMinutes', 'price', 'requiredRoomType']
                            }
                        ]
                    }
                ]
            });

            if (!center) return error(res, "Center not found", 404);

            return success(res, center.therapyCategories || [], "Linked therapy categories retrieved successfully");
        } catch (err) {
            next(err);
        }
    }
};

module.exports = centerTherapyCategoryController;

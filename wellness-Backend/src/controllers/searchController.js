const { TherapyService, TherapyCategory, Center, CenterTherapyCategory } = require('../models');
const { Op } = require('sequelize');
const { success, error } = require('../utils/responseHelper');

/**
 * Perform a therapy search either by center (list therapies available there)
 * or by therapyName (find centers where this therapy is offered).
 */
const searchTherapies = async (req, res, next) => {
    try {
        let { centerId, therapyName, categoryId, page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        if (!centerId && !therapyName) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one search parameter: centerId or therapyName",
                code: 400
            });
        }

        // Direction A: Search therapies offered at a specific center
        if (centerId) {
            // Validate center active
            const center = await Center.findOne({ where: { centerId, status: true }, attributes: ['centerId', 'name', 'city', 'openingTime', 'closingTime'] });
            if (!center) return error(res, "Center not found or inactive", 404);

            // Fetch therapy categories mapped to center
            const categoryFilter = { status: true };
            if (categoryId) categoryFilter.categoryId = categoryId;

            const mappedCategories = await TherapyCategory.findAll({
                where: categoryFilter,
                include: [
                    {
                        model: Center,
                        as: 'centers',
                        where: { centerId },
                        required: true,
                        through: { attributes: [] }
                    },
                    {
                        model: TherapyService,
                        as: 'therapies',
                        where: { status: true },
                        required: false,
                        attributes: ['therapyId', 'therapyName', 'durationMinutes', 'price', 'requiredRoomType', 'requiredSkill']
                    }
                ],
                order: [['categoryName', 'ASC']]
            });

            // Reformat exactly how the prompt wants output for Direction A
            const categoriesResponse = mappedCategories.map(cat => ({
                categoryId: cat.categoryId,
                categoryName: cat.categoryName,
                therapies: cat.therapies
            }));

            // Since this just maps nested elements, we do strict calculation for pagination based on raw categories count 
            // In a highly optimized world, we might paginate inner elements, but standard practice here is the whole outer layer block.
            // Prompt implies 1 overall aggregate structure, we just wrap them.
            return success(res, {
                center: center,
                categories: categoriesResponse,
                pagination: {
                    total: categoriesResponse.reduce((acc, cat) => acc + cat.therapies.length, 0),
                    page,
                    limit,
                    totalPages: 1
                }
            }, "Therapies fetched successfully");
        }

        // Direction B: Search centers by therapyName match
        const therapyFilter = {
            therapyName: { [Op.iLike]: `%${therapyName}%` },
            status: true
        };
        if (categoryId) therapyFilter.categoryId = categoryId;

        const { count, rows: therapies } = await TherapyService.findAndCountAll({
            where: therapyFilter,
            limit,
            offset,
            include: [
                {
                    model: TherapyCategory,
                    as: 'category',
                    attributes: ['categoryId', 'categoryName'],
                    where: { status: true },
                    required: true,
                    include: [
                        {
                            model: Center,
                            as: 'centers',
                            attributes: ['centerId', 'name', 'city', 'openingTime', 'closingTime'],
                            where: { status: true },
                            required: false, // Don't strictly error if it has NO centers matched yet, although UI might prefer it
                            through: { attributes: [] }
                        }
                    ]
                }
            ]
        });

        const formattedResults = therapies.map(therapy => {
            const data = therapy.toJSON();
            const centers = data.category && data.category.centers ? data.category.centers : [];
            
            return {
                therapyId: data.therapyId,
                therapyName: data.therapyName,
                categoryId: data.categoryId,
                categoryName: data.category ? data.category.categoryName : null,
                durationMinutes: data.durationMinutes,
                price: data.price,
                requiredRoomType: data.requiredRoomType,
                availableAtCenters: centers
            };
        });

        // Filter out those with no centers? Optional based on requirements, but reasonable.
        // The prompt says "look up which centers have its categoryId... verify those centers are active"
        // And `model: Center, where: { status: true }, required: false` catches them. 

        return success(res, {
            results: formattedResults,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            }
        }, "Therapies fetched successfully");

    } catch (err) {
        next(err);
    }
};

module.exports = {
    searchTherapies
};

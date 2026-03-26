const { Skill } = require('../models');
const { success, error } = require('../utils/responseHelper');

/**
 * Skill Controller
 */
const skillController = {
    /**
     * List all skills
     */
    listSkills: async (req, res, next) => {
        try {
            const skills = await Skill.findAll({
                where: { status: true },
                order: [['skillName', 'ASC']]
            });
            return success(res, skills, "Skills retrieved successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Get a single skill
     */
    getSkill: async (req, res, next) => {
        try {
            const { id } = req.params;
            const skill = await Skill.findByPk(id);
            if (!skill) {
                return error(res, "Skill not found", 404);
            }
            return success(res, skill, "Skill retrieved successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Create a new skill
     */
    createSkill: async (req, res, next) => {
        try {
            const { skillName } = req.body;
            if (!skillName) {
                return error(res, "Skill name is required", 400);
            }

            const existing = await Skill.findOne({ where: { skillName } });
            if (existing) {
                return error(res, "Skill already exists", 400);
            }

            const skill = await Skill.create({ skillName });
            return success(res, skill, "Skill created successfully", 201);
        } catch (err) {
            next(err);
        }
    },

    /**
     * Update a skill
     */
    updateSkill: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { skillName, status } = req.body;
            const skill = await Skill.findByPk(id);

            if (!skill) {
                return error(res, "Skill not found", 404);
            }

            await skill.update({ skillName, status });
            return success(res, skill, "Skill updated successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Delete a skill (Soft delete)
     */
    deleteSkill: async (req, res, next) => {
        try {
            const { id } = req.params;
            const skill = await Skill.findByPk(id);

            if (!skill) {
                return error(res, "Skill not found", 404);
            }

            await skill.update({ status: false });
            return success(res, null, "Skill deleted successfully");
        } catch (err) {
            next(err);
        }
    }
};

module.exports = skillController;

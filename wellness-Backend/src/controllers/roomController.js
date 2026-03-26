const { Room, Center } = require('../models');
const { success, error } = require('../utils/responseHelper');

/**
 * Room Controller
 */
const roomController = {
    /**
     * Create a new room
     */
    createRoom: async (req, res, next) => {
        try {
            const { centerId, roomName, roomType, capacity } = req.body;

            if (!centerId || !roomType) {
                return error(res, "Center ID and Room Type are required", 400);
            }

            // Validate center
            const center = await Center.findByPk(centerId);
            if (!center || !center.status) {
                return error(res, "Invalid or inactive center", 400);
            }

            const room = await Room.create({
                centerId,
                roomName,
                roomType,
                capacity,
                status: true
            });

            return success(res, room, "Room created successfully", 201);
        } catch (err) {
            next(err);
        }
    },

    /**
     * List rooms
     */
    listRooms: async (req, res, next) => {
        try {
            let { page = 1, limit = 10, includeInactive = false, centerId } = req.query;
            page = parseInt(page);
            limit = parseInt(limit);
            const offset = (page - 1) * limit;

            const where = {};
            if (includeInactive === 'true' && req.user.role === 'Admin') {
                // All
            } else {
                where.status = true;
            }

            if (centerId) {
                where.centerId = centerId;
            }

            const { count, rows } = await Room.findAndCountAll({
                where,
                include: [
                    {
                        model: Center,
                        as: 'center',
                        attributes: ['centerId', 'name', 'city']
                    }
                ],
                limit,
                offset,
                order: [['roomName', 'ASC']]
            });

            return success(res, {
                data: rows,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            }, "Rooms retrieved successfully");
        } catch (err) {
            next(err);
        }
    },

    getRoom: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { includeInactive = false } = req.query;

            const where = { roomId: id };
            if (!(includeInactive === 'true' && req.user.role === 'Admin')) {
                where.status = true;
            }

            const room = await Room.findOne({
                where,
                include: [
                    {
                        model: Center,
                        as: 'center',
                        attributes: ['centerId', 'name', 'city']
                    }
                ]
            });

            if (!room) {
                return error(res, "Room not found", 404);
            }

            return success(res, room, "Room retrieved successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Update room
     */
    updateRoom: async (req, res, next) => {
        try {
            const { id } = req.params;
            const room = await Room.findByPk(id);

            if (!room) {
                return error(res, "Room not found", 404);
            }

            if (req.body.centerId) {
                const center = await Center.findByPk(req.body.centerId);
                if (!center || !center.status) {
                    return error(res, "Invalid or inactive center", 400);
                }
            }

            await room.update(req.body);

            return success(res, room, "Room updated successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Soft delete room
     */
    deleteRoom: async (req, res, next) => {
        try {
            const { id } = req.params;
            const room = await Room.findByPk(id);

            if (!room) {
                return error(res, "Room not found", 404);
            }

            await room.update({ status: false });

            return success(res, null, "Room deactivated successfully");
        } catch (err) {
            next(err);
        }
    }
};

module.exports = roomController;

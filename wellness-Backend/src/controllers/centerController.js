const { Center, Therapist, Room, TherapyCategory } = require('../models');
const { success, error } = require('../utils/responseHelper');
const { Op } = require('sequelize');
const { parsePhoneNumberFromString } = require('libphonenumber-js');

/**
 * Helpers
 */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

const allowedFields = [
    'name',
    'address',
    'city',
    'contactNumber',
    'region', 
    
    'openingTime',
    'closingTime',
    'openDays',
    'status'
];

/**
 * Trim helper (prevents space-only inputs)
 */
const isEmptyOrSpaces = (value) => {
    return !value || value.trim().length === 0;
};

/**
 * Validate Data
 */
const validateCenterData = (data, isUpdate = false) => {
    const errors = [];

    let {
        name,
        address,
        city,
        contactNumber,
        region,
        openingTime,
        closingTime
    } = data;

    // Trim all string fields
    name = name?.trim();
    address = address?.trim();
    city = city?.trim();
    contactNumber = contactNumber?.trim();
    region = region?.trim();

    // Required fields (create)
    if (!isUpdate) {
        if (isEmptyOrSpaces(name)) errors.push("Name is required");
        if (isEmptyOrSpaces(address)) errors.push("Address is required");
        if (isEmptyOrSpaces(city)) errors.push("City is required");
        if (isEmptyOrSpaces(contactNumber)) errors.push("Contact number is required");
        if (isEmptyOrSpaces(openingTime)) errors.push("Opening time is required");
        if (isEmptyOrSpaces(closingTime)) errors.push("Closing time is required");
    }

    // Name validation
    if (name && name.length < 3) {
        errors.push("Name must be at least 3 characters");
    }

    // City validation
    if (city && city.length < 2) {
        errors.push("City must be valid");
    }

    /**
     * Phone Validation (NEW LOGIC)
     * Supports:
     * 1. region + number
     * 2. full number (+91xxxxxxxxxx)
     */
    if (contactNumber) {
        let fullPhone = contactNumber;

        // If region provided → combine
        if (region && !contactNumber.startsWith('+')) {
            fullPhone = `${region}${contactNumber} `;
        }

        const phone = parsePhoneNumberFromString(fullPhone);

        if (!phone || !phone.isValid()) {
            errors.push("Invalid phone number");
        } else {
            const nationalNumber = phone.nationalNumber;

            if (!/^\d{10}$/.test(nationalNumber)) {
                errors.push("Phone number must be exactly 10 digits");
            }
        }
    }

    // Time validation
    if (openingTime && !timeRegex.test(openingTime)) {
        errors.push("Invalid opening time format (HH:mm or HH:mm:ss)");
    }

    if (closingTime && !timeRegex.test(closingTime)) {
        errors.push("Invalid closing time format (HH:mm or HH:mm:ss)");
    }

    return errors;
};

/**
 * Sanitize Data
 */
const sanitizeData = (data) => {
    const cleanData = {};

    allowedFields.forEach(field => {
        if (data[field] !== undefined) {
            if (typeof data[field] === 'string') {
                cleanData[field] = data[field].trim();
            } else {
                cleanData[field] = data[field];
            }
        }
    });

    /**
     * Phone Normalization
     * Converts:
     * +919876543210 → region: +91, contactNumber: 9876543210
     * OR
     * region + number → normalized
     */
    if (cleanData.contactNumber) {
        let fullPhone = cleanData.contactNumber;

        if (cleanData.region && !cleanData.contactNumber.startsWith('+')) {
            fullPhone = `${cleanData.region}${cleanData.contactNumber} `;
        }

        const phone = parsePhoneNumberFromString(fullPhone);

        if (phone && phone.isValid()) {
            cleanData.region = `+ ${phone.countryCallingCode} `; // ✅ store region
            cleanData.contactNumber = phone.nationalNumber;   // ✅ store only 10 digit
        }
    }

    return cleanData;
};

/**
 * Center Controller
 */
const centerController = {

    createCenter: async (req, res, next) => {
        const transaction = await Center.sequelize.transaction();
        try {
            const errors = validateCenterData(req.body);

            if (errors.length) {
                return error(res, errors.join(', '), 400);
            }

            const data = sanitizeData(req.body);
            const { rooms } = req.body;

            const center = await Center.create({
                ...data,
                status: true
            }, { 
                transaction
            });

            // Create rooms if provided
            if (rooms && Array.isArray(rooms)) {
                const roomsData = rooms.map(r => ({
                    ...r,
                    centerId: center.centerId,
                    status: true
                }));
                await Room.bulkCreate(roomsData, { transaction });
            }

            await transaction.commit();

            // Fetch with rooms for response
            const newCenter = await Center.findByPk(center.centerId, {
                include: [{ model: Room, as: 'rooms' }]
            });

            return success(res, newCenter, "Center created successfully", 201);

        } catch (err) {
            await transaction.rollback();
            next(err);
        }
    },

    listCenters: async (req, res, next) => {
        try {
            let { page = 1, limit = 10, includeInactive = false, city, hasAvailability, search } = req.query;

            page = parseInt(page);
            limit = parseInt(limit);

            if (isNaN(page) || page < 1) page = 1;
            if (isNaN(limit) || limit < 1) limit = 10;

            const offset = (page - 1) * limit;

            const where = {};

            if (!(includeInactive === 'true' && req.user.role === 'Admin')) {
                where.status = true;
            }

            if (city && city.trim() !== '') {
                where.city = { [Op.iLike]: `%${city.trim()}%` };
            }

            if (search && search.trim() !== '') {
                where[Op.or] = [
                    { name: { [Op.iLike]: `%${search.trim()}%` } },
                    { city: { [Op.iLike]: `%${search.trim()}%` } },
                    { contactNumber: { [Op.iLike]: `%${search.trim()}%` } }
                ];
            }

            const { count, rows } = await Center.findAndCountAll({
                where,
                limit,
                offset,
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: TherapyCategory,
                        as: 'therapyCategories',
                        where: { status: true },
                        required: false,
                        through: { attributes: [] },
                        attributes: ['categoryId', 'categoryName']
                    }
                ]
            });

            const slotService = require('../services/slotService');

            const centersWithAvailability = await Promise.all(
                rows.map(async (center) => {
                    const data = center.toJSON();
                    data.hasAvailabilityToday = await slotService.computeCenterAvailabilityToday(center.centerId);
                    return data;
                })
            );

            let finalData = centersWithAvailability;

            if (hasAvailability === 'true') {
                finalData = finalData.filter(c => c.hasAvailabilityToday);
            }

            return success(res, {
                data: finalData,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            }, "Centers retrieved successfully");

        } catch (err) {
            next(err);
        }
    },

    getCenter: async (req, res, next) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return error(res, "Invalid center ID", 400);
            }

            const where = { centerId: id };

            if (!(req.query.includeInactive === 'true' && req.user.role === 'Admin')) {
                where.status = true;
            }

            const center = await Center.findOne({
                where,
                include: [
                    { model: Therapist, as: 'therapists', where: { status: true }, required: false },
                    { model: Room, as: 'rooms', where: { status: true }, required: false },
                    {
                        model: TherapyCategory,
                        as: 'therapyCategories',
                        where: { status: true },
                        required: false,
                        through: { attributes: [] }
                    }
                ]
            });

            if (!center) {
                return error(res, "Center not found", 404);
            }

            return success(res, center, "Center retrieved successfully");

        } catch (err) {
            next(err);
        }
    },

    updateCenter: async (req, res, next) => {
        const transaction = await Center.sequelize.transaction();
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return error(res, "Invalid center ID", 400);
            }

            const center = await Center.findByPk(id);

            if (!center) {
                return error(res, "Center not found", 404);
            }

            const errors = validateCenterData(req.body, true);

            if (errors.length) {
                return error(res, errors.join(', '), 400);
            }

            const data = sanitizeData(req.body);
            const { rooms } = req.body;

            await center.update(data, { transaction });

            // Handle Room updates if provided
            if (rooms && Array.isArray(rooms)) {
                const existingRooms = await Room.findAll({ where: { centerId: id } });
                const existingRoomIds = existingRooms.map(r => r.roomId);
                const incomingRoomIds = rooms.filter(r => r.roomId).map(r => r.roomId);

                // 1. Deactivate rooms not in incoming data
                const toDeactivate = existingRoomIds.filter(rid => !incomingRoomIds.includes(rid));
                if (toDeactivate.length) {
                    await Room.update({ status: false }, { 
                        where: { roomId: toDeactivate },
                        transaction 
                    });
                }

                // 2. Add or Update
                for (const rData of rooms) {
                    if (rData.roomId) {
                        // Update existing
                        await Room.update({ ...rData, status: true }, { 
                            where: { roomId: rData.roomId, centerId: id },
                            transaction 
                        });
                    } else {
                        // Create new
                        await Room.create({ ...rData, centerId: id, status: true }, { transaction });
                    }
                }
            }

            await transaction.commit();

            // Fetch updated
            const updatedCenter = await Center.findByPk(id, {
                include: [{ model: Room, as: 'rooms', where: { status: true }, required: false }]
            });

            return success(res, updatedCenter, "Center updated successfully");

        } catch (err) {
            await transaction.rollback();
            next(err);
        }
    },

    deleteCenter: async (req, res, next) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return error(res, "Invalid center ID", 400);
            }

            const center = await Center.findByPk(id);

            if (!center) {
                return error(res, "Center not found", 404);
            }

            await center.update({ status: false });

            return success(res, null, "Center deactivated successfully");

        } catch (err) {
            next(err);
        }
    }
};

module.exports = centerController;


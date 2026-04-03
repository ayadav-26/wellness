const { Therapist, WorkingHours, Booking, TherapistLeave, Room, TherapyService, CenterTherapyCategory, Center } = require('../models');
const { Op } = require('sequelize');

/**
 * Helper to get day name from date string
 */
const getDayName = (dateString) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateString);
    return days[d.getDay()];
};

/**
 * Slot Service
 */
const slotService = {
    /**
     * Compute if a center has any available slot today. (Lightweight check)
     */
    computeCenterAvailabilityToday: async (centerId) => {
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        const dayName = getDayName(today);

        const center = await Center.findByPk(centerId);
        if (!center || !center.status) return false;

        // Check if center is open today
        if (center.openDays && Array.isArray(center.openDays)) {
            if (!center.openDays.includes(dayName)) return false;
        }

        const therapists = await Therapist.findAll({
            where: { centerId, status: true },
            include: [
                {
                    model: WorkingHours,
                    as: 'workingHours',
                    where: { dayOfWeek: dayName, centerId },
                    required: true
                },
                {
                    model: TherapistLeave,
                    as: 'leaves',
                    where: {
                        leaveDate: {
                            [Op.between]: [startOfDay, endOfDay]
                        }
                    },
                    required: false
                }
            ]
        });

        // Filter out those on leave
        const availableTherapists = therapists.filter(t => !t.leaves || t.leaves.length === 0);
        
        return availableTherapists.length > 0;
    },
    /**
     * Get available slots for a given center, therapy, and date
     */
    getAvailableSlots: async (centerId, therapyId, date, genderPreference = 'NoPreference') => {
    const center = await Center.findByPk(centerId);
    if (!center || !center.status) throw new Error('Center not found or inactive');

    const dayName = getDayName(date);

    // ✅ Requirement 1: Check Center.openDays
    if (center.openDays && Array.isArray(center.openDays)) {
        if (!center.openDays.includes(dayName)) {
            return {
                therapy: await TherapyService.findByPk(therapyId),
                date,
                genderPreference,
                slots: [],
                totalSlots: 0,
                message: `Center is closed on ${dayName}`
            };
        }
    }

    const therapy = await TherapyService.findOne({ 
        where: { therapyId, status: true } 
    });
    if (!therapy) throw new Error('Therapy service not found or inactive');

    const mapping = await CenterTherapyCategory.findOne({
        where: { centerId, categoryId: therapy.categoryId }
    });
    if (!mapping) throw new Error('This therapy is not available at the selected center');

    const { durationMinutes, requiredRoomType, requiredSkill } = therapy;
    const trimmedSkill = requiredSkill ? requiredSkill.trim() : null;

    const genderFilter = {};
    if (genderPreference === 'Male') genderFilter.gender = 'Male';
    else if (genderPreference === 'Female') genderFilter.gender = 'Female';
    // NoPreference or other values will not add a gender filter, thus returning all.

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const therapists = await Therapist.findAll({
        where: { centerId, status: true, ...genderFilter },
        include: [
            {
                model: WorkingHours,
                as: 'workingHours',
                where: { dayOfWeek: dayName, centerId },
                required: true
            },
            {
                model: Booking,
                as: 'bookings',
                where: {
                    appointmentStartTime: { [Op.between]: [startOfDay, endOfDay] },
                    bookingStatus: { [Op.notIn]: ['Cancelled'] }
                },
                required: false
            },
            {
                model: TherapistLeave,
                as: 'leaves',
                where: {
                    leaveDate: {
                        [Op.between]: [startOfDay, endOfDay]
                    }
                },
                required: false
            }
        ]
    });

    const rooms = await Room.findAll({
        where: { centerId, roomType: requiredRoomType, status: true }
    });

    if (rooms.length === 0) {
        return {
            therapy,
            date,
            genderPreference,
            slots: [],
            totalSlots: 0
        };
    }

    const roomBookings = await Booking.findAll({
        where: {
            roomId: rooms.map(r => r.roomId),
            bookingStatus: { [Op.notIn]: ['Cancelled'] },
            appointmentStartTime: { [Op.between]: [startOfDay, endOfDay] }
        }
    });

    const isToday = new Date(date).toDateString() === new Date().toDateString();
    const now = new Date();

    const availableSlots = [];
    
    // We no longer use a generatedStore to block other therapists from showing up for the same time.
    // This allows administrators to see all available therapist options for a given slot.
    // Real database bookings will still correctly block all therapists from a room.

    for (const therapist of therapists) {

        if (therapist.leaves && therapist.leaves.length > 0) continue;

        // Skill check
        if (trimmedSkill && (!therapist.skillSet || !therapist.skillSet.includes(trimmedSkill))) continue;

        if (!therapist.workingHours || therapist.workingHours.length === 0) continue;

        const schedule = therapist.workingHours[0];
        if (!schedule.slots || !Array.isArray(schedule.slots) || schedule.slots.length === 0) continue;
        
        const firstSlot = schedule.slots[0];
        if (!firstSlot.start || !firstSlot.end) continue;

        const timeToDate = (timeStr) => {
            const [hours, minutes] = timeStr.split(':');
            const d = new Date(date);
            d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return d;
        };

        const dayStartTime = timeToDate(firstSlot.start);
        const dayEndTime = timeToDate(firstSlot.end);
        
        let currentSlotStart = new Date(dayStartTime);

        while (currentSlotStart.getTime() + durationMinutes * 60000 <= dayEndTime.getTime()) {

            const currentSlotEnd = new Date(currentSlotStart.getTime() + durationMinutes * 60000);

            // 0. Skip past slots for today
            if (isToday && currentSlotStart < now) {
                currentSlotStart = new Date(currentSlotStart.getTime() + durationMinutes * 60000);
                continue;
            }

            // 1. Therapist busy check
            let therapistBusy = false;
            for (const b of therapist.bookings) {
                const bStart = new Date(b.appointmentStartTime);
                const bEnd = new Date(b.appointmentEndTime);

                if (currentSlotStart < bEnd && currentSlotEnd > bStart) {
                    therapistBusy = true;
                    break;
                }
            }

            if (!therapistBusy) {
                // 2. Room availability check (DB Bookings Only)
                let freeRoom = null;

                for (const room of rooms) {
                    let roomBusy = false;

                    // Check DB Bookings for this specific room
                    const roomSpecificBookings = roomBookings.filter(rb => rb.roomId === room.roomId);
                    for (const rb of roomSpecificBookings) {
                        const rbStart = new Date(rb.appointmentStartTime);
                        const rbEnd = new Date(rb.appointmentEndTime);

                        if (currentSlotStart < rbEnd && currentSlotEnd > rbStart) {
                            roomBusy = true;
                            break;
                        }
                    }
                    if (roomBusy) continue;

                    if (!roomBusy) {
                        freeRoom = room;
                        break;
                    }
                }

                if (freeRoom) {
                    const newSlot = {
                        startTime: new Date(currentSlotStart),
                        endTime: new Date(currentSlotEnd),
                        therapist: {
                            therapistId: therapist.therapistId,
                            firstName: therapist.firstName,
                            lastName: therapist.lastName,
                            gender: therapist.gender
                        },
                        room: {
                            roomId: freeRoom.roomId,
                            roomName: freeRoom.roomName,
                            roomType: freeRoom.roomType
                        }
                    };
                    availableSlots.push(newSlot);
                }
            }

            currentSlotStart = new Date(currentSlotStart.getTime() + durationMinutes * 60000);
        }
    }

    return {
        therapy,
        date,
        genderPreference,
        slots: availableSlots,
        totalSlots: availableSlots.length
    };
}
};

module.exports = slotService;

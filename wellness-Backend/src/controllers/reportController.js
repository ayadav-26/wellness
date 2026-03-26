const { Booking, Therapist, TherapyService, Center } = require('../models');
const { success, error } = require('../utils/responseHelper');
const { Op, fn, col, literal } = require('sequelize');

/**
 * Report Controller
 */
const reportController = {
    /**
     * Booking Trends: Count total bookings grouped by period
     */
    getBookingTrends: async (req, res, next) => {
        try {
            const { centerId, startDate, endDate, period = 'daily' } = req.query;

            const where = { bookingStatus: { [Op.in]: ['Confirmed', 'Completed', 'Rescheduled'] } };
            if (centerId) where.centerId = centerId;
            if (startDate && endDate) {
                where.appointmentStartTime = { [Op.between]: [new Date(startDate), new Date(endDate)] };
            }

            let dateTrunc;
            switch (period.toLowerCase()) {
                case 'weekly': dateTrunc = 'week'; break;
                case 'monthly': dateTrunc = 'month'; break;
                default: dateTrunc = 'day';
            }

            const trends = await Booking.findAll({
                where,
                attributes: [
                    [fn('DATE_TRUNC', dateTrunc, col('appointmentStartTime')), 'period'],
                    [fn('COUNT', col('bookingId')), 'count']
                ],
                group: [fn('DATE_TRUNC', dateTrunc, col('appointmentStartTime'))],
                order: [[fn('DATE_TRUNC', dateTrunc, col('appointmentStartTime')), 'ASC']],
                raw: true
            });

            return success(res, trends, "Booking trends retrieved successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Therapist Utilization: Total bookings and minutes per therapist
     */
    getTherapistUtilization: async (req, res, next) => {
        try {
            const { centerId, startDate, endDate } = req.query;

            const where = { bookingStatus: { [Op.in]: ['Confirmed', 'Completed', 'Rescheduled'] } };
            if (centerId) where.centerId = centerId;
            if (startDate && endDate) {
                where.appointmentStartTime = { [Op.between]: [new Date(startDate), new Date(endDate)] };
            }

            const utilization = await Therapist.findAll({
                attributes: [
                    'therapistId', 'firstName', 'lastName',
                    [fn('COUNT', col('bookings.bookingId')), 'totalBookings'],
                    [fn('SUM', col('bookings->therapy.durationMinutes')), 'totalMinutes']
                ],
                include: [
                    {
                        model: Booking,
                        as: 'bookings',
                        where,
                        attributes: [],
                        required: false,
                        include: [
                            {
                                model: TherapyService,
                                as: 'therapy',
                                attributes: [],
                                required: true
                            }
                        ]
                    }
                ],
                group: ['Therapist.therapistId', 'Therapist.firstName', 'Therapist.lastName'],
                raw: true
            });

            // Convert nulls to 0 and cleanup field names from raw query
            const formattedResult = utilization.map(u => ({
                therapistId: u.therapistId,
                firstName: u.firstName,
                lastName: u.lastName,
                totalBookings: parseInt(u.totalBookings) || 0,
                totalMinutes: parseInt(u.totalMinutes) || 0
            }));

            return success(res, formattedResult, "Therapist utilization retrieved successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Peak Times: Group bookings by hour
     */
    getPeakTimes: async (req, res, next) => {
        try {
            const { centerId, startDate, endDate } = req.query;

            const where = { bookingStatus: { [Op.in]: ['Confirmed', 'Completed', 'Rescheduled'] } };
            if (centerId) where.centerId = centerId;
            if (startDate && endDate) {
                where.appointmentStartTime = { [Op.between]: [new Date(startDate), new Date(endDate)] };
            }

            const peaks = await Booking.findAll({
                where,
                attributes: [
                    [fn('EXTRACT', literal('HOUR FROM "appointmentStartTime"')), 'hour'],
                    [fn('COUNT', col('bookingId')), 'count']
                ],
                group: [fn('EXTRACT', literal('HOUR FROM "appointmentStartTime"'))],
                order: [[fn('EXTRACT', literal('HOUR FROM "appointmentStartTime"')), 'ASC']],
                raw: true
            });

            return success(res, peaks, "Peak times retrieved successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Cancellation Stats: Percentage of total bookings
     */
    getCancellationStats: async (req, res, next) => {
        try {
            const { centerId, startDate, endDate } = req.query;

            const where = {};
            if (centerId) where.centerId = centerId;
            if (startDate && endDate) {
                where.appointmentStartTime = { [Op.between]: [new Date(startDate), new Date(endDate)] };
            }

            const stats = await Booking.findAll({
                where,
                attributes: [
                    'bookingStatus',
                    [fn('COUNT', col('bookingId')), 'count']
                ],
                group: ['bookingStatus'],
                raw: true
            });

            const totalBookings = stats.reduce((acc, curr) => acc + parseInt(curr.count), 0);
            const cancelled = parseInt(stats.find(s => s.bookingStatus === 'Cancelled')?.count) || 0;
            const noShow = parseInt(stats.find(s => s.bookingStatus === 'NoShow')?.count) || 0;

            const cancellationRate = totalBookings > 0 ? (cancelled / totalBookings * 100).toFixed(2) : 0;
            const noShowRate = totalBookings > 0 ? (noShow / totalBookings * 100).toFixed(2) : 0;

            return success(res, {
                totalBookings,
                cancelled,
                noShow,
                cancellationRate: `${cancellationRate}%`,
                noShowRate: `${noShowRate}%`
            }, "Cancellation stats retrieved successfully");
        } catch (err) {
            next(err);
        }
    },

    /**
     * Customer History: Aggregated by customer phone
     */
    getCustomerHistory: async (req, res, next) => {
        try {
            const { customerPhone, centerId } = req.query;

            if (customerPhone) {
                // Return full history for specific customer
                const history = await Booking.findAll({
                    where: { customerPhone },
                    include: [
                        { model: Center, as: 'center', attributes: ['name'] },
                        { model: TherapyService, as: 'therapy', attributes: ['therapyName'] }
                    ],
                    order: [['appointmentStartTime', 'DESC']]
                });
                return success(res, history, "Customer booking history retrieved successfully");
            }

            // Return aggregate for all customers
            const where = {};
            if (centerId) where.centerId = centerId;

            const aggregates = await Booking.findAll({
                where,
                attributes: [
                    'customerName',
                    'customerPhone',
                    [fn('COUNT', col('bookingId')), 'totalBookings'],
                    [fn('MAX', col('appointmentStartTime')), 'lastBookingDate']
                ],
                group: ['customerName', 'customerPhone'],
                order: [[fn('MAX', col('appointmentStartTime')), 'DESC']],
                raw: true
            });

            return success(res, aggregates, "Customer aggregated history retrieved successfully");
        } catch (err) {
            next(err);
        }
    }
};

module.exports = reportController;

const { Booking, Therapist, TherapyService, User, Room } = require('../models');
const { success } = require('../utils/responseHelper');
const { Op, fn, col, literal } = require('sequelize');

/**
 * Dashboard Controller — aggregates live stats for the admin dashboard
 */
const dashboardController = {
    /**
     * GET /api/v1/dashboard/stats
     * Returns:
     *   - bookingsToday     : count of non-cancelled bookings today
     *   - activeTherapists  : count of active therapists (status=true)
     *   - cancellationsToday: count of Cancelled bookings today
     *   - weeklyTrend       : last 7 days booking counts [{date, count}]
     *   - upcomingToday     : list of next upcoming bookings (today, sorted by time)
     */
    getStats: async (req, res, next) => {
        try {
            const { centerId } = req.query;

            // ── Date Helpers ──
            const now = new Date();
            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date(now);
            todayEnd.setHours(23, 59, 59, 999);

            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 6);
            weekAgo.setHours(0, 0, 0, 0);

            const baseWhere = {};
            if (centerId) baseWhere.centerId = centerId;

            // ── 1. Bookings Today ──
            const bookingsToday = await Booking.count({
                where: {
                    ...baseWhere,
                    appointmentStartTime: { [Op.between]: [todayStart, todayEnd] },
                    bookingStatus: { [Op.notIn]: ['Cancelled'] }
                }
            });

            // ── 2. Active Therapists ──
            const therapistWhere = { status: true };
            if (centerId) therapistWhere.centerId = centerId;
            const activeTherapists = await Therapist.count({ where: therapistWhere });

            // ── 3. Cancellations Today ──
            const cancellationsToday = await Booking.count({
                where: {
                    ...baseWhere,
                    appointmentStartTime: { [Op.between]: [todayStart, todayEnd] },
                    bookingStatus: 'Cancelled'
                }
            });

            // ── 4. Weekly Trend (last 7 days including today) ──
            const trendRaw = await Booking.findAll({
                where: {
                    ...baseWhere,
                    appointmentStartTime: { [Op.between]: [weekAgo, todayEnd] },
                    bookingStatus: { [Op.notIn]: ['Cancelled'] }
                },
                attributes: [
                    [fn('DATE_TRUNC', 'day', col('appointmentStartTime')), 'day'],
                    [fn('COUNT', col('bookingId')), 'count']
                ],
                group: [fn('DATE_TRUNC', 'day', col('appointmentStartTime'))],
                order: [[fn('DATE_TRUNC', 'day', col('appointmentStartTime')), 'ASC']],
                raw: true
            });

            // Build a full 7-day series (fill 0 for days with no bookings)
            const trendMap = new Map();
            trendRaw.forEach(r => {
                const d = new Date(r.day);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                trendMap.set(key, parseInt(r.count) || 0);
            });

            const weeklyTrend = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
                weeklyTrend.push({ date: key, day: dayLabel, count: trendMap.get(key) || 0 });
            }

            // ── 5. Upcoming Bookings (from tomorrow, next 30 days) ──
            const tomorrowStart = new Date(now);
            tomorrowStart.setDate(now.getDate() + 1);
            tomorrowStart.setHours(0, 0, 0, 0);

            const next30Days = new Date(now);
            next30Days.setDate(now.getDate() + 30);
            next30Days.setHours(23, 59, 59, 999);

            const upcomingToday = await Booking.findAll({
                where: {
                    ...baseWhere,
                    appointmentStartTime: { [Op.between]: [tomorrowStart, next30Days] },
                    bookingStatus: { [Op.notIn]: ['Cancelled', 'Completed'] }
                },
                include: [
                    { model: TherapyService, as: 'therapy', attributes: ['therapyName'] },
                    { model: Therapist, as: 'therapist', attributes: ['firstName', 'lastName'] }
                ],
                order: [['appointmentStartTime', 'ASC']],
                limit: 10
            });

            const formattedUpcoming = upcomingToday.map(b => ({
                bookingId: b.bookingId,
                customer: b.customerName,
                therapy: b.therapy?.therapyName || 'N/A',
                therapist: b.therapist ? `${b.therapist.firstName} ${b.therapist.lastName}` : 'N/A',
                time: new Date(b.appointmentStartTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                status: b.bookingStatus
            }));

            return success(res, {
                bookingsToday,
                activeTherapists,
                cancellationsToday,
                weeklyTrend,
                upcomingToday: formattedUpcoming
            }, 'Dashboard stats fetched successfully');

        } catch (err) {
            next(err);
        }
    }
};

module.exports = dashboardController;

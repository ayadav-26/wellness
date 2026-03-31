const express = require('express');
const errorHandler = require('./src/middleware/errorHandler');
const trimAndValidate = require('./src/middleware/validationMiddleware');
const cors = require('cors');
const seedSuperAdmin = require('./src/seeds/seedSuperAdmin');
const app = express();
const env = require('./src/config/env');

//  CORS (put BEFORE routes)
const allowedOrigins = env.ALLOWED_ORIGINS;

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps, postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(trimAndValidate);

// Routes
app.use('/api/v1/auth', require('./src/routes/authRoutes'));
app.use('/api/v1/users', require('./src/routes/userRoutes'));
app.use('/api/v1/centers', require('./src/routes/centerRoutes'));
app.use('/api/v1/categories', require('./src/routes/therapyCategoryRoutes'));
app.use('/api/v1/therapies', require('./src/routes/therapyServiceRoutes'));
app.use('/api/v1/therapists', require('./src/routes/therapistRoutes'));
app.use('/api/v1/search', require('./src/routes/searchRoutes'));
app.use('/api/v1/rooms', require('./src/routes/roomRoutes'));
app.use('/api/v1/working-hours', require('./src/routes/workingHoursRoutes'));
app.use('/api/v1/leaves', require('./src/routes/therapistLeaveRoutes'));
app.use('/api/v1/bookings', require('./src/routes/bookingRoutes'));
app.use('/api/v1/slots', require('./src/routes/slotRoutes'));
app.use('/api/v1/reports', require('./src/routes/reportRoutes'));
app.use('/api/v1/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/v1/center-therapy-categories', require('./src/routes/centerTherapyCategoryRoutes'));
app.use('/api/v1/skills', require('./src/routes/skillRoutes'));
app.use('/api/v1/permissions', require('./src/routes/permissionRoutes'));

app.get('/', (req, res) => {
    res.json({ message: "Wellness Center Booking System API v1.0" });
});

// Error Handler Middleware (MUST be last)
app.use(errorHandler);

// seedSuperAdmin call moved to server.js to ensure DB is connected first

module.exports = app;

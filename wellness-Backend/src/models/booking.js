const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Booking = sequelize.define('Booking', {
    bookingId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    centerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    therapyId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    therapistId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    roomId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    customerName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    customerPhone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    therapistGenderPreference: {
        type: DataTypes.ENUM('Male', 'Female', 'NoPreference'),
        allowNull: false
    },
    appointmentStartTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    appointmentEndTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    bookingStatus: {
        type: DataTypes.ENUM('Pending', 'Confirmed', 'Rescheduled', 'Cancelled', 'Completed', 'NoShow'),
        defaultValue: 'Pending'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    customerEmail: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'Bookings',
    timestamps: true,
    updatedAt: false
});

module.exports = Booking;

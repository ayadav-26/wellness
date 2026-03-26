const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const WorkingHours = sequelize.define('WorkingHours', {
    workingHourId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    centerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    therapistId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    dayOfWeek: {
        type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
        allowNull: false
    },
    slots: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    }
}, {
    tableName: 'WorkingHours',
    timestamps: false
});

module.exports = WorkingHours;

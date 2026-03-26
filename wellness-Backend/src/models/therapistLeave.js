const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TherapistLeave = sequelize.define('TherapistLeave', {
    leaveId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    therapistId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    leaveDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'TherapistLeaves',
    timestamps: true,
    updatedAt: false
});

module.exports = TherapistLeave;

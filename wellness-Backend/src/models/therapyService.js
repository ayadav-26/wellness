const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TherapyService = sequelize.define('TherapyService', {
    therapyId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    therapyName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    requiredRoomType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    requiredSkill: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'TherapyServices',
    timestamps: true,
    updatedAt: false
});

module.exports = TherapyService;

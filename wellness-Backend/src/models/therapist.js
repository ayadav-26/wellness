const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Therapist = sequelize.define('Therapist', {
    therapistId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gender: {
        type: DataTypes.ENUM('Male', 'Female'),
        allowNull: false
    },
    experienceYears: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    skillSet: {
        type: DataTypes.JSON,
        allowNull: true
    },
    centerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isNumeric: true,
            len: [10, 10]
        }
    },
    region: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '+91'
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'Therapists',
    timestamps: true,
    updatedAt: false
});

module.exports = Therapist;

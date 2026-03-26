const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Center = sequelize.define('Center', {
    centerId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contactNumber: {
        type: DataTypes.STRING,
        allowNull: false,
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
    openingTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    closingTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    openDays: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'Centers',
    timestamps: true
});

module.exports = Center;

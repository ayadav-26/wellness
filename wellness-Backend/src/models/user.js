const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
    userId: {
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
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('Super_Admin', 'Admin', 'Receptionist', 'User'),
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    centerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Centers',
            key: 'centerId'
        }
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    profileImageUrl: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'Users',
    timestamps: true
});

module.exports = User;

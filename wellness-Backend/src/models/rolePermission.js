const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const RolePermission = sequelize.define('RolePermission', {
    rolePermissionId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    role: {
        type: DataTypes.ENUM('Super_Admin', 'Admin', 'Receptionist', 'User'),
        allowNull: false
    },
    moduleName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isVisible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },

    canCreate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    canEdit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    canDelete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
}, {
    tableName: 'RolePermissions',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['role', 'moduleName']
        }
    ]
});

module.exports = RolePermission;

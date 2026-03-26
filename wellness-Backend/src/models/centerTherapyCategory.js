const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CenterTherapyCategory = sequelize.define('CenterTherapyCategory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    centerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'CenterTherapyCategories',
    timestamps: true,
    updatedAt: false
});

module.exports = CenterTherapyCategory;

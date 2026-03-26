const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TherapyCategory = sequelize.define('TherapyCategory', {
    categoryId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    categoryName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'TherapyCategories',
    timestamps: true,
    updatedAt: false
});

module.exports = TherapyCategory;

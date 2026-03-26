const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Skill = sequelize.define('Skill', {
    skillId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    skillName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'Skills',
    timestamps: true,
    updatedAt: false
});

module.exports = Skill;

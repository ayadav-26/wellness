const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Room = sequelize.define('Room', {
    roomId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    centerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    roomName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    roomType: {
        type: DataTypes.ENUM('Standard', 'Spa Room', 'Hydrotherapy Room', 'Physiotherapy Room', 'Ayurveda Therapy Room', 'Meditation / Yoga Room', 'Electrotherapy Room'),
        allowNull: false
    },
    roomType: {
        type: DataTypes.ENUM('Standard', 'Spa Room', 'Hydrotherapy Room', 'Physiotherapy Room', 'Ayurveda Therapy Room', 'Meditation / Yoga Room', 'Electrotherapy Room'),
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'Rooms',
    timestamps: false
});

module.exports = Room;

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Rooms', {
      roomId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      centerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Centers',
          key: 'centerId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      roomName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      roomType: {
        type: Sequelize.ENUM('Spa Room', 'Hydro Room', 'Physiotherapy Room'),
        allowNull: false
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Rooms');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Rooms_roomType";');
  }
};

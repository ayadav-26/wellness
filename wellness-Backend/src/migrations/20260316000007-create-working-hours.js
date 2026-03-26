'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('WorkingHours', {
      workingHourId: {
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
        onDelete: 'CASCADE'
      },
      therapistId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Therapists',
          key: 'therapistId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      dayOfWeek: {
        type: Sequelize.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
        allowNull: false
      },
      startTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      endTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      breakStartTime: {
        type: Sequelize.TIME,
        allowNull: true
      },
      breakEndTime: {
        type: Sequelize.TIME,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('WorkingHours');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_WorkingHours_dayOfWeek";');
  }
};

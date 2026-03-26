'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TherapistLeaves', {
      leaveId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      leaveDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TherapistLeaves');
  }
};

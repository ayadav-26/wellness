'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Therapists', {
      therapistId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      gender: {
        type: Sequelize.ENUM('Male', 'Female'),
        allowNull: false
      },
      experienceYears: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      skillSet: {
        type: Sequelize.JSON,
        allowNull: true
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
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Therapists');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Therapists_gender";');
  }
};

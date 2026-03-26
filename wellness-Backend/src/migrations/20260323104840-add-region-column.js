'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const userTable = await queryInterface.describeTable('Users');
    if (!userTable.region) {
      await queryInterface.addColumn('Users', 'region', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '+91'
      });
    }

    const therapistTable = await queryInterface.describeTable('Therapists');
    if (!therapistTable.region) {
      await queryInterface.addColumn('Therapists', 'region', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '+91'
      });
    }

    const centerTable = await queryInterface.describeTable('Centers');
    if (!centerTable.region) {
      await queryInterface.addColumn('Centers', 'region', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '+91'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'region');
    await queryInterface.removeColumn('Therapists', 'region');
    await queryInterface.removeColumn('Centers', 'region');
  }
};


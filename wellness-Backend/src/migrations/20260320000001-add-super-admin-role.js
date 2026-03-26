'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'Super_Admin' to the existing role ENUM in PostgreSQL.
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'Super_Admin';`
    );
  },

  async down(queryInterface, Sequelize) {
    // PostgreSQL does not support removing ENUM values without replacing the type.
    console.log('Cannot remove Super_Admin from enum — manual action required if needed.');
  }
};

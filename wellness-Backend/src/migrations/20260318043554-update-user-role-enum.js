'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add value 'User' to 'enum_Users_role'
    await queryInterface.sequelize.query('ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS \'User\';');
  },

  async down (queryInterface, Sequelize) {
    // Note: Postgres doesn't support dropping an enum value easily.
    // It requires creating a new type and migrating. We will throw an error or do a no-op here.
    console.log('Rolling back ENUM changes is not easily supported in PostgreSQL without replacing the entire type.');
  }
};

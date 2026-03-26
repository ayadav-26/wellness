'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // PostreSQL specific way to add value to an existing ENUM
    // Note: We use try-catch or IF NOT EXISTS logic if possible, 
    // but in standard Sequelize migrations for Postgres, we can execution a raw query.
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Rooms_roomType" ADD VALUE IF NOT EXISTS 'Standard' AFTER 'Spa Room';
    `).catch(err => {
      // If the error is 'already exists', we can ignore it
      if (err.message.includes('already exists')) {
        return;
      }
      throw err;
    });
  },

  async down(queryInterface, Sequelize) {
    // Note: Removing a value from an ENUM in Postgres is complex 
    // and usually requires recreating the type. We typically don't revert ENUM value additions
    // unless strictly necessary for a rollback. 
    console.log('Down migration: Removing an ENUM value is not supported via simple ALTER TYPE.');
  }
};

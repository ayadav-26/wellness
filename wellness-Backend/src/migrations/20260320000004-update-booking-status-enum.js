'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Rename existing enum if necessary or just alter column.
    // In Postgres, altering ENUM type is a bit tricky. 
    // Usually, we add new values to the existing type or create a new one.
    
    // Check if the type exists and add values (Postgres specific)
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Bookings_bookingStatus" ADD VALUE IF NOT EXISTS 'Pending';
      ALTER TYPE "enum_Bookings_bookingStatus" ADD VALUE IF NOT EXISTS 'Confirmed';
      ALTER TYPE "enum_Bookings_bookingStatus" ADD VALUE IF NOT EXISTS 'Rescheduled';
    `);

    // Update existing 'Booked' to 'Confirmed'
    await queryInterface.sequelize.query(`
      UPDATE "Bookings" SET "bookingStatus" = 'Confirmed' WHERE "bookingStatus" = 'Booked';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Reverting is hard for ENUMs in Postgres without dropping the column/type.
    // For this project, we'll keep the new values.
  }
};

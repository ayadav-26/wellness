'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@123', salt);

    // Check if the user already exists to avoid unique constraint errors
    const [existing] = await queryInterface.sequelize.query(
      `SELECT "userId" FROM "Users" WHERE "email" = 'admin@wellnesshub.com' LIMIT 1;`
    );

    if (existing.length === 0) {
      return queryInterface.bulkInsert('Users', [{
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@wellnesshub.com',
        phoneNumber: '9876543210',
        passwordHash: passwordHash,
        role: 'Super_Admin',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
    }
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Users', { email: 'admin@wellnesshub.com' }, {});
  }
};

'use strict';

const bcrypt = require('bcryptjs');
const { User } = require('../models');
const ROLES = require('../constants/roles');

/**
 * Seeds the Super Admin on first startup if userId=1 doesn't exist.
 * This is the ONLY way to create a SUPER_ADMIN — never via a public API.
 */
const seedSuperAdmin = async () => {
  try {
    const exists = await User.findOne({ where: { userId: 1 } });
    if (!exists) {
      const passwordHash = await bcrypt.hash(
        process.env.SUPER_ADMIN_PASS || 'SuperAdmin@1234',
        10
      );
      await User.create({
        firstName:    'Super',
        lastName:     'Admin',
        email:        process.env.SUPER_ADMIN_EMAIL || 'superadmin@wellness.com',
        phoneNumber:  '+910000000001',
        passwordHash,
        role:         ROLES.SUPER_ADMIN,
        status:       true,
      });
      console.log('✅ Super Admin seeded successfully.');
    }
  } catch (err) {
    console.error('❌ Failed to seed Super Admin:', err.message);
  }
};

module.exports = seedSuperAdmin;

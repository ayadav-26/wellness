'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add region to Bookings
    await queryInterface.addColumn('Bookings', 'region', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '+91'
    });

    // 2. Data migration script to split existing numbers
    const tables = [
      { name: 'Users', phoneCol: 'phoneNumber' },
      { name: 'Therapists', phoneCol: 'phoneNumber' },
      { name: 'Centers', phoneCol: 'contactNumber' },
      { name: 'Bookings', phoneCol: 'customerPhone' }
    ];

    for (const table of tables) {
      const [records] = await queryInterface.sequelize.query(
        `SELECT "${table.phoneCol}", "${table.name === 'Users' ? 'userId' : table.name === 'Therapists' ? 'therapistId' : table.name === 'Centers' ? 'centerId' : 'bookingId'}" FROM "${table.name}";`
      );

      for (const record of records) {
        const phone = record[table.phoneCol];
        const pk = record[table.name === 'Users' ? 'userId' : table.name === 'Therapists' ? 'therapistId' : table.name === 'Centers' ? 'centerId' : 'bookingId'];
        
        if (phone && phone.startsWith('+')) {
          // Attempt to extract last 10 digits as local number and anything before that as region
          const localNumber = phone.slice(-10);
          const region = phone.slice(0, -10);
          
          if (localNumber.length === 10 && /^\d+$/.test(localNumber)) {
            await queryInterface.sequelize.query(
              `UPDATE "${table.name}" SET "${table.phoneCol}" = :localNumber, "region" = :region WHERE "${table.name === 'Users' ? 'userId' : table.name === 'Therapists' ? 'therapistId' : table.name === 'Centers' ? 'centerId' : 'bookingId'}" = :pk;`,
              {
                replacements: { localNumber, region, pk },
                type: Sequelize.QueryTypes.UPDATE
              }
            );
          }
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // No easy way to undo data split perfectly if prefixes vary, but we can remove the column
    await queryInterface.removeColumn('Bookings', 'region');
  }
};

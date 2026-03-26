const { sequelize } = require('../src/config/db');

async function fixPhoneNumbers() {
  const tables = [
    { name: 'Users', phoneCol: 'phoneNumber', pk: 'userId' },
    { name: 'Therapists', phoneCol: 'phoneNumber', pk: 'therapistId' },
    { name: 'Centers', phoneCol: 'contactNumber', pk: 'centerId' },
    { name: 'Bookings', phoneCol: 'customerPhone', pk: 'bookingId' }
  ];

  console.log('Starting phone number data fix...');

  for (const table of tables) {
    try {
      const [records] = await sequelize.query(`SELECT "${table.phoneCol}", "${table.pk}" FROM "${table.name}";`);
      console.log(`Processing ${records.length} records from ${table.name}...`);

      for (const record of records) {
        const phone = record[table.phoneCol];
        const pk = record[table.pk];

        if (phone && phone.startsWith('+')) {
          const localNumber = phone.slice(-10);
          const region = phone.slice(0, -10);

          if (localNumber.length === 10 && /^\d+$/.test(localNumber)) {
            await sequelize.query(
              `UPDATE "${table.name}" SET "${table.phoneCol}" = :localNumber, "region" = :region WHERE "${table.pk}" = :pk;`,
              {
                replacements: { localNumber, region, pk },
                type: sequelize.QueryTypes.UPDATE
              }
            );
          }
        }
      }
    } catch (err) {
      console.error(`Error processing table ${table.name}:`, err.message);
    }
  }

  console.log('Finished phone number data fix.');
  process.exit(0);
}

fixPhoneNumbers();

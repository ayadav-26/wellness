'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add slots column
    await queryInterface.addColumn('WorkingHours', 'slots', {
      type: Sequelize.JSON,
      allowNull: true
    });

    // Migrate existing data from startTime/endTime to slots
    const [existingRecords] = await queryInterface.sequelize.query(
      'SELECT "workingHourId", "startTime", "endTime", "breakStartTime", "breakEndTime" FROM "WorkingHours"'
    );

    for (const record of existingRecords) {
      const slots = [];
      if (record.startTime && record.endTime) {
        // If there's a break, we can split it into two slots
        if (record.breakStartTime && record.breakEndTime) {
          slots.push({ start: record.startTime, end: record.breakStartTime });
          slots.push({ start: record.breakEndTime, end: record.endTime });
        } else {
          slots.push({ start: record.startTime, end: record.endTime });
        }
      }

      await queryInterface.sequelize.query(
        'UPDATE "WorkingHours" SET "slots" = :slots WHERE "workingHourId" = :id',
        {
          replacements: { 
            slots: JSON.stringify(slots),
            id: record.workingHourId
          }
        }
      );
    }

    // Remove old columns
    await queryInterface.removeColumn('WorkingHours', 'startTime');
    await queryInterface.removeColumn('WorkingHours', 'endTime');
    await queryInterface.removeColumn('WorkingHours', 'breakStartTime');
    await queryInterface.removeColumn('WorkingHours', 'breakEndTime');
  },

  async down(queryInterface, Sequelize) {
    // Restore columns
    await queryInterface.addColumn('WorkingHours', 'startTime', { type: Sequelize.TIME, allowNull: true });
    await queryInterface.addColumn('WorkingHours', 'endTime', { type: Sequelize.TIME, allowNull: true });
    await queryInterface.addColumn('WorkingHours', 'breakStartTime', { type: Sequelize.TIME, allowNull: true });
    await queryInterface.addColumn('WorkingHours', 'breakEndTime', { type: Sequelize.TIME, allowNull: true });

    // Reverse JSON slots back to columns (approximate)
    const [records] = await queryInterface.sequelize.query(
      'SELECT "workingHourId", "slots" FROM "WorkingHours"'
    );

    for (const record of records) {
        const slots = record.slots;
        if (Array.isArray(slots) && slots.length > 0) {
            // First slot start/end
            const startTime = slots[0].start;
            const endTime = slots[slots.length - 1].end;
            let breakStartTime = null;
            let breakEndTime = null;

            if (slots.length > 1) {
                breakStartTime = slots[0].end;
                breakEndTime = slots[1].start;
            }

            await queryInterface.sequelize.query(
                'UPDATE "WorkingHours" SET "startTime" = :start, "endTime" = :end, "breakStartTime" = :bs, "breakEndTime" = :be WHERE "workingHourId" = :id',
                {
                    replacements: {
                        start: startTime,
                        end: endTime,
                        bs: breakStartTime,
                        be: breakEndTime,
                        id: record.workingHourId
                    }
                }
            );
        }
    }

    // Remove slots column
    await queryInterface.removeColumn('WorkingHours', 'slots');
  }
};

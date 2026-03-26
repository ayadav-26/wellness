'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bookings', {
      bookingId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      centerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Centers',
          key: 'centerId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      therapyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'TherapyServices',
          key: 'therapyId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      therapistId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Therapists',
          key: 'therapistId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      roomId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Rooms',
          key: 'roomId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      customerName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      customerPhone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      therapistGenderPreference: {
        type: Sequelize.ENUM('Male', 'Female', 'NoPreference'),
        allowNull: false
      },
      appointmentStartTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      appointmentEndTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      bookingStatus: {
        type: Sequelize.ENUM('Booked', 'Cancelled', 'Completed', 'NoShow'),
        defaultValue: 'Booked'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Bookings');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Bookings_therapistGenderPreference";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Bookings_bookingStatus";');
  }
};

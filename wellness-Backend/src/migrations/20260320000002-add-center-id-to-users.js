'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'centerId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Centers',
        key: 'centerId'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'centerId');
  }
};

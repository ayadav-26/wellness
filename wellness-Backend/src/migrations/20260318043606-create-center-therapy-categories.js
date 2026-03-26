'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('CenterTherapyCategories')) {
      await queryInterface.createTable('CenterTherapyCategories', {
      id: {
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
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'TherapyCategories',
          key: 'categoryId'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

      // Composite unique constraint
      await queryInterface.addConstraint('CenterTherapyCategories', {
        fields: ['centerId', 'categoryId'],
        type: 'unique',
        name: 'unique_center_category'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CenterTherapyCategories');
  }
};

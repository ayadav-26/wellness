const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.DB.NAME, env.DB.USER, env.DB.PASSWORD, {
    host: env.DB.HOST,
    port: env.DB.PORT,
    dialect: 'postgres',
    logging: env.NODE_ENV === 'development' ? console.log : false,
    define: {
        timestamps: true,
        underscored: false
    }
});

const connectDB = async () => {
    try {
        await sequelize.sync({ alter: true });
        // await sequelize.authenticate();
        console.log('PostgreSQL database connected successfully via Sequelize.');
    } catch (error) {
        console.error('Unable to connect to the database:', error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };

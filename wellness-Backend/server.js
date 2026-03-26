const app = require('./app');
const env = require('./src/config/env');
const { connectDB } = require('./src/config/db');

// Load models so Sequelize knows them before sync
require('./src/models');

const PORT = env.PORT || 3000;

const startServer = async () => {
    try {
        // Connect to Database
        await connectDB();

        // Seed Super Admin ONLY after DB connection is ready
        await require('./src/seeds/seedSuperAdmin')();
        // Seed RBAC Permissions
        await require('./src/seeds/seedPermissions')();

        app.listen(PORT, () => {
            console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
        });

    } catch (error) {
        console.error('Server startup failed:', error);
        process.exit(1);
    }
};

startServer();
import app from './app';
import {env} from './config/env';
import {connectDatabase} from './config/database';

const startServer = async () => {
    try {
        await connectDatabase();

        const port = parseInt(env.PORT);
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            console.log(`Environment: ${env.NODE_ENV}`);
            console.log(`API URL: ${env.API_URL}`);
            console.log(`Frontend URL: ${env.FRONTEND_URL}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

startServer();

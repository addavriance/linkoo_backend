import app from './app';
import {env} from './config/env';
import {HOUR} from "./constants";
import {connectDatabase} from './config/database';
import {startTokenCleanup} from "./services/token.service";
import {startSubscriptionPolling} from "./services/subscription.service";

const startServer = async () => {
    try {
        await connectDatabase();

        startTokenCleanup(24 * HOUR);
        console.log('Token cleanup service started');
        startSubscriptionPolling(24 * HOUR);
        console.log('Subscription service started');

        const port = parseInt(env.PORT);

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            console.log(`Environment: ${env.NODE_ENV}`);
            console.log(`API URL: ${env.API_URL}`);
            console.log(`Frontend URL: ${env.FRONTEND_URL}`);
            console.log('WebSocket support enabled via express-ws');
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

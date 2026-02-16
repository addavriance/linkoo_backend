import express, {Application} from 'express';
import expressWs from 'express-ws';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import {env} from './config/env';
import {corsOptions} from './config/cors';
import {apiLimiter} from './middleware/rateLimiter';
import {errorHandler, notFoundHandler} from './middleware/errorHandler';
import routes from './routes';
import redirectRoutes from './routes/redirect.routes';
import { handleMaxAuthConnection } from './websocket/maxAuth.handler';

const { app } = expressWs(express());

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors(corsOptions));

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));

app.use(compression());

if (env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
    });
});

app.use('/api', apiLimiter);

// WebSocket роут ПЕРЕД обычными роутами
app.ws('/api/auth/max', (ws: any, _req: any) => {
    console.log('[App] ✅ WebSocket connection established для MAX auth');
    handleMaxAuthConnection(ws);
});
console.log('[App] 🔌 WebSocket route registered: /api/auth/max');

app.use('/api', routes);

app.use('/uploads', (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.resolve(__dirname, '..', 'uploads')));

app.use('/', redirectRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

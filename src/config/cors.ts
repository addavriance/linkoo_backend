import {CorsOptions} from 'cors';
import {env} from './env';

const allowedOrigins = [
    'https://linkoo.dev',
    'https://www.linkoo.dev',
];

if (env.NODE_ENV === 'development') {
    allowedOrigins.push(
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000'
    );
}

const subdomainPattern = /^https:\/\/[a-z0-9-]+\.linkoo\.dev$/;

export const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin) || subdomainPattern.test(origin)) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
};

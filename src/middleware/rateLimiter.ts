import rateLimit from 'express-rate-limit';
import {RedisStore} from 'rate-limit-redis';
import {getRedisClient} from '@/config/redis';
import {formatResponse} from '@/utils/response';

function makeStore(prefix: string) {
    const client = getRedisClient();
    if (!client) return undefined;
    return new RedisStore({
        prefix: `rl:${prefix}:`,
        sendCommand: (...args: string[]) => {
            const [command, ...rest] = args;
            return client.call(command, ...rest) as any;
        }
    });
}

const errorHandler = (message: string) => (_req: any, res: any) => {
    res.status(429).json(
        formatResponse({
            success: false,
            error: { message, code: 429 },
        })
    );
};

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore('api'),
    handler: errorHandler('Too many requests, please try again later'),
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore('auth'),
    handler: errorHandler('Too many login attempts, please try again later'),
});

export const authCheckLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore('authcheck'),
    handler: errorHandler('Too many requests, please slow down'),
});

export const linkCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore('linkcreate'),
    keyGenerator: (req) => req.userId || req.ip || 'anonymous',
    handler: errorHandler('Link creation limit reached, please try again later'),
});

export const viewLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: false,
    legacyHeaders: false,
    store: makeStore('view'),
});

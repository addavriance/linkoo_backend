import rateLimit from 'express-rate-limit';
import {formatResponse} from '@/utils/response';

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json(
            formatResponse({
                success: false,
                error: {
                    message: 'Too many requests, please try again later',
                    code: 429,
                },
            })
        );
    },
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 30, // 30 попыток за 15 минут
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json(
            formatResponse({
                success: false,
                error: {
                    message: 'Too many login attempts, please try again later',
                    code: 429,
                },
            })
        );
    },
});

export const authCheckLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 минута
    max: 30, // 30 запросов в минуту
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json(
            formatResponse({
                success: false,
                error: {
                    message: 'Too many requests, please slow down',
                    code: 429,
                },
            })
        );
    },
});

export const linkCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.userId || req.ip || 'anonymous',
    handler: (_req, res) => {
        res.status(429).json(
            formatResponse({
                success: false,
                error: {
                    message: 'Link creation limit reached, please try again later',
                    code: 429,
                },
            })
        );
    },
});

// Card view tracking (very lenient)
export const viewLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 views per minute per IP
    standardHeaders: false,
    legacyHeaders: false,
});

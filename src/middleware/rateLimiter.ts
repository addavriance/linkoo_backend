import rateLimit from 'express-rate-limit';
import { formatResponse } from '../utils/response';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
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

// Stricter limit for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
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

// Link creation limit
export const linkCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 links per hour
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

import {Request, Response, NextFunction} from 'express';
import {verifyAccessToken, verifyRefreshToken} from '@/services/token.service';
import {AppError} from '@/utils/errors';
import {User, IUser} from '@/models/User';

export const authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No token provided', 401);
        }

        const token = authHeader.substring(7);
        const payload = verifyAccessToken(token);

        await verifyRefreshToken(payload.sessionId, payload.userId);

        req.userId = payload.userId;
        req.accountType = payload.accountType;
        req.role = payload.role ?? 'user';

        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            next(new AppError('Token expired', 401));
        } else if (error.name === 'JsonWebTokenError') {
            next(new AppError('Invalid token', 401));
        } else if (error.message === 'TokenRevokedError') {
            next(new AppError('Session revoked', 401));
        } else {
            next(error);
        }
    }
};

export const optionalAuth = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = verifyAccessToken(token);
            req.userId = payload.userId;
            req.accountType = payload.accountType;
            req.role = payload.role ?? 'user';
        }

        next();
    } catch {
        // Silently continue without auth
        next();
    }
};

// Require full user object
export const requireUser = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    try {
        if (!req.userId) {
            throw new AppError('Authentication required', 401);
        }

        const user = await User.findById(req.userId) as IUser;
        if (!user) {
            throw new AppError('User not found', 404);
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

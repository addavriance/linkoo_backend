import {Request, Response, NextFunction} from 'express';
import {AppError} from '@/utils/errors';

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
    if (req.role !== 'admin') {
        return next(new AppError('Forbidden', 403));
    }
    next();
};

export const requireStaff = (req: Request, _res: Response, next: NextFunction) => {
    if (req.role !== 'admin' && req.role !== 'moderator') {
        return next(new AppError('Forbidden', 403));
    }
    next();
};

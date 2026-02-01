import {Request, Response, NextFunction} from 'express';

/**
 * Wrapper для async route handlers
 * Автоматически ловит ошибки и передает их в error handler middleware
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

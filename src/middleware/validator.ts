import {Request, Response, NextFunction} from 'express';
import {AnyZodObject, ZodError} from 'zod';
import {AppError} from '@/utils/errors';

export const validate = (schema: AnyZodObject) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            if (parsed.body !== undefined) req.body = parsed.body;
            if (parsed.query !== undefined) req.query = parsed.query;
            if (parsed.params !== undefined) req.params = parsed.params;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const messages = error.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                next(new AppError('Validation failed', 400, messages));
            } else {
                next(error);
            }
        }
    };
};

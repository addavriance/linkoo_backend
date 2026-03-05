import {Request, Response, NextFunction} from 'express';
import {AppError} from '@/utils/errors';
import {Card} from '@/models/Card';
import {ServerTOTPValidator} from '@local/linkoo_shared'

const validator = new ServerTOTPValidator({
    codeLength: 10,
});

export const requirePaid = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (req.accountType !== 'paid') {
        throw new AppError('This feature requires a paid account', 403);
    }
    next();
};

export const checkCardLimit = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    try {
        if (req.accountType === 'paid') {
            return next();
        }

        // Free users can only have 1 card
        const cardCount = await Card.countDocuments({
            userId: req.userId,
            isActive: true,
        });

        if (cardCount >= 1) {
            throw new AppError(
                'Free accounts are limited to 1 card. Upgrade to create more.',
                403
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const checkSubdomainAccess = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (req.body.subdomain && req.accountType !== 'paid') {
        throw new AppError('Custom subdomains require a paid account', 403);
    }
    next();
};

export const checkTOTP = (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
        const uid = req.headers['x-user-id']?.toString();
        const code = req.headers['x-totp-code']?.toString();
        const timestamp = parseInt(req.headers['x-timestamp']?.toString()!);

        if (!(uid && code && timestamp)) {
            throw new AppError('Request insecure', 403);
        }

        const validationResult = validator.validateCode({
            uid,
            code,
            timestamp
        })

        if (!validationResult.isValid) {
            throw new AppError('Request insecure', 403);
        }

        next();
    }
}

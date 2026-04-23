import {Request, Response, NextFunction} from 'express';
import {AppError} from '@/utils/errors';
import {Card} from '@/models/Card';
import {User} from '@/models/User';
import {ServerTOTPValidator} from '@addavriance/linkoo_shared'

const validator = new ServerTOTPValidator({
    codeLength: 10,
});

export const requirePaid = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    try {
        if (req.accountType === 'paid') return next();

        const user = await User.findById(req.userId).select('accountType').lean();
        if (user?.accountType === 'paid') {
            req.accountType = 'paid';
            return next();
        }

        throw new AppError('This feature requires a paid account', 403);
    } catch (error) {
        next(error);
    }
};

export const checkCardLimit = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    try {
        if (req.accountType === 'paid') return next();

        const user = await User.findById(req.userId).select('accountType').lean();
        if (user?.accountType === 'paid') {
            req.accountType = 'paid';
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

export const checkSubdomainAccess = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    try {
        if (!req.body.subdomain || req.accountType === 'paid') return next();

        const user = await User.findById(req.userId).select('accountType').lean();
        if (user?.accountType === 'paid') {
            req.accountType = 'paid';
            return next();
        }

        throw new AppError('Custom subdomains require a paid account', 403);
    } catch (error) {
        next(error);
    }
};

export const checkTOTP = (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userId) {
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
    }

    next();
}

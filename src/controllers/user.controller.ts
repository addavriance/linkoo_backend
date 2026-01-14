import {Request, Response, NextFunction} from 'express';
import {IUser, User} from '../models/User';
import {Card} from '../models/Card';
import {ShortenedLink} from '../models/ShortenedLink';
import {RefreshToken} from '../models/RefreshToken';
import {successResponse} from '../utils/response';
import {AppError} from '../utils/errors';
import {UpdateUserInput} from '../validators/auth.validator';

export const getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.userId) {
            throw new AppError('Authentication required', 401);
        }

        const user = await User.findById(req.userId).select('-__v');
        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.json(successResponse(user));
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.userId) {
            throw new AppError('Authentication required', 401);
        }

        const data: UpdateUserInput = req.body;
        const user = await User.findById(req.userId) as IUser;

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Update profile fields
        if (data.profile) {
            if (data.profile.name) {
                user.profile.name = data.profile.name;
            }
            if (data.profile.locale) {
                user.profile.locale = data.profile.locale;
            }
        }

        // Update settings
        if (data.settings) {
            if (typeof data.settings.emailNotifications === 'boolean') {
                user.settings.emailNotifications = data.settings.emailNotifications;
            }
            if (data.settings.language) {
                user.settings.language = data.settings.language;
            }
        }

        await user.save();
        res.json(successResponse(user));
    } catch (error) {
        next(error);
    }
};

export const deleteAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.userId) {
            throw new AppError('Authentication required', 401);
        }

        // Soft delete all user's cards
        await Card.updateMany(
            {userId: req.userId},
            {isActive: false}
        );

        // Soft delete all user's links
        await ShortenedLink.updateMany(
            {userId: req.userId},
            {isActive: false}
        );

        // Revoke all refresh tokens
        await RefreshToken.updateMany(
            {userId: req.userId},
            {isRevoked: true}
        );

        // Delete user
        await User.findByIdAndDelete(req.userId);

        res.json(successResponse({message: 'Account deleted successfully'}));
    } catch (error) {
        next(error);
    }
};

export const getStats = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.userId) {
            throw new AppError('Authentication required', 401);
        }

        const [cardCount, linkCount, totalViews] = await Promise.all([
            Card.countDocuments({userId: req.userId, isActive: true}),
            ShortenedLink.countDocuments({userId: req.userId, isActive: true}),
            Card.aggregate([
                {$match: {userId: req.userId, isActive: true}},
                {$group: {_id: null, totalViews: {$sum: '$viewCount'}}},
            ]),
        ]);

        res.json(
            successResponse({
                cards: cardCount,
                links: linkCount,
                totalViews: totalViews[0]?.totalViews || 0,
            })
        );
    } catch (error) {
        next(error);
    }
};

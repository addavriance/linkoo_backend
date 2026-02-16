import {Request, Response} from 'express';
import path from 'path';
import fs from 'fs';
import {IUser, User} from '@/models/User';
import {Card} from '@/models/Card';
import {ShortenedLink} from '@/models/ShortenedLink';
import {RefreshToken} from '@/models/RefreshToken';
import {successResponse} from '@/utils/response';
import {AppError} from '@/utils/errors';
import {UpdateUserInput} from '@/validators/auth.validator';
import {env} from '@/config/env';
import {asyncHandler} from '@/utils/asyncHandler';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.userId).select('-__v');
    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.json(successResponse(user));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
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
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new AppError('No file uploaded', 400);
    }

    const user = await User.findById(req.userId) as IUser;
    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Удалить старый файл, если он локальный (не OAuth-аватар)
    if (user.profile.avatar && user.profile.avatar.includes('/uploads/avatars/')) {
        const oldFilePath = path.resolve(__dirname, '..', '..', 'uploads', 'avatars', path.basename(user.profile.avatar));
        if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
        }
    }

    const origin = new URL(env.API_URL).origin;
    const avatarUrl = `${origin}/uploads/avatars/${req.file.filename}`;

    user.profile.avatar = avatarUrl;
    await user.save();

    res.json(successResponse({avatar: avatarUrl}));
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
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
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
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
});

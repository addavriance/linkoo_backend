import {Request, Response} from 'express';
import {IUser, User} from '../models/User';
import {
    generateTokenPair,
    refreshAccessToken,
    revokeRefreshToken,
    revokeAllUserTokens,
} from '../services/token.service';
import * as oauthService from '../services/oauth.service';
import {successResponse} from '../utils/response';
import {AppError} from '../utils/errors';
import {env} from '../config/env';
import {OAuthProvider, OAuthUserData} from '../types';
import {asyncHandler} from '../utils/asyncHandler';
import { maxAuthSessions } from '../websocket/maxAuth.handler';

// Helper to handle OAuth callback
const handleOAuthCallback = async (
    provider: OAuthProvider,
    userData: OAuthUserData,
    req: Request,
    res: Response
) => {
    // Find or create user
    let user = await User.findOne({
        provider,
        providerId: userData.providerId,
    }) as IUser;

    if (user) {
        // Update existing user
        if (userData.email)
            user.email = userData.email;

        if (userData.phone)
            user.phone = userData.phone;

        user.profile.name = userData.name;

        if (userData.avatar) {
            user.profile.avatar = userData.avatar;
        }
        user.lastLoginAt = new Date();
        await user.save();
    } else {
        // Create new user
        const email = userData.email;
        const phone = userData.phone;

        user = await User.create({
            email,
            phone,
            provider,
            providerId: userData.providerId,
            profile: {
                name: userData.name,
                avatar: userData.avatar,
            },
        });
    }

    // Generate tokens
    const deviceInfo = req.headers['user-agent'];
    const ipAddress = req.ip;
    const tokens = await generateTokenPair(user, deviceInfo, ipAddress);

    // Redirect to frontend with tokens
    const redirectUrl = new URL('/auth/callback', env.FRONTEND_URL);
    redirectUrl.searchParams.set('accessToken', tokens.accessToken);
    redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);
    redirectUrl.searchParams.set('expiresIn', tokens.expiresIn.toString());

    res.redirect(redirectUrl.toString());
};

// Google OAuth
export const googleAuth = (_req: Request, res: Response) => {
    const authUrl = oauthService.getGoogleAuthUrl();
    res.redirect(authUrl);
};

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
    const {code} = req.query;
    if (!code || typeof code !== 'string') {
        throw new AppError('Authorization code not provided', 400);
    }

    const userData = await oauthService.getGoogleUserData(code);
    await handleOAuthCallback('google', userData, req, res);
});

// VK OAuth
export const vkAuth = asyncHandler(async (_req: Request, res: Response) => {
    const authUrl = await oauthService.getVkAuthUrl();
    res.redirect(authUrl);
});

export const vkCallback = asyncHandler(async (req: Request, res: Response) => {
    const {code, state, device_id} = req.query;

    if (!code || typeof code !== 'string') {
        throw new AppError('Authorization code not provided', 400);
    }

    if (!state || typeof state !== 'string') {
        throw new AppError('State parameter not provided', 400);
    }

    const deviceId = typeof device_id === 'string' ? device_id : undefined;
    const userData = await oauthService.getVkUserData(code, state, deviceId);
    await handleOAuthCallback('vk', userData, req, res);
});

// Discord OAuth
export const discordAuth = (_req: Request, res: Response) => {
    const authUrl = oauthService.getDiscordAuthUrl();
    res.redirect(authUrl);
};

export const discordCallback = asyncHandler(async (req: Request, res: Response) => {
    const {code} = req.query;
    if (!code || typeof code !== 'string') {
        throw new AppError('Authorization code not provided', 400);
    }

    const userData = await oauthService.getDiscordUserData(code);
    await handleOAuthCallback('discord', userData, req, res);
});

// GitHub OAuth
export const githubAuth = (_req: Request, res: Response) => {
    const authUrl = oauthService.getGithubAuthUrl();
    res.redirect(authUrl);
};

export const githubCallback = asyncHandler(async (req: Request, res: Response) => {
    const {code} = req.query;
    if (!code || typeof code !== 'string') {
        throw new AppError('Authorization code not provided', 400);
    }

    const userData = await oauthService.getGithubUserData(code);
    await handleOAuthCallback('github', userData, req, res);
});

// MAX QRCode auth callback
export const maxCallback = asyncHandler(async (req: Request, res: Response) => {
    const sessionId =
        typeof req.query.sessionId === 'string'
            ? req.query.sessionId
            : null;

    if (!sessionId) {
        throw new AppError('Session id not provided', 400);
    }

    const session = maxAuthSessions.get(sessionId);

    if (!session) {
        throw new AppError('Session not found or expired', 404);
    }

    if (!session.userData) {
        throw new AppError('Session not authorized yet', 400);
    }

    const userData = session.userData;

    await handleOAuthCallback('max', userData, req, res);
});

// Refresh token
export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const {refreshToken} = req.body;
    if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
    }

    const deviceInfo = req.headers['user-agent'];
    const ipAddress = req.ip;
    const tokens = await refreshAccessToken(refreshToken, deviceInfo, ipAddress);

    if (!tokens) {
        throw new AppError('Invalid or expired refresh token', 401);
    }

    res.json(successResponse(tokens));
});

// Logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
    const {refreshToken} = req.body;

    if (refreshToken) {
        await revokeRefreshToken(refreshToken);
    }

    res.json(successResponse({message: 'Logged out successfully'}));
});

// Logout from all devices
export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
    if (!req.userId) {
        throw new AppError('Authentication required', 401);
    }

    await revokeAllUserTokens(req.userId);

    res.json(successResponse({message: 'Logged out from all devices'}));
});

// Get current user
export const me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.userId) {
        throw new AppError('Authentication required', 401);
    }

    const user = await User.findById(req.userId).select('-__v');
    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.json(successResponse(user));
});

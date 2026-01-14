import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import {
  generateTokenPair,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from '../services/token.service';
import * as oauthService from '../services/oauth.service';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import { env } from '../config/env';
import { OAuthProvider, OAuthUserData } from '../types';

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
  });

  if (user) {
    // Update existing user
    user.email = userData.email;
    user.profile.name = userData.name;
    if (userData.avatar) {
      user.profile.avatar = userData.avatar;
    }
    user.lastLoginAt = new Date();
    await user.save();
  } else {
    // Create new user
    user = await User.create({
      email: userData.email,
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

export const googleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      throw new AppError('Authorization code not provided', 400);
    }

    const userData = await oauthService.getGoogleUserData(code);
    await handleOAuthCallback('google', userData, req, res);
  } catch (error) {
    next(error);
  }
};

// VK OAuth
export const vkAuth = (_req: Request, res: Response) => {
  const authUrl = oauthService.getVkAuthUrl();
  res.redirect(authUrl);
};

export const vkCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      throw new AppError('Authorization code not provided', 400);
    }

    const userData = await oauthService.getVkUserData(code);
    await handleOAuthCallback('vk', userData, req, res);
  } catch (error) {
    next(error);
  }
};

// Discord OAuth
export const discordAuth = (_req: Request, res: Response) => {
  const authUrl = oauthService.getDiscordAuthUrl();
  res.redirect(authUrl);
};

export const discordCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      throw new AppError('Authorization code not provided', 400);
    }

    const userData = await oauthService.getDiscordUserData(code);
    await handleOAuthCallback('discord', userData, req, res);
  } catch (error) {
    next(error);
  }
};

// GitHub OAuth
export const githubAuth = (_req: Request, res: Response) => {
  const authUrl = oauthService.getGithubAuthUrl();
  res.redirect(authUrl);
};

export const githubCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      throw new AppError('Authorization code not provided', 400);
    }

    const userData = await oauthService.getGithubUserData(code);
    await handleOAuthCallback('github', userData, req, res);
  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;
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
  } catch (error) {
    next(error);
  }
};

// Logout
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.json(successResponse({ message: 'Logged out successfully' }));
  } catch (error) {
    next(error);
  }
};

// Logout from all devices
export const logoutAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new AppError('Authentication required', 401);
    }

    await revokeAllUserTokens(req.userId);

    res.json(successResponse({ message: 'Logged out from all devices' }));
  } catch (error) {
    next(error);
  }
};

// Get current user
export const me = async (req: Request, res: Response, next: NextFunction) => {
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

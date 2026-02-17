import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {RefreshToken} from '@/models/RefreshToken';
import {IUser} from '@/models/User';
import {env} from '@/config/env';
import {TokenPayload, TokenPair} from '@/types';
import {DAY, HOUR} from "@/constants";
import {pollImmediate} from "@/utils/polling";

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export const generateTokenPair = async (
    user: IUser,
    deviceInfo?: string,
    ipAddress?: string
): Promise<TokenPair> => {
    const sessionId = crypto.randomBytes(16).toString('hex');

    const payload: TokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        accountType: user.accountType,
        sessionId,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
        issuer: 'linkoo.dev',
    });

    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await RefreshToken.create({
        userId: user._id,
        token: refreshTokenValue,
        sessionId,
        deviceInfo,
        ipAddress,
        expiresAt,
    });

    return {
        accessToken,
        refreshToken: refreshTokenValue,
        expiresIn: 15 * 60, // 15 минут
    };
};

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_SECRET, {
        issuer: 'linkoo.dev',
    }) as TokenPayload;
};

export const verifyRefreshToken = async (sessionId: string, userId: string): Promise<void> => {
    const refreshToken = await RefreshToken.findOne({
        userId,
        sessionId,
        expiresAt: { $gt: new Date() }
    });

    if (!refreshToken) {
        throw new Error('TokenRevokedError');
    }

    if (refreshToken.isRevoked) {
        throw new Error('TokenRevokedError');
    }
}

export const refreshAccessToken = async (
    refreshToken: string,
    deviceInfo?: string,
    ipAddress?: string
): Promise<TokenPair | null> => {
    const storedToken = await RefreshToken.findOne({
        token: refreshToken,
        isRevoked: false,
        expiresAt: {$gt: new Date()},
    }).populate<{ userId: IUser }>('userId');

    if (!storedToken || !storedToken.userId) {
        return null;
    }

    storedToken.isRevoked = true;
    await storedToken.save();

    const user = storedToken.userId as IUser;
    return generateTokenPair(user, deviceInfo, ipAddress);
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
    await RefreshToken.updateOne({token}, {isRevoked: true});
};

export const revokeAllUserTokens = async (userId: string): Promise<void> => {
    await RefreshToken.updateMany({userId, isRevoked: false}, {isRevoked: true});
};


export const cleanupExpiredTokens = async (): Promise<void> => {
    try {
        const now = new Date();

        const sevenDaysAgo = new Date(now.getTime() - 7 * DAY);

        const result = await RefreshToken.deleteMany({
            $or: [
                {expiresAt: {$lt: sevenDaysAgo}},
                {
                    isRevoked: true,
                    createdAt: {$lt: sevenDaysAgo}
                }
            ]
        });

        if (result.deletedCount > 0) {
            console.log(`[Cleanup] Removed ${result.deletedCount} expired/revoked tokens`);
        }
    } catch (error) {
        console.error('[Cleanup] Failed to cleanup expired tokens:', error);
    }
};

export const startTokenCleanup = (intervalMs: number = 24 * HOUR): void => {
    pollImmediate(cleanupExpiredTokens, intervalMs);
};

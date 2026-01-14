import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {IRefreshToken, RefreshToken} from '../models/RefreshToken';
import {IUser} from '../models/User';
import {env} from '../config/env';
import {TokenPayload, TokenPair} from '../types';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export const generateTokenPair = async (
    user: IUser,
    deviceInfo?: string,
    ipAddress?: string
): Promise<TokenPair> => {
    const payload: TokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        accountType: user.accountType,
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
        deviceInfo,
        ipAddress,
        expiresAt,
    });

    return {
        accessToken,
        refreshToken: refreshTokenValue,
        expiresIn: 15 * 60,
    };
};

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_SECRET, {
        issuer: 'linkoo.dev',
    }) as TokenPayload;
};

export const refreshAccessToken = async (
    refreshToken: string,
    deviceInfo?: string,
    ipAddress?: string
): Promise<TokenPair | null> => {
    const storedToken = await RefreshToken.findOne({
        token: refreshToken,
        isRevoked: false,
        expiresAt: {$gt: new Date()},
    }).populate<{ userId: IUser }>('userId') as IRefreshToken;

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

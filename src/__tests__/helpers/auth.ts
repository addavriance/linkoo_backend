import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser } from '@/models/User';
import { RefreshToken } from '@/models/RefreshToken';
import { AccountType } from '@/types';

const TEST_JWT_SECRET = process.env.JWT_SECRET!;

interface TestUser {
    user: IUser;
    accessToken: string;
    refreshToken: string;
}

interface CreateTestUserOptions {
    email?: string;
    accountType?: AccountType;
    providerId?: string;
}

export const createTestUser = async (options: CreateTestUserOptions = {}): Promise<TestUser> => {
    const {
        email = `test-${crypto.randomBytes(4).toString('hex')}@example.com`,
        accountType = 'free',
        providerId = crypto.randomBytes(8).toString('hex'),
    } = options;

    const user = await User.create({
        email,
        provider: 'google',
        providerId,
        accountType,
        profile: {
            name: 'Test User',
            avatar: undefined,
        },
    }) as IUser;

    const sessionId = crypto.randomBytes(16).toString('hex');
    const userId = (user._id as mongoose.Types.ObjectId).toString();

    const accessToken = jwt.sign(
        {
            userId,
            email: user.email,
            accountType: user.accountType,
            sessionId,
        },
        TEST_JWT_SECRET,
        {
            expiresIn: '15m',
            issuer: 'linkoo.dev',
        }
    );

    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await RefreshToken.create({
        userId: user._id,
        token: refreshTokenValue,
        sessionId,
        expiresAt,
    });

    return {
        user,
        accessToken,
        refreshToken: refreshTokenValue,
    };
};

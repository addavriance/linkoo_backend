import {IUser} from '@/models/User';

export type OAuthProvider = 'google' | 'vk' | 'discord' | 'github' | 'max';

export type AccountType = 'free' | 'paid';

export type SocialPlatform =
    | 'telegram'
    | 'whatsapp'
    | 'instagram'
    | 'youtube'
    | 'linkedin'
    | 'twitter'
    | 'facebook'
    | 'github'
    | 'tiktok'
    | 'discord'
    | 'vk'
    | 'custom';

export type LinkTargetType = 'url' | 'card';

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
            userId?: string;
            accountType?: AccountType;
        }
    }
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: number;
        details?: unknown;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

export interface TokenPayload {
    userId: string;
    email: string;
    accountType: AccountType;
    sessionId: string;
}

export interface OAuthUserData {
    email?: string;
    phone?: string;
    name: string;
    avatar?: string;
    providerId: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

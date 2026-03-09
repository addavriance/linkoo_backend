import {IUser} from '@/models/User';

import type { OAuthProvider, AccountType, UserRole, SocialPlatform, LinkTargetType, ApiResponse } from '@addavriance/linkoo_shared';
export type { OAuthProvider, AccountType, UserRole, SocialPlatform, LinkTargetType, ApiResponse };

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
            userId?: string;
            accountType?: AccountType;
            role?: UserRole;
        }
    }
}

export interface TokenPayload {
    userId: string;
    email: string;
    accountType: AccountType;
    role: UserRole;
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

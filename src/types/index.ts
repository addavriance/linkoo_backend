import { Request } from 'express';
import { IUser } from '../models/User';

// OAuth provider types
export type OAuthProvider = 'google' | 'vk' | 'discord' | 'github';

// Account type
export type AccountType = 'free' | 'paid';

// Social platform types (matching frontend)
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

// Link target types
export type LinkTargetType = 'url' | 'card';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
      accountType?: AccountType;
    }
  }
}

// API Response types
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

// JWT Token payload
export interface TokenPayload {
  userId: string;
  email: string;
  accountType: AccountType;
}

// OAuth user data from providers
export interface OAuthUserData {
  email: string;
  name: string;
  avatar?: string;
  providerId: string;
}

// Token pair returned after authentication
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

import { z } from 'zod';
import { registry } from './openapi.registry';

// ─── Error schemas ────────────────────────────────────────────────────────────

export const ErrorResponseSchema = registry.register(
    'ErrorResponse',
    z.object({
        success: z.boolean().openapi({ example: false }),
        error: z.object({
            message: z.string(),
            code: z.number().int(),
            details: z.any().optional(),
        }),
    })
);

export const Error400Schema = registry.register(
    'Error400',
    z
        .object({
            success: z.literal(false),
            error: z.object({ message: z.string(), code: z.literal(400), details: z.string().optional() }),
        })
        .openapi({ example: { success: false, error: { message: 'Validation failed', code: 400, details: 'name: Required' } } })
);

export const Error401Schema = registry.register(
    'Error401',
    z
        .object({
            success: z.literal(false),
            error: z.object({ message: z.string(), code: z.literal(401) }),
        })
        .openapi({ example: { success: false, error: { message: 'Authentication required', code: 401 } } })
);

export const Error403Schema = registry.register(
    'Error403',
    z
        .object({
            success: z.literal(false),
            error: z.object({ message: z.string(), code: z.literal(403) }),
        })
        .openapi({ example: { success: false, error: { message: 'Forbidden', code: 403 } } })
);

export const Error404Schema = registry.register(
    'Error404',
    z
        .object({
            success: z.literal(false),
            error: z.object({ message: z.string(), code: z.literal(404) }),
        })
        .openapi({ example: { success: false, error: { message: 'Not found', code: 404 } } })
);

export const Error409Schema = registry.register(
    'Error409',
    z
        .object({
            success: z.literal(false),
            error: z.object({ message: z.string(), code: z.literal(409) }),
        })
        .openapi({ example: { success: false, error: { message: 'Conflict: resource already exists', code: 409 } } })
);

export const Error429Schema = registry.register(
    'Error429',
    z
        .object({
            success: z.literal(false),
            error: z.object({ message: z.string(), code: z.literal(429) }),
        })
        .openapi({ example: { success: false, error: { message: 'Too many requests, please try again later', code: 429 } } })
);

export const MessageResponseSchema = registry.register(
    'MessageResponse',
    z.object({
        success: z.boolean().openapi({ example: true }),
        message: z.string().openapi({ example: 'Операция выполнена успешно' }),
    })
);

// ─── Auth schemas ─────────────────────────────────────────────────────────────

export const UserProfileSchema = registry.register(
    'UserProfile',
    z.object({
        name: z.string().optional(),
        avatar: z.string().optional(),
        locale: z.string().openapi({ example: 'ru' }).optional(),
    })
);

export const UserSchema = registry.register(
    'User',
    z.object({
        _id: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        provider: z.enum(['google', 'vk', 'discord', 'github', 'max']),
        accountType: z.enum(['free', 'paid']),
        role: z.enum(['user', 'moderator', 'admin']),
        profile: UserProfileSchema,
        settings: z
            .object({
                emailNotifications: z.boolean(),
                language: z.string(),
            })
            .optional(),
        subscription: z
            .object({
                plan: z.string().optional(),
                expiresAt: z.string().datetime().optional(),
                autoRenew: z.boolean().optional(),
            })
            .optional(),
        lastLoginAt: z.string().datetime().optional(),
        createdAt: z.string().datetime(),
    })
);

export const AuthTokensSchema = registry.register(
    'AuthTokens',
    z.object({
        accessToken: z.string().openapi({ description: 'JWT access token (15 мин)' }),
        refreshToken: z.string().openapi({ description: 'Refresh token (30 дней)' }),
        user: UserSchema,
    })
);

export const SessionSchema = registry.register(
    'Session',
    z.object({
        id: z.string(),
        userAgent: z.string().optional(),
        ip: z.string().optional(),
        createdAt: z.string().datetime(),
        lastUsedAt: z.string().datetime().optional(),
    })
);

// ─── Card schemas ─────────────────────────────────────────────────────────────

export const SocialSchema = registry.register(
    'Social',
    z.object({
        platform: z.enum([
            'telegram', 'whatsapp', 'instagram', 'youtube',
            'linkedin', 'twitter', 'facebook', 'github',
            'tiktok', 'discord', 'vk', 'custom',
        ]),
        link: z.string().openapi({ example: 'https://t.me/username' }),
    })
);

export const CustomThemeSchema = registry.register(
    'CustomTheme',
    z.object({
        background: z.string().openapi({ example: '#ffffff' }),
        textColor: z.string().openapi({ example: '#000000' }),
        accentColor: z.string().openapi({ example: '#6366f1' }),
        backdrop: z.string().optional(),
        border: z.string().optional(),
    })
);

export const CardVisibilitySchema = registry.register(
    'CardVisibility',
    z.object({
        showEmail: z.boolean().default(true),
        showPhone: z.boolean().default(true),
        showLocation: z.boolean().default(true),
    })
);

export const CardSchema = registry.register(
    'Card',
    z.object({
        _id: z.string().openapi({ example: '507f1f77bcf86cd799439011' }),
        userId: z.string(),
        name: z.string().max(100).openapi({ example: 'Иван Иванов' }),
        title: z.string().max(100).openapi({ example: 'Frontend Developer' }).optional(),
        description: z.string().max(500).optional(),
        email: z.string().email().optional(),
        phone: z.string().max(20).openapi({ example: '+7 999 123 45 67' }).optional(),
        website: z.string().url().optional(),
        company: z.string().max(100).optional(),
        location: z.string().max(100).optional(),
        avatar: z.string().url().optional(),
        socials: z.array(SocialSchema).max(12),
        theme: z.string().openapi({ example: 'light_minimal' }),
        customTheme: CustomThemeSchema.optional(),
        visibility: CardVisibilitySchema.optional(),
        subdomain: z.string().openapi({ example: 'ivan' }).optional(),
        slug: z.string().openapi({ example: 'abc123' }),
        isActive: z.boolean(),
        isPublic: z.boolean(),
        viewCount: z.number().int(),
        lastViewedAt: z.string().datetime().optional(),
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime(),
    })
);

export const CardInputSchema = registry.register(
    'CardInput',
    z.object({
        name: z.string().max(100).openapi({ example: 'Иван Иванов' }),
        title: z.string().max(100).openapi({ example: 'Frontend Developer' }).optional(),
        description: z.string().max(500).optional(),
        email: z.string().email().optional(),
        phone: z.string().max(20).optional(),
        website: z.string().url().optional(),
        company: z.string().max(100).optional(),
        location: z.string().max(100).optional(),
        avatar: z.string().url().optional(),
        socials: z.array(SocialSchema).max(12).optional(),
        theme: z.string().optional(),
        customTheme: CustomThemeSchema.optional(),
        visibility: CardVisibilitySchema.optional(),
        isPublic: z.boolean().optional(),
    })
);

// ─── Link schemas ─────────────────────────────────────────────────────────────

export const ShortenedLinkSchema = registry.register(
    'ShortenedLink',
    z.object({
        _id: z.string(),
        userId: z.string().optional(),
        targetType: z.enum(['url', 'card']),
        rawData: z.string().openapi({ description: 'URL назначения (для targetType=url)' }).optional(),
        cardId: z.string().openapi({ description: 'ID карточки (для targetType=card)' }).optional(),
        slug: z.string().openapi({ example: 'abc123' }),
        subdomain: z.string().optional(),
        isActive: z.boolean(),
        expiresAt: z.string().datetime().optional(),
        createdAt: z.string().datetime(),
    })
);

export const LinkStatsSchema = registry.register(
    'LinkStats',
    z.object({
        slug: z.string(),
        totalClicks: z.number().int(),
        uniqueClicks: z.number().int(),
        clicksChart: z.array(
            z.object({
                date: z.string(),
                clicks: z.number().int(),
            })
        ),
    })
);

// ─── Analytics schemas ────────────────────────────────────────────────────────

export const AnalyticsEventSchema = registry.register(
    'AnalyticsEvent',
    z.object({
        type: z.enum([
            'social_click', 'contact_save',
            'share', 'website_click',
            'email_click', 'phone_click',
        ]),
        platform: z.string().openapi({ description: 'Платформа (для social_click)', example: 'telegram' }).optional(),
    })
);

export const AnalyticsDataSchema = registry.register(
    'AnalyticsData',
    z.object({
        cardId: z.string(),
        period: z.enum(['7d', '30d']),
        totalViews: z.number().int(),
        uniqueViews: z.number().int(),
        viewsChart: z.array(
            z.object({
                date: z.string().openapi({ example: '2025-01-15' }),
                views: z.number().int(),
                unique: z.number().int(),
            })
        ),
        devices: z.array(
            z.object({
                type: z.enum(['mobile', 'tablet', 'desktop']),
                count: z.number().int(),
            })
        ),
        countries: z.array(
            z.object({
                code: z.string().openapi({ example: 'RU' }),
                count: z.number().int(),
            })
        ),
        interactionSummary: z
            .object({
                contactSaves: z.number().int(),
                shares: z.number().int(),
                websiteClicks: z.number().int(),
                emailClicks: z.number().int(),
                phoneClicks: z.number().int(),
                socialClicks: z.record(z.number().int()),
            })
            .optional(),
        recentActivity: z.array(
            z.object({
                type: z.string(),
                platform: z.string().optional(),
                timestamp: z.string().datetime(),
            })
        ),
    })
);

export const UserStatsSchema = registry.register(
    'UserStats',
    z.object({
        totalCards: z.number().int(),
        totalLinks: z.number().int(),
        totalViews: z.number().int(),
        totalClicks: z.number().int(),
    })
);

// ─── Payment schemas ──────────────────────────────────────────────────────────

export const PaymentCreateSchema = registry.register(
    'PaymentCreate',
    z.object({
        paymentUrl: z.string().url(),
        paymentKey: z.string(),
    })
);

export const PaymentStatusSchema = registry.register(
    'PaymentStatus',
    z.object({
        status: z.enum(['pending', 'paid', 'failed', 'cancelled']),
        paymentKey: z.string(),
        amount: z.number(),
        createdAt: z.string().datetime(),
    })
);

export const PaymentMethodSchema = registry.register(
    'PaymentMethod',
    z.object({
        paymentMethodId: z.string(),
        type: z.string().openapi({ example: 'card' }),
        last4: z.string().openapi({ example: '4242' }),
        brand: z.string().openapi({ example: 'Visa' }),
    })
);

import {z} from 'zod';

export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
});

export const updateUserSchema = z.object({
    body: z.object({
        profile: z
            .object({
                name: z.string().trim().min(1).max(100).optional(),
                locale: z.string().max(10).optional(),
            })
            .optional(),
        settings: z
            .object({
                emailNotifications: z.boolean().optional(),
                language: z.string().max(10).optional(),
            })
            .optional(),
    }),
});

export const revokeSessionSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID'),
    }),
})

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];

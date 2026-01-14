import { z } from 'zod';

export const createLinkSchema = z.object({
  body: z
    .object({
      targetType: z.enum(['url', 'card']),
      originalUrl: z.string().url('Invalid URL format').optional(),
      cardId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid card ID')
        .optional(),
      customSlug: z
        .string()
        .regex(
          /^[a-z0-9-]+$/,
          'Slug can only contain lowercase letters, numbers, and hyphens'
        )
        .min(3, 'Slug must be at least 3 characters')
        .max(50, 'Slug must be at most 50 characters')
        .optional(),
      subdomain: z
        .string()
        .regex(
          /^[a-z0-9-]+$/,
          'Subdomain can only contain lowercase letters, numbers, and hyphens'
        )
        .min(3)
        .max(30)
        .optional(),
    })
    .refine(
      (data) => {
        if (data.targetType === 'url') return !!data.originalUrl;
        if (data.targetType === 'card') return !!data.cardId;
        return false;
      },
      {
        message: 'Either originalUrl or cardId is required based on targetType',
      }
    ),
});

export const updateLinkSchema = z.object({
  params: z.object({
    slug: z.string().min(3).max(50),
  }),
  body: z.object({
    customSlug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .min(3)
      .max(50)
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getLinkSchema = z.object({
  params: z.object({
    slug: z.string().min(1).max(50),
  }),
});

export const deleteLinkSchema = z.object({
  params: z.object({
    slug: z.string().min(1).max(50),
  }),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>['body'];
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>['body'];

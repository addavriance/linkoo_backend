import { z } from 'zod';

const socialPlatformEnum = z.enum([
  'telegram',
  'whatsapp',
  'instagram',
  'youtube',
  'linkedin',
  'twitter',
  'facebook',
  'github',
  'tiktok',
  'discord',
  'vk',
  'custom',
]);

const socialSchema = z.object({
  platform: socialPlatformEnum,
  link: z.string().trim().min(1).max(500),
});

const customThemeSchema = z.object({
  background: z.string().min(1).max(500),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  backdrop: z.string().max(200).optional(),
  border: z.string().max(200).optional(),
});

const visibilitySchema = z.object({
  showEmail: z.boolean().default(true),
  showPhone: z.boolean().default(true),
  showLocation: z.boolean().default(true),
});

export const createCardSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    title: z.string().trim().max(100).optional(),
    description: z.string().trim().max(500).optional(),
    email: z
      .string()
      .email('Invalid email format')
      .optional()
      .or(z.literal('')),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone format')
      .max(20)
      .optional()
      .or(z.literal('')),
    website: z.string().url('Invalid URL format').optional().or(z.literal('')),
    company: z.string().trim().max(100).optional(),
    location: z.string().trim().max(100).optional(),
    avatar: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
    socials: z.array(socialSchema).max(12).default([]),
    theme: z.string().default('light_minimal'),
    customTheme: customThemeSchema.optional(),
    visibility: visibilitySchema.optional(),
    isPublic: z.boolean().default(true),
  }),
});

export const updateCardSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid card ID'),
  }),
  body: createCardSchema.shape.body.partial(),
});

export const getCardSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid card ID'),
  }),
});

export const deleteCardSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid card ID'),
  }),
});

export type CreateCardInput = z.infer<typeof createCardSchema>['body'];
export type UpdateCardInput = z.infer<typeof updateCardSchema>['body'];

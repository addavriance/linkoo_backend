import { z } from 'zod';
import { registry } from './openapi.registry';
import { CardSchema, UserSchema, ShortenedLinkSchema, MessageResponseSchema, Error401Schema, Error403Schema } from './openapi.schemas';

const bearerAuth = [{ bearerAuth: [] }];

const AdminStatsSchema = z.object({
    totalUsers: z.number().int(),
    totalCards: z.number().int(),
    totalLinks: z.number().int(),
    activeUsers: z.number().int(),
    paidUsers: z.number().int(),
});

registry.registerPath({
    method: 'get',
    path: '/admin/stats',
    tags: ['Admin'],
    summary: 'Общая статистика платформы',
    description: 'Доступно для staff и admin.',
    security: bearerAuth,
    responses: {
        200: { description: 'Статистика платформы', content: { 'application/json': { schema: AdminStatsSchema } } },
        401: { description: 'Требуется авторизация', content: { 'application/json': { schema: Error401Schema } } },
        403: { description: 'Нет прав доступа', content: { 'application/json': { schema: Error403Schema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/admin/users',
    tags: ['Admin'],
    summary: 'Список всех пользователей',
    description: 'Доступно только для admin.',
    security: bearerAuth,
    responses: {
        200: { description: 'Список пользователей', content: { 'application/json': { schema: z.array(UserSchema) } } },
        401: { description: 'Требуется авторизация', content: { 'application/json': { schema: Error401Schema } } },
        403: { description: 'Нет прав доступа', content: { 'application/json': { schema: Error403Schema } } },
    },
});

registry.registerPath({
    method: 'patch',
    path: '/admin/users/{id}',
    tags: ['Admin'],
    summary: 'Обновить пользователя',
    description: 'Доступно только для admin.',
    security: bearerAuth,
    request: {
        params: z.object({ id: z.string().openapi({ description: 'ID пользователя' }) }),
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: z.object({
                        role: z.enum(['user', 'moderator', 'admin']).optional(),
                        accountType: z.enum(['free', 'paid']).optional(),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Пользователь обновлён', content: { 'application/json': { schema: MessageResponseSchema } } },
        403: { description: 'Нет прав доступа', content: { 'application/json': { schema: Error403Schema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/admin/cards',
    tags: ['Admin'],
    summary: 'Список всех карточек',
    description: 'Доступно для staff и admin.',
    security: bearerAuth,
    responses: {
        200: { description: 'Список карточек', content: { 'application/json': { schema: z.array(CardSchema) } } },
        401: { description: 'Требуется авторизация', content: { 'application/json': { schema: Error401Schema } } },
        403: { description: 'Нет прав доступа', content: { 'application/json': { schema: Error403Schema } } },
    },
});

registry.registerPath({
    method: 'patch',
    path: '/admin/cards/{id}',
    tags: ['Admin'],
    summary: 'Обновить карточку (admin)',
    description: 'Доступно для staff и admin.',
    security: bearerAuth,
    request: {
        params: z.object({ id: z.string().openapi({ description: 'ID карточки' }) }),
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: z.object({
                        isActive: z.boolean().optional(),
                        isPublic: z.boolean().optional(),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Карточка обновлена', content: { 'application/json': { schema: MessageResponseSchema } } },
        403: { description: 'Нет прав доступа', content: { 'application/json': { schema: Error403Schema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/admin/links',
    tags: ['Admin'],
    summary: 'Список всех ссылок',
    description: 'Доступно для staff и admin.',
    security: bearerAuth,
    responses: {
        200: { description: 'Список ссылок', content: { 'application/json': { schema: z.array(ShortenedLinkSchema) } } },
        401: { description: 'Требуется авторизация', content: { 'application/json': { schema: Error401Schema } } },
        403: { description: 'Нет прав доступа', content: { 'application/json': { schema: Error403Schema } } },
    },
});

registry.registerPath({
    method: 'patch',
    path: '/admin/links/{id}',
    tags: ['Admin'],
    summary: 'Обновить ссылку (admin)',
    description: 'Доступно для staff и admin.',
    security: bearerAuth,
    request: {
        params: z.object({ id: z.string().openapi({ description: 'ID ссылки' }) }),
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: z.object({ isActive: z.boolean().optional() }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Ссылка обновлена', content: { 'application/json': { schema: MessageResponseSchema } } },
        403: { description: 'Нет прав доступа', content: { 'application/json': { schema: Error403Schema } } },
    },
});
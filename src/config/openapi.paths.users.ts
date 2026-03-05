import { z } from 'zod';
import { registry } from './openapi.registry';
import {
    UserSchema,
    CardSchema,
    ShortenedLinkSchema,
    UserStatsSchema,
    MessageResponseSchema,
    Error400Schema,
    Error401Schema,
} from './openapi.schemas';

const bearerAuth = [{ bearerAuth: [] }];

registry.registerPath({
    method: 'get',
    path: '/users/me',
    tags: ['Users'],
    summary: 'Получить профиль пользователя',
    security: bearerAuth,
    responses: {
        200: { description: 'Данные профиля', content: { 'application/json': { schema: UserSchema } } },
        401: { description: 'Требуется авторизация', content: { 'application/json': { schema: Error401Schema } } },
    },
});

registry.registerPath({
    method: 'patch',
    path: '/users/me',
    tags: ['Users'],
    summary: 'Обновить профиль пользователя',
    security: bearerAuth,
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: z.object({
                        profile: z
                            .object({
                                name: z.string().max(100).optional(),
                                locale: z.string().openapi({ example: 'ru' }).optional(),
                            })
                            .optional(),
                        settings: z
                            .object({
                                emailNotifications: z.boolean().optional(),
                                language: z.string().optional(),
                            })
                            .optional(),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Профиль обновлён', content: { 'application/json': { schema: UserSchema } } },
        400: { description: 'Ошибка валидации', content: { 'application/json': { schema: Error400Schema } } },
    },
});

registry.registerPath({
    method: 'post',
    path: '/users/me/avatar',
    tags: ['Users'],
    summary: 'Загрузить аватар',
    description: 'Принимает изображение (JPEG, PNG, WebP) до 5 МБ и сохраняет в `/uploads/`.',
    security: bearerAuth,
    request: {
        body: {
            required: true,
            content: {
                'multipart/form-data': {
                    schema: z.object({
                        avatar: z.string().openapi({ format: 'binary', description: 'Файл изображения' }),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Аватар загружен',
            content: {
                'application/json': {
                    schema: z.object({
                        avatar: z.string().url().openapi({ description: 'URL загруженного аватара' }),
                    }),
                },
            },
        },
        400: { description: 'Неверный формат файла', content: { 'application/json': { schema: Error400Schema } } },
    },
});

registry.registerPath({
    method: 'delete',
    path: '/users/me',
    tags: ['Users'],
    summary: 'Удалить аккаунт',
    description: 'Безвозвратно удаляет аккаунт пользователя вместе со всеми карточками и ссылками.',
    security: bearerAuth,
    responses: {
        200: { description: 'Аккаунт удалён', content: { 'application/json': { schema: MessageResponseSchema } } },
        401: { description: 'Требуется авторизация', content: { 'application/json': { schema: Error401Schema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/users/me/cards',
    tags: ['Users'],
    summary: 'Получить карточки пользователя',
    security: bearerAuth,
    responses: {
        200: { description: 'Список карточек', content: { 'application/json': { schema: z.array(CardSchema) } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/users/me/links',
    tags: ['Users'],
    summary: 'Получить ссылки пользователя',
    security: bearerAuth,
    responses: {
        200: {
            description: 'Список сокращённых ссылок',
            content: { 'application/json': { schema: z.array(ShortenedLinkSchema) } },
        },
    },
});

registry.registerPath({
    method: 'get',
    path: '/users/me/stats',
    tags: ['Users'],
    summary: 'Получить статистику пользователя',
    description: 'Общая статистика — количество карточек, ссылок, суммарные просмотры и клики.',
    security: bearerAuth,
    responses: {
        200: { description: 'Статистика пользователя', content: { 'application/json': { schema: UserStatsSchema } } },
    },
});
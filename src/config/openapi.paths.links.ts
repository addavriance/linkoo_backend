import { z } from 'zod';
import { registry } from './openapi.registry';
import {
    ShortenedLinkSchema,
    LinkStatsSchema,
    MessageResponseSchema,
    Error400Schema,
    Error403Schema,
    Error404Schema,
    Error409Schema,
    Error429Schema,
} from './openapi.schemas';

const bearerAuth = [{ bearerAuth: [] }];
const slugParam = z.object({ slug: z.string().openapi({ example: 'abc123' }) });

registry.registerPath({
    method: 'get',
    path: '/links/{slug}',
    tags: ['Links'],
    summary: 'Получить ссылку по slug',
    request: {
        params: slugParam,
    },
    responses: {
        200: { description: 'Данные ссылки', content: { 'application/json': { schema: ShortenedLinkSchema } } },
        404: { description: 'Ссылка не найдена', content: { 'application/json': { schema: Error404Schema } } },
    },
});

registry.registerPath({
    method: 'post',
    path: '/links',
    tags: ['Links'],
    summary: 'Создать сокращённую ссылку',
    description:
        'Создаёт ссылку типа `url` (перенаправление на URL) или `card` (перенаправление на цифровую визитку). ' +
        'Rate limit — 50 ссылок в час. Авторизация необязательна, но рекомендуется.',
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: z.object({
                        targetType: z.enum(['url', 'card']),
                        rawData: z
                            .string()
                            .openapi({ description: 'URL назначения (обязателен для targetType=url)', example: 'https://example.com' })
                            .optional(),
                        cardId: z
                            .string()
                            .openapi({ description: 'ID карточки (обязателен для targetType=card)' })
                            .optional(),
                        slug: z
                            .string()
                            .min(3)
                            .max(50)
                            .openapi({ description: 'Желаемый slug (если не указан — генерируется автоматически)' })
                            .optional(),
                        expiresAt: z.string().datetime().openapi({ description: 'Дата истечения ссылки (опционально)' }).optional(),
                    }),
                },
            },
        },
    },
    responses: {
        201: { description: 'Ссылка создана', content: { 'application/json': { schema: ShortenedLinkSchema } } },
        400: { description: 'Ошибка валидации', content: { 'application/json': { schema: Error400Schema } } },
        409: { description: 'Slug уже занят', content: { 'application/json': { schema: Error409Schema } } },
        429: { description: 'Превышен лимит создания ссылок', content: { 'application/json': { schema: Error429Schema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/links',
    tags: ['Links'],
    summary: 'Получить мои ссылки',
    security: bearerAuth,
    responses: {
        200: { description: 'Список ссылок пользователя', content: { 'application/json': { schema: z.array(ShortenedLinkSchema) } } },
    },
});

registry.registerPath({
    method: 'patch',
    path: '/links/{slug}',
    tags: ['Links'],
    summary: 'Обновить ссылку',
    security: bearerAuth,
    request: {
        params: slugParam,
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: z.object({
                        slug: z.string().min(3).max(50).optional(),
                        isActive: z.boolean().optional(),
                        expiresAt: z.string().datetime().optional(),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Ссылка обновлена', content: { 'application/json': { schema: ShortenedLinkSchema } } },
        403: { description: 'Нет доступа к ссылке', content: { 'application/json': { schema: Error403Schema } } },
        404: { description: 'Ссылка не найдена', content: { 'application/json': { schema: Error404Schema } } },
    },
});

registry.registerPath({
    method: 'delete',
    path: '/links/{slug}',
    tags: ['Links'],
    summary: 'Удалить ссылку',
    security: bearerAuth,
    request: {
        params: slugParam,
    },
    responses: {
        200: { description: 'Ссылка удалена', content: { 'application/json': { schema: MessageResponseSchema } } },
        403: { description: 'Нет доступа к ссылке', content: { 'application/json': { schema: Error403Schema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/links/{slug}/stats',
    tags: ['Links'],
    summary: 'Получить статистику ссылки',
    security: bearerAuth,
    request: {
        params: slugParam,
    },
    responses: {
        200: { description: 'Статистика переходов', content: { 'application/json': { schema: LinkStatsSchema } } },
        403: { description: 'Нет доступа к ссылке', content: { 'application/json': { schema: Error403Schema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/links/card/{cardId}',
    tags: ['Links'],
    summary: 'Получить ссылку карточки',
    description: 'Возвращает сокращённую ссылку, привязанную к конкретной карточке.',
    security: bearerAuth,
    request: {
        params: z.object({ cardId: z.string().openapi({ description: 'ID карточки' }) }),
    },
    responses: {
        200: { description: 'Ссылка карточки', content: { 'application/json': { schema: ShortenedLinkSchema } } },
        404: { description: 'Ссылка не найдена', content: { 'application/json': { schema: Error404Schema } } },
    },
});
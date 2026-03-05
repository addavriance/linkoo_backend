import { z } from 'zod';
import { registry } from './openapi.registry';
import {
    AnalyticsEventSchema,
    AnalyticsDataSchema,
    MessageResponseSchema,
    Error400Schema,
    Error401Schema,
    Error403Schema,
    Error404Schema,
    Error429Schema,
} from './openapi.schemas';

const bearerAuth = [{ bearerAuth: [] }];
const cardIdParam = z.object({ cardId: z.string().openapi({ description: 'ID карточки' }) });

registry.registerPath({
    method: 'post',
    path: '/analytics/{cardId}/event',
    tags: ['Analytics'],
    summary: 'Зафиксировать взаимодействие с карточкой',
    description:
        'Отправляется при взаимодействии посетителя с карточкой (клик по соцсети, сохранение контакта, шер и т.д.). ' +
        'Rate limit — 30 запросов в минуту с одного IP.',
    request: {
        params: cardIdParam,
        body: {
            required: true,
            content: { 'application/json': { schema: AnalyticsEventSchema } },
        },
    },
    responses: {
        200: { description: 'Событие зафиксировано', content: { 'application/json': { schema: MessageResponseSchema } } },
        400: { description: 'Неверный тип события', content: { 'application/json': { schema: Error400Schema } } },
        429: { description: 'Превышен лимит запросов', content: { 'application/json': { schema: Error429Schema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/analytics/{cardId}',
    tags: ['Analytics'],
    summary: 'Получить аналитику карточки',
    description:
        'Возвращает полную аналитику за выбранный период: динамику просмотров, устройства, страны, взаимодействия и последние события. ' +
        'Доступно только владельцу карточки с Premium-аккаунтом.',
    security: bearerAuth,
    request: {
        params: cardIdParam,
        query: z.object({
            period: z.enum(['7d', '30d']).default('7d').openapi({ description: 'Период аналитики' }),
        }),
    },
    responses: {
        200: { description: 'Аналитика карточки', content: { 'application/json': { schema: AnalyticsDataSchema } } },
        401: { description: 'Требуется авторизация', content: { 'application/json': { schema: Error401Schema } } },
        403: { description: 'Нет доступа (не владелец карточки или free-аккаунт)', content: { 'application/json': { schema: Error403Schema } } },
        404: { description: 'Карточка не найдена', content: { 'application/json': { schema: Error404Schema } } },
    },
});
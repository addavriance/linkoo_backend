import { z } from 'zod';
import { registry } from './openapi.registry';
import {
    CardSchema,
    CardInputSchema,
    MessageResponseSchema,
    Error400Schema,
    Error401Schema,
    Error403Schema,
    Error404Schema,
    Error409Schema,
    Error429Schema,
} from './openapi.schemas';

const bearerAuth = [{ bearerAuth: [] }];
const cardIdParam = z.object({ id: z.string().openapi({ description: 'MongoDB ObjectId карточки' }) });

registry.registerPath({
    method: 'get',
    path: '/cards/public',
    tags: ['Cards'],
    summary: 'Получить публичные карточки',
    description: 'Возвращает список публичных активных карточек для витрины.',
    responses: {
        200: { description: 'Список публичных карточек', content: { 'application/json': { schema: z.array(CardSchema) } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/cards/{id}',
    tags: ['Cards'],
    summary: 'Получить карточку по ID или slug',
    description: 'Возвращает данные карточки. Если передан Bearer token, возвращает расширенные данные для владельца.',
    request: {
        params: z.object({ id: z.string().openapi({ description: 'MongoDB ObjectId или slug карточки' }) }),
    },
    responses: {
        200: { description: 'Данные карточки', content: { 'application/json': { schema: CardSchema } } },
        404: { description: 'Карточка не найдена', content: { 'application/json': { schema: Error404Schema } } },
    },
});

registry.registerPath({
    method: 'post',
    path: '/cards/{id}/view',
    tags: ['Cards'],
    summary: 'Зафиксировать просмотр карточки',
    description: 'Увеличивает счётчик просмотров. Rate limit — 30 запросов в минуту с одного IP.',
    request: {
        params: cardIdParam,
    },
    responses: {
        200: { description: 'Просмотр зафиксирован', content: { 'application/json': { schema: MessageResponseSchema } } },
        404: { description: 'Карточка не найдена', content: { 'application/json': { schema: Error404Schema } } },
        429: { description: 'Превышен лимит запросов', content: { 'application/json': { schema: Error429Schema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/cards',
    tags: ['Cards'],
    summary: 'Получить мои карточки',
    security: bearerAuth,
    responses: {
        200: { description: 'Список карточек пользователя', content: { 'application/json': { schema: z.array(CardSchema) } } },
        401: { description: 'Требуется авторизация', content: { 'application/json': { schema: Error401Schema } } },
    },
});

registry.registerPath({
    method: 'post',
    path: '/cards',
    tags: ['Cards'],
    summary: 'Создать карточку',
    description:
        'Создаёт новую цифровую визитку. Free-аккаунт может иметь не более 1 карточки; Premium-аккаунт — неограниченно.',
    security: bearerAuth,
    request: {
        body: {
            required: true,
            content: { 'application/json': { schema: CardInputSchema } },
        },
    },
    responses: {
        201: { description: 'Карточка создана', content: { 'application/json': { schema: CardSchema } } },
        400: { description: 'Ошибка валидации', content: { 'application/json': { schema: Error400Schema } } },
        403: { description: 'Достигнут лимит карточек для free-аккаунта', content: { 'application/json': { schema: Error403Schema } } },
    },
});

registry.registerPath({
    method: 'patch',
    path: '/cards/{id}/subdomain',
    tags: ['Cards'],
    summary: 'Установить поддомен карточки',
    description:
        'Привязывает кастомный поддомен к карточке (например `ivan.linkoo.dev`). Доступно только для Premium-аккаунтов.',
    security: bearerAuth,
    request: {
        params: cardIdParam,
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: z.object({
                        subdomain: z
                            .string()
                            .min(3)
                            .max(32)
                            .openapi({ example: 'ivan', description: 'Только строчные буквы, цифры и дефисы' }),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Поддомен установлен', content: { 'application/json': { schema: CardSchema } } },
        400: { description: 'Невалидный поддомен', content: { 'application/json': { schema: Error400Schema } } },
        403: { description: 'Требуется Premium-аккаунт', content: { 'application/json': { schema: Error403Schema } } },
        409: { description: 'Поддомен уже занят', content: { 'application/json': { schema: Error409Schema } } },
    },
});

registry.registerPath({
    method: 'delete',
    path: '/cards/{id}/subdomain',
    tags: ['Cards'],
    summary: 'Удалить поддомен карточки',
    description: 'Освобождает поддомен, привязанный к карточке. Только для Premium-аккаунтов.',
    security: bearerAuth,
    request: {
        params: cardIdParam,
    },
    responses: {
        200: { description: 'Поддомен удалён', content: { 'application/json': { schema: MessageResponseSchema } } },
        403: { description: 'Требуется Premium-аккаунт', content: { 'application/json': { schema: Error403Schema } } },
    },
});

registry.registerPath({
    method: 'patch',
    path: '/cards/{id}',
    tags: ['Cards'],
    summary: 'Обновить карточку',
    security: bearerAuth,
    request: {
        params: cardIdParam,
        body: {
            required: true,
            content: { 'application/json': { schema: CardInputSchema } },
        },
    },
    responses: {
        200: { description: 'Карточка обновлена', content: { 'application/json': { schema: CardSchema } } },
        400: { description: 'Ошибка валидации', content: { 'application/json': { schema: Error400Schema } } },
        403: { description: 'Нет доступа к карточке', content: { 'application/json': { schema: Error403Schema } } },
        404: { description: 'Карточка не найдена', content: { 'application/json': { schema: Error404Schema } } },
    },
});

registry.registerPath({
    method: 'delete',
    path: '/cards/{id}',
    tags: ['Cards'],
    summary: 'Удалить карточку',
    security: bearerAuth,
    request: {
        params: cardIdParam,
    },
    responses: {
        200: { description: 'Карточка удалена', content: { 'application/json': { schema: MessageResponseSchema } } },
        403: { description: 'Нет доступа к карточке', content: { 'application/json': { schema: Error403Schema } } },
        404: { description: 'Карточка не найдена', content: { 'application/json': { schema: Error404Schema } } },
    },
});

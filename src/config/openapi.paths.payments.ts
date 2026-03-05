import { z } from 'zod';
import { registry } from './openapi.registry';
import {
    PaymentCreateSchema,
    PaymentStatusSchema,
    PaymentMethodSchema,
    MessageResponseSchema,
    Error400Schema,
    Error401Schema,
    Error404Schema,
} from './openapi.schemas';

const bearerAuth = [{ bearerAuth: [] }];

registry.registerPath({
    method: 'post',
    path: '/payments/webhook',
    tags: ['Payments'],
    summary: 'Webhook от платёжной системы',
    description:
        'Принимает уведомления от платёжного провайдера об изменении статуса платежа. ' +
        'Верифицирует подпись и обновляет подписку пользователя.',
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: z.object({}).openapi({ description: 'Payload от платёжного провайдера' }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Webhook обработан', content: { 'application/json': { schema: MessageResponseSchema } } },
        400: { description: 'Невалидная подпись или данные', content: { 'application/json': { schema: Error400Schema } } },
    },
});

registry.registerPath({
    method: 'post',
    path: '/payments/create',
    tags: ['Payments'],
    summary: 'Создать платёж (оформить подписку)',
    description: 'Инициирует платёж для оформления Premium-подписки. Возвращает URL для оплаты.',
    security: bearerAuth,
    responses: {
        200: { description: 'Платёж создан', content: { 'application/json': { schema: PaymentCreateSchema } } },
        401: { description: 'Требуется авторизация', content: { 'application/json': { schema: Error401Schema } } },
    },
});

registry.registerPath({
    method: 'post',
    path: '/payments/link-card',
    tags: ['Payments'],
    summary: 'Привязать платёжную карту',
    description: 'Инициирует привязку карты для автоматических списаний при продлении подписки.',
    security: bearerAuth,
    responses: {
        200: { description: 'Запрос на привязку карты создан', content: { 'application/json': { schema: PaymentCreateSchema } } },
        401: { description: 'Требуется авторизация', content: { 'application/json': { schema: Error401Schema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/payments/history',
    tags: ['Payments'],
    summary: 'История платежей',
    description: 'Возвращает список всех платежей пользователя.',
    security: bearerAuth,
    responses: {
        200: {
            description: 'История платежей',
            content: { 'application/json': { schema: z.array(PaymentStatusSchema) } },
        },
        401: { description: 'Требуется авторизация', content: { 'application/json': { schema: Error401Schema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/payments/methods',
    tags: ['Payments'],
    summary: 'Получить сохранённые платёжные методы',
    security: bearerAuth,
    responses: {
        200: {
            description: 'Список платёжных методов',
            content: { 'application/json': { schema: z.array(PaymentMethodSchema) } },
        },
    },
});

registry.registerPath({
    method: 'delete',
    path: '/payments/methods/{paymentMethodId}',
    tags: ['Payments'],
    summary: 'Удалить платёжный метод',
    security: bearerAuth,
    request: {
        params: z.object({ paymentMethodId: z.string().openapi({ description: 'ID платёжного метода' }) }),
    },
    responses: {
        200: { description: 'Платёжный метод удалён', content: { 'application/json': { schema: MessageResponseSchema } } },
        404: { description: 'Метод не найден', content: { 'application/json': { schema: Error404Schema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/payments/{paymentKey}',
    tags: ['Payments'],
    summary: 'Получить статус платежа',
    description: 'Используется для polling статуса платежа после редиректа со страницы оплаты.',
    security: bearerAuth,
    request: {
        params: z.object({ paymentKey: z.string().openapi({ description: 'Уникальный ключ платежа' }) }),
    },
    responses: {
        200: { description: 'Статус платежа', content: { 'application/json': { schema: PaymentStatusSchema } } },
        404: { description: 'Платёж не найден', content: { 'application/json': { schema: Error404Schema } } },
    },
});
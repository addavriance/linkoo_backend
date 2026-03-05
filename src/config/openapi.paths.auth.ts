import { z } from 'zod';
import { registry } from './openapi.registry';
import {
    AuthTokensSchema,
    UserSchema,
    SessionSchema,
    MessageResponseSchema,
    Error401Schema,
    Error404Schema,
    ErrorResponseSchema,
} from './openapi.schemas';

const bearerAuth = [{ bearerAuth: [] }];

registry.registerPath({
    method: 'get',
    path: '/auth/google',
    tags: ['Auth'],
    summary: 'Войти через Google',
    description: 'Перенаправляет на страницу авторизации Google OAuth2.',
    responses: {
        302: { description: 'Редирект на Google OAuth' },
    },
});

registry.registerPath({
    method: 'get',
    path: '/auth/google/callback',
    tags: ['Auth'],
    summary: 'Callback Google OAuth',
    description: 'Обрабатывает код авторизации от Google и перенаправляет на фронтенд с токенами.',
    request: {
        query: z.object({ code: z.string().optional().openapi({ description: 'Authorization code от Google' }) }),
    },
    responses: {
        302: { description: 'Редирект на фронтенд с токенами' },
        401: { description: 'Ошибка авторизации', content: { 'application/json': { schema: Error401Schema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/auth/vk',
    tags: ['Auth'],
    summary: 'Войти через VK',
    description: 'Перенаправляет на страницу авторизации VK OAuth2.',
    responses: {
        302: { description: 'Редирект на VK OAuth' },
    },
});

registry.registerPath({
    method: 'get',
    path: '/auth/vk/callback',
    tags: ['Auth'],
    summary: 'Callback VK OAuth',
    request: {
        query: z.object({ code: z.string().optional() }),
    },
    responses: {
        302: { description: 'Редирект на фронтенд с токенами' },
    },
});

registry.registerPath({
    method: 'get',
    path: '/auth/github',
    tags: ['Auth'],
    summary: 'Войти через GitHub',
    responses: {
        302: { description: 'Редирект на GitHub OAuth' },
    },
});

registry.registerPath({
    method: 'get',
    path: '/auth/github/callback',
    tags: ['Auth'],
    summary: 'Callback GitHub OAuth',
    request: {
        query: z.object({ code: z.string().optional() }),
    },
    responses: {
        302: { description: 'Редирект на фронтенд с токенами' },
    },
});

registry.registerPath({
    method: 'get',
    path: '/auth/discord',
    tags: ['Auth'],
    summary: 'Войти через Discord',
    responses: {
        302: { description: 'Редирект на Discord OAuth' },
    },
});

registry.registerPath({
    method: 'get',
    path: '/auth/discord/callback',
    tags: ['Auth'],
    summary: 'Callback Discord OAuth',
    request: {
        query: z.object({ code: z.string().optional() }),
    },
    responses: {
        302: { description: 'Редирект на фронтенд с токенами' },
    },
});

registry.registerPath({
    method: 'get',
    path: '/auth/max',
    tags: ['Auth'],
    summary: 'WebSocket — аутентификация через MAX',
    description:
        '**WebSocket endpoint** (`ws://`). Подключение инициирует генерацию QR-кода для входа через мессенджер MAX (МТС). ' +
        'После сканирования QR клиентом сервер отправляет токены через это же соединение.',
    responses: {
        101: { description: 'Соединение переключено на WebSocket' },
        426: { description: 'Требуется Upgrade до WebSocket', content: { 'application/json': { schema: ErrorResponseSchema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/auth/max/callback',
    tags: ['Auth'],
    summary: 'Callback MAX OAuth',
    description: 'Финализирует аутентификацию через сервис MAX (МТС).',
    request: {
        query: z.object({ code: z.string().optional() }),
    },
    responses: {
        302: { description: 'Редирект на фронтенд с токенами' },
    },
});

registry.registerPath({
    method: 'post',
    path: '/auth/refresh',
    tags: ['Auth'],
    summary: 'Обновить access token',
    description: 'Возвращает новую пару токенов по действующему refresh token.',
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: z.object({
                        refreshToken: z.string().openapi({ description: 'Действующий refresh token' }),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Новая пара токенов', content: { 'application/json': { schema: AuthTokensSchema } } },
        401: { description: 'Невалидный или истёкший refresh token', content: { 'application/json': { schema: Error401Schema } } },
    },
});

registry.registerPath({
    method: 'post',
    path: '/auth/logout',
    tags: ['Auth'],
    summary: 'Выйти из текущей сессии',
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: z.object({ refreshToken: z.string() }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Успешный выход', content: { 'application/json': { schema: MessageResponseSchema } } },
    },
});

registry.registerPath({
    method: 'post',
    path: '/auth/logout-all',
    tags: ['Auth'],
    summary: 'Выйти со всех устройств',
    description: 'Инвалидирует все refresh tokens пользователя.',
    security: bearerAuth,
    responses: {
        200: { description: 'Все сессии завершены', content: { 'application/json': { schema: MessageResponseSchema } } },
        401: { description: 'Требуется авторизация', content: { 'application/json': { schema: Error401Schema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/auth/me',
    tags: ['Auth'],
    summary: 'Получить данные текущего пользователя',
    security: bearerAuth,
    responses: {
        200: { description: 'Данные аутентифицированного пользователя', content: { 'application/json': { schema: UserSchema } } },
        401: { description: 'Требуется авторизация', content: { 'application/json': { schema: Error401Schema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/auth/sessions',
    tags: ['Auth'],
    summary: 'Получить активные сессии',
    description: 'Возвращает список всех активных сессий пользователя (устройства, IP, дата).',
    security: bearerAuth,
    responses: {
        200: { description: 'Список сессий', content: { 'application/json': { schema: z.array(SessionSchema) } } },
        401: { description: 'Требуется авторизация', content: { 'application/json': { schema: Error401Schema } } },
    },
});

registry.registerPath({
    method: 'delete',
    path: '/auth/session/{id}',
    tags: ['Auth'],
    summary: 'Завершить конкретную сессию',
    security: bearerAuth,
    request: {
        params: z.object({ id: z.string().openapi({ description: 'ID сессии (refresh token)' }) }),
    },
    responses: {
        200: { description: 'Сессия завершена', content: { 'application/json': { schema: MessageResponseSchema } } },
        401: { description: 'Требуется авторизация', content: { 'application/json': { schema: Error401Schema } } },
        404: { description: 'Сессия не найдена', content: { 'application/json': { schema: Error404Schema } } },
    },
});

import {Router} from 'express';
import * as authController from '../controllers/auth.controller';
import {authenticate} from '@/middleware/auth.middleware';
import {authLimiter, authCheckLimiter} from '@/middleware/rateLimiter';
import {validate} from '@/middleware/validator';
import {refreshTokenSchema, revokeSessionSchema} from '@/validators/auth.validator';
const router = Router();

/**
 * @swagger
 * /auth/google:
 *   get:
 *     tags: [Auth]
 *     summary: Войти через Google
 *     description: Перенаправляет на страницу авторизации Google OAuth2.
 *     responses:
 *       302:
 *         description: Редирект на Google OAuth
 */
router.get('/google', authLimiter, authController.googleAuth);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Callback Google OAuth
 *     description: Обрабатывает код авторизации от Google и перенаправляет на фронтенд с токенами.
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code от Google
 *     responses:
 *       302:
 *         description: Редирект на фронтенд с токенами
 *       401:
 *         description: Ошибка авторизации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/google/callback', authController.googleCallback);

/**
 * @swagger
 * /auth/vk:
 *   get:
 *     tags: [Auth]
 *     summary: Войти через VK
 *     description: Перенаправляет на страницу авторизации VK OAuth2.
 *     responses:
 *       302:
 *         description: Редирект на VK OAuth
 */
router.get('/vk', authLimiter, authController.vkAuth);

/**
 * @swagger
 * /auth/vk/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Callback VK OAuth
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Редирект на фронтенд с токенами
 */
router.get('/vk/callback', authController.vkCallback);

/**
 * @swagger
 * /auth/github:
 *   get:
 *     tags: [Auth]
 *     summary: Войти через GitHub
 *     responses:
 *       302:
 *         description: Редирект на GitHub OAuth
 */
router.get('/github', authLimiter, authController.githubAuth);

/**
 * @swagger
 * /auth/github/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Callback GitHub OAuth
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Редирект на фронтенд с токенами
 */
router.get('/github/callback', authController.githubCallback);

/**
 * @swagger
 * /auth/discord:
 *   get:
 *     tags: [Auth]
 *     summary: Войти через Discord
 *     responses:
 *       302:
 *         description: Редирект на Discord OAuth
 */
router.get('/discord', authLimiter, authController.discordAuth);

/**
 * @swagger
 * /auth/discord/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Callback Discord OAuth
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Редирект на фронтенд с токенами
 */
router.get('/discord/callback', authController.discordCallback);

/**
 * @swagger
 * /auth/max:
 *   get:
 *     tags: [Auth]
 *     summary: WebSocket — аутентификация через MAX
 *     description: >
 *       **WebSocket endpoint** (`ws://`). Подключение инициирует генерацию QR-кода
 *       для входа через мессенджер MAX (МТС). После сканирования QR клиентом
 *       сервер отправляет токены через это же соединение.
 *
 *       Протокол: `WebSocket (RFC 6455)`. Клиент делает Upgrade-запрос на этот URL,
 *       HTTP-ответ — `101 Switching Protocols`.
 *     responses:
 *       101:
 *         description: Соединение переключено на WebSocket
 *       426:
 *         description: Требуется Upgrade до WebSocket
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /auth/max/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Callback MAX OAuth
 *     description: Финализирует аутентификацию через сервис MAX (МТС). Токены передаются через WebSocket `/api/auth/max`.
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Редирект на фронтенд с токенами
 */
router.get('/max/callback', authController.maxCallback);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Обновить access token
 *     description: Возвращает новую пару токенов по действующему refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Действующий refresh token
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Невалидный или истёкший refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
    '/refresh',
    authCheckLimiter,
    validate(refreshTokenSchema),
    authController.refresh
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Выйти из текущей сессии
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный выход
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: Выйти со всех устройств
 *     description: Инвалидирует все refresh tokens пользователя.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Все сессии завершены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout-all', authenticate, authController.logoutAll);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Получить данные текущего пользователя
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные аутентифицированного пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authCheckLimiter, authenticate, authController.me);

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     tags: [Auth]
 *     summary: Получить активные сессии
 *     description: Возвращает список всех активных сессий пользователя (устройства, IP, дата).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список сессий
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Session'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/sessions', authCheckLimiter, authenticate, authController.sessions);

/**
 * @swagger
 * /auth/session/{id}:
 *   delete:
 *     tags: [Auth]
 *     summary: Завершить конкретную сессию
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID сессии (refresh token)
 *     responses:
 *       200:
 *         description: Сессия завершена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Сессия не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/session/:id', authCheckLimiter, authenticate, validate(revokeSessionSchema), authController.revokeSession);

export default router;

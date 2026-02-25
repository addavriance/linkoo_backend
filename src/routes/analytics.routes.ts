import {Router} from 'express';
import {authenticate} from '@/middleware/auth.middleware';
import {viewLimiter} from '@/middleware/rateLimiter';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

/**
 * @swagger
 * /analytics/{cardId}/event:
 *   post:
 *     tags: [Analytics]
 *     summary: Зафиксировать взаимодействие с карточкой
 *     description: >
 *       Отправляется при взаимодействии посетителя с карточкой (клик по соцсети,
 *       сохранение контакта, шер и т.д.). Rate limit — 30 запросов в минуту с одного IP.
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID карточки
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnalyticsEvent'
 *     responses:
 *       200:
 *         description: Событие зафиксировано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: Неверный тип события
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Превышен лимит запросов
 */
router.post('/:cardId/event', viewLimiter, analyticsController.trackCardEvent);

/**
 * @swagger
 * /analytics/{cardId}:
 *   get:
 *     tags: [Analytics]
 *     summary: Получить аналитику карточки
 *     description: >
 *       Возвращает полную аналитику за выбранный период: динамику просмотров,
 *       устройства, страны, взаимодействия и последние события.
 *       Доступно только владельцу карточки с Premium-аккаунтом.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID карточки
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d]
 *           default: 7d
 *         description: Период аналитики
 *     responses:
 *       200:
 *         description: Аналитика карточки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsData'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Нет доступа (не владелец карточки или free-аккаунт)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Карточка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:cardId', authenticate, analyticsController.getCardAnalytics);

export default router;
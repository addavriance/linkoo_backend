import {Router} from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import cardRoutes from './card.routes';
import linkRoutes from './link.routes';
import paymentRoutes from './payment.routes';
import analyticsRoutes from './analytics.routes';
import adminRoutes from './admin.routes';
import * as cardController from '../controllers/card.controller';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/cards', cardRoutes);
router.use('/links', linkRoutes);
router.use('/payments', paymentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);

/**
 * @swagger
 * /subdomain/{subdomain}:
 *   get:
 *     tags: [Cards]
 *     summary: Получить карточку по поддомену
 *     description: >
 *       Используется при открытии `{subdomain}.linkoo.dev` — возвращает карточку,
 *       привязанную к данному поддомену. Поддомен доступен только у Premium-пользователей.
 *     parameters:
 *       - in: path
 *         name: subdomain
 *         required: true
 *         schema:
 *           type: string
 *           example: ivan
 *         description: Кастомный поддомен
 *     responses:
 *       200:
 *         description: Данные карточки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Card'
 *       404:
 *         description: Поддомен не найден или карточка неактивна
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404'
 */
router.get('/subdomain/:subdomain', cardController.getCardBySubdomain);

export default router;
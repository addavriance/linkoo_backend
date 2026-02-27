import {Router} from 'express';
import {authenticate} from '@/middleware/auth.middleware';
import {
    createPayment,
    getPaymentStatus,
    handleWebhook,
    getPaymentHistory,
    getPaymentMethods,
    deletePaymentMethod,
    linkCard,
} from '@/controllers/payment.controller';

const router = Router();

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Webhook от платёжной системы
 *     description: >
 *       Принимает уведомления от платёжного провайдера об изменении статуса платежа.
 *       Верифицирует подпись и обновляет подписку пользователя.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Payload от платёжного провайдера
 *     responses:
 *       200:
 *         description: Webhook обработан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: Невалидная подпись или данные
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400'
 */
router.post('/webhook', handleWebhook);

router.use(authenticate);

/**
 * @swagger
 * /payments/create:
 *   post:
 *     tags: [Payments]
 *     summary: Создать платёж (оформить подписку)
 *     description: Инициирует платёж для оформления Premium-подписки. Возвращает URL для оплаты.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Платёж создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentCreate'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 */
router.post('/create', createPayment);

/**
 * @swagger
 * /payments/link-card:
 *   post:
 *     tags: [Payments]
 *     summary: Привязать платёжную карту
 *     description: Инициирует привязку карты для автоматических списаний при продлении подписки.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Запрос на привязку карты создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentCreate'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 */
router.post('/link-card', linkCard);

/**
 * @swagger
 * /payments/history:
 *   get:
 *     tags: [Payments]
 *     summary: История платежей
 *     description: Возвращает список всех платежей пользователя.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: История платежей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentStatus'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 */
router.get('/history', getPaymentHistory);

/**
 * @swagger
 * /payments/methods:
 *   get:
 *     tags: [Payments]
 *     summary: Получить сохранённые платёжные методы
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список платёжных методов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentMethod'
 */
router.get('/methods', getPaymentMethods);

/**
 * @swagger
 * /payments/methods/{paymentMethodId}:
 *   delete:
 *     tags: [Payments]
 *     summary: Удалить платёжный метод
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethodId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID платёжного метода
 *     responses:
 *       200:
 *         description: Платёжный метод удалён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: Метод не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404'
 */
router.delete('/methods/:paymentMethodId', deletePaymentMethod);

/**
 * @swagger
 * /payments/{paymentKey}:
 *   get:
 *     tags: [Payments]
 *     summary: Получить статус платежа
 *     description: Используется для polling статуса платежа после редиректа со страницы оплаты.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentKey
 *         required: true
 *         schema:
 *           type: string
 *         description: Уникальный ключ платежа
 *     responses:
 *       200:
 *         description: Статус платежа
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentStatus'
 *       404:
 *         description: Платёж не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404'
 */
router.get('/:paymentKey', getPaymentStatus);

export default router;
import {Router} from 'express';
import * as cardController from '../controllers/card.controller';
import {authenticate, optionalAuth} from '@/middleware/auth.middleware';
import {checkCardLimit, requirePaid} from '@/middleware/accountType';
import {viewLimiter} from '@/middleware/rateLimiter';
import {validate} from '@/middleware/validator';
import {
    createCardSchema,
    updateCardSchema,
    getCardSchema,
    deleteCardSchema,
    setSubdomainSchema,
} from '@/validators/card.validator';

const router = Router();

/**
 * @swagger
 * /cards/public:
 *   get:
 *     tags: [Cards]
 *     summary: Получить публичные карточки
 *     description: Возвращает список публичных активных карточек для витрины.
 *     responses:
 *       200:
 *         description: Список публичных карточек
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Card'
 */
router.get('/public', cardController.getPublicCards);

/**
 * @swagger
 * /cards/{id}:
 *   get:
 *     tags: [Cards]
 *     summary: Получить карточку по ID или slug
 *     description: Возвращает данные карточки. Если передан Bearer token, возвращает расширенные данные для владельца.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId или slug карточки
 *     security:
 *       - {}
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные карточки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Card'
 *       404:
 *         description: Карточка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404'
 */
router.get(
    '/:id',
    optionalAuth,
    validate(getCardSchema),
    cardController.getCard
);

/**
 * @swagger
 * /cards/{id}/view:
 *   post:
 *     tags: [Cards]
 *     summary: Зафиксировать просмотр карточки
 *     description: Увеличивает счётчик просмотров. Rate limit — 30 запросов в минуту с одного IP.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID карточки
 *     responses:
 *       200:
 *         description: Просмотр зафиксирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: Карточка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404'
 *       429:
 *         description: Превышен лимит запросов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error429'
 */
router.post('/:id/view', viewLimiter, cardController.trackView);

router.use(authenticate);

/**
 * @swagger
 * /cards:
 *   get:
 *     tags: [Cards]
 *     summary: Получить мои карточки
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список карточек пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Card'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 */
router.get('/', cardController.getMyCards);

/**
 * @swagger
 * /cards:
 *   post:
 *     tags: [Cards]
 *     summary: Создать карточку
 *     description: >
 *       Создаёт новую цифровую визитку. Free-аккаунт может иметь не более 1 карточки;
 *       Premium-аккаунт — неограниченно.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CardInput'
 *     responses:
 *       201:
 *         description: Карточка создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Card'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400'
 *       403:
 *         description: Достигнут лимит карточек для free-аккаунта
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error403'
 */
router.post(
    '/',
    checkCardLimit,
    validate(createCardSchema),
    cardController.createCard
);

/**
 * @swagger
 * /cards/{id}/subdomain:
 *   patch:
 *     tags: [Cards]
 *     summary: Установить поддомен карточки
 *     description: >
 *       Привязывает кастомный поддомен к карточке (например `ivan.linkoo.dev`).
 *       Доступно только для Premium-аккаунтов.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID карточки
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subdomain]
 *             properties:
 *               subdomain:
 *                 type: string
 *                 example: ivan
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: '^[a-z0-9-]+$'
 *                 description: Только строчные буквы, цифры и дефисы
 *     responses:
 *       200:
 *         description: Поддомен установлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Card'
 *       400:
 *         description: Невалидный поддомен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400'
 *       403:
 *         description: Требуется Premium-аккаунт
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error403'
 *       409:
 *         description: Поддомен уже занят
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error409'
 */
router.patch('/:id/subdomain', requirePaid, validate(setSubdomainSchema), cardController.setSubdomain);

/**
 * @swagger
 * /cards/{id}/subdomain:
 *   delete:
 *     tags: [Cards]
 *     summary: Удалить поддомен карточки
 *     description: Освобождает поддомен, привязанный к карточке. Только для Premium-аккаунтов.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Поддомен удалён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       403:
 *         description: Требуется Premium-аккаунт
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error403'
 */
router.delete('/:id/subdomain', requirePaid, validate(getCardSchema), cardController.removeSubdomain);

/**
 * @swagger
 * /cards/{id}:
 *   patch:
 *     tags: [Cards]
 *     summary: Обновить карточку
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CardInput'
 *     responses:
 *       200:
 *         description: Карточка обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Card'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400'
 *       403:
 *         description: Нет доступа к карточке
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error403'
 *       404:
 *         description: Карточка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404'
 */
router.patch('/:id', validate(updateCardSchema), cardController.updateCard);

/**
 * @swagger
 * /cards/{id}:
 *   delete:
 *     tags: [Cards]
 *     summary: Удалить карточку
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Карточка удалена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       403:
 *         description: Нет доступа к карточке
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error403'
 *       404:
 *         description: Карточка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404'
 */
router.delete('/:id', validate(deleteCardSchema), cardController.deleteCard);

export default router;
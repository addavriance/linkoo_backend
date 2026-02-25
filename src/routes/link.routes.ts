import {Router} from 'express';
import * as linkController from '../controllers/link.controller';
import {authenticate, optionalAuth} from '@/middleware/auth.middleware';
import {checkSubdomainAccess} from '@/middleware/accountType';
import {linkCreationLimiter} from '@/middleware/rateLimiter';
import {validate} from '@/middleware/validator';
import {
    createLinkSchema,
    updateLinkSchema,
    getLinkSchema,
    deleteLinkSchema,
} from '../validators/link.validator';

const router = Router();

/**
 * @swagger
 * /links/{slug}:
 *   get:
 *     tags: [Links]
 *     summary: Получить ссылку по slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: abc123
 *     responses:
 *       200:
 *         description: Данные ссылки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShortenedLink'
 *       404:
 *         description: Ссылка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:slug', validate(getLinkSchema), linkController.getLink);

/**
 * @swagger
 * /links:
 *   post:
 *     tags: [Links]
 *     summary: Создать сокращённую ссылку
 *     description: >
 *       Создаёт ссылку типа `url` (перенаправление на URL) или `card`
 *       (перенаправление на цифровую визитку). Rate limit — 50 ссылок в час.
 *       Авторизация необязательна, но рекомендуется для привязки ссылки к аккаунту.
 *     security:
 *       - {}
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetType]
 *             properties:
 *               targetType:
 *                 type: string
 *                 enum: [url, card]
 *               rawData:
 *                 type: string
 *                 description: URL назначения (обязателен для targetType=url)
 *                 example: https://example.com
 *               cardId:
 *                 type: string
 *                 description: ID карточки (обязателен для targetType=card)
 *               slug:
 *                 type: string
 *                 description: Желаемый slug (если не указан — генерируется автоматически)
 *                 minLength: 3
 *                 maxLength: 50
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Дата истечения ссылки (опционально)
 *     responses:
 *       201:
 *         description: Ссылка создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShortenedLink'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Slug уже занят
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Превышен лимит создания ссылок
 */
router.post(
    '/',
    optionalAuth,
    linkCreationLimiter,
    checkSubdomainAccess,
    validate(createLinkSchema),
    linkController.createLink
);

router.use(authenticate);

/**
 * @swagger
 * /links:
 *   get:
 *     tags: [Links]
 *     summary: Получить мои ссылки
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список ссылок пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ShortenedLink'
 */
router.get('/', linkController.getMyLinks);

/**
 * @swagger
 * /links/{slug}:
 *   patch:
 *     tags: [Links]
 *     summary: Обновить ссылку
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slug:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *               isActive:
 *                 type: boolean
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Ссылка обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShortenedLink'
 *       403:
 *         description: Нет доступа к ссылке
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Ссылка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:slug', validate(updateLinkSchema), linkController.updateLink);

/**
 * @swagger
 * /links/{slug}:
 *   delete:
 *     tags: [Links]
 *     summary: Удалить ссылку
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ссылка удалена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       403:
 *         description: Нет доступа к ссылке
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:slug', validate(deleteLinkSchema), linkController.deleteLink);

/**
 * @swagger
 * /links/{slug}/stats:
 *   get:
 *     tags: [Links]
 *     summary: Получить статистику ссылки
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Статистика переходов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LinkStats'
 *       403:
 *         description: Нет доступа к ссылке
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:slug/stats', linkController.getLinkStats);

/**
 * @swagger
 * /links/card/{cardId}:
 *   get:
 *     tags: [Links]
 *     summary: Получить ссылку карточки
 *     description: Возвращает сокращённую ссылку, привязанную к конкретной карточке.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID карточки
 *     responses:
 *       200:
 *         description: Ссылка карточки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShortenedLink'
 *       404:
 *         description: Ссылка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/card/:cardId', linkController.getLinkByCardId);

export default router;
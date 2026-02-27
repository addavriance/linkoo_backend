import {Router} from 'express';
import * as userController from '../controllers/user.controller';
import * as cardController from '../controllers/card.controller';
import * as linkController from '../controllers/link.controller';
import {authenticate} from '@/middleware/auth.middleware';
import {validate} from '@/middleware/validator';
import {updateUserSchema} from '@/validators/auth.validator';
import {avatarUpload} from '@/middleware/upload.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Получить профиль пользователя
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные профиля
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 */
router.get('/me', userController.getProfile);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Обновить профиль пользователя
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               locale:
 *                 type: string
 *                 example: ru
 *               settings:
 *                 type: object
 *                 properties:
 *                   emailNotifications:
 *                     type: boolean
 *                   language:
 *                     type: string
 *     responses:
 *       200:
 *         description: Профиль обновлён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400'
 */
router.patch('/me', validate(updateUserSchema), userController.updateProfile);

/**
 * @swagger
 * /users/me/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Загрузить аватар
 *     description: Принимает изображение (JPEG, PNG, WebP) до 5 МБ и сохраняет в `/uploads/`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Файл изображения
 *     responses:
 *       200:
 *         description: Аватар загружен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avatar:
 *                   type: string
 *                   format: uri
 *                   description: URL загруженного аватара
 *       400:
 *         description: Неверный формат файла
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400'
 */
router.post('/me/avatar', avatarUpload.single('avatar'), userController.uploadAvatar);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     tags: [Users]
 *     summary: Удалить аккаунт
 *     description: Безвозвратно удаляет аккаунт пользователя вместе со всеми карточками и ссылками.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Аккаунт удалён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 */
router.delete('/me', userController.deleteAccount);

/**
 * @swagger
 * /users/me/cards:
 *   get:
 *     tags: [Users]
 *     summary: Получить карточки пользователя
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список карточек
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Card'
 */
router.get('/me/cards', cardController.getMyCards);

/**
 * @swagger
 * /users/me/links:
 *   get:
 *     tags: [Users]
 *     summary: Получить ссылки пользователя
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список сокращённых ссылок
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ShortenedLink'
 */
router.get('/me/links', linkController.getMyLinks);

/**
 * @swagger
 * /users/me/stats:
 *   get:
 *     tags: [Users]
 *     summary: Получить статистику пользователя
 *     description: Общая статистика — количество карточек, ссылок, суммарные просмотры и клики.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStats'
 */
router.get('/me/stats', userController.getStats);

export default router;
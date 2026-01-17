import {Router} from 'express';
import * as authController from '../controllers/auth.controller';
import {authenticate} from '../middleware/auth.middleware';
import {authLimiter, authCheckLimiter} from '../middleware/rateLimiter';
import {validate} from '../middleware/validator';
import {refreshTokenSchema} from '../validators/auth.validator';

const router = Router();

router.get('/google', authLimiter, authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

router.get('/vk', authLimiter, authController.vkAuth);
router.get('/vk/callback', authController.vkCallback);

router.get('/discord', authLimiter, authController.discordAuth);
router.get('/discord/callback', authController.discordCallback);

router.get('/github', authLimiter, authController.githubAuth);
router.get('/github/callback', authController.githubCallback);

router.post('/max', authLimiter, authController.maxAuth);
router.get('/max/callback', authController.maxCallback);

router.post(
    '/refresh',
    authCheckLimiter,
    validate(refreshTokenSchema),
    authController.refresh
);

router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);

router.get('/me', authCheckLimiter, authenticate, authController.me);

export default router;

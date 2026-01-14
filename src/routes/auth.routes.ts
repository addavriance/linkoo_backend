import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validator';
import { refreshTokenSchema } from '../validators/auth.validator';

const router = Router();

// OAuth initiation routes
router.get('/google', authLimiter, authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

router.get('/vk', authLimiter, authController.vkAuth);
router.get('/vk/callback', authController.vkCallback);

router.get('/discord', authLimiter, authController.discordAuth);
router.get('/discord/callback', authController.discordCallback);

router.get('/github', authLimiter, authController.githubAuth);
router.get('/github/callback', authController.githubCallback);

// Token management
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refresh
);

router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);

// Current user
router.get('/me', authenticate, authController.me);

export default router;

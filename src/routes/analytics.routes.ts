import {Router} from 'express';
import {authenticate} from '@/middleware/auth.middleware';
import {viewLimiter} from '@/middleware/rateLimiter';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

router.post('/:cardId/event', viewLimiter, analyticsController.trackCardEvent);

router.use(authenticate);

router.get('/:cardId', analyticsController.getCardAnalytics);

export default router;

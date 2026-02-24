import {Router} from 'express';
import {authenticate} from '@/middleware/auth.middleware';
import {viewLimiter} from '@/middleware/rateLimiter';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

// Public: track interaction event (rate limited)
router.post('/:cardId/event', viewLimiter, analyticsController.trackCardEvent);

// Private: get card analytics (requires auth)
router.get('/:cardId', authenticate, analyticsController.getCardAnalytics);

export default router;
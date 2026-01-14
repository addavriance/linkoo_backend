import { Router } from 'express';
import * as cardController from '../controllers/card.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { checkCardLimit } from '../middleware/accountType';
import { viewLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validator';
import {
  createCardSchema,
  updateCardSchema,
  getCardSchema,
  deleteCardSchema,
} from '../validators/card.validator';

const router = Router();

// Public routes
router.get('/public', cardController.getPublicCards);

// Get card by ID (optional auth for visibility check)
router.get(
  '/:id',
  optionalAuth,
  validate(getCardSchema),
  cardController.getCard
);

// Track view (rate limited)
router.post('/:id/view', viewLimiter, cardController.trackView);

// Protected routes
router.use(authenticate);

// Get my cards
router.get('/', cardController.getMyCards);

// Create card (with card limit check)
router.post(
  '/',
  checkCardLimit,
  validate(createCardSchema),
  cardController.createCard
);

// Update card
router.patch('/:id', validate(updateCardSchema), cardController.updateCard);

// Delete card
router.delete('/:id', validate(deleteCardSchema), cardController.deleteCard);

export default router;

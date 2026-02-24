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

router.get('/public', cardController.getPublicCards);

router.get(
    '/:id',
    optionalAuth,
    validate(getCardSchema),
    cardController.getCard
);

router.post('/:id/view', viewLimiter, cardController.trackView);

router.use(authenticate);

router.get('/', cardController.getMyCards);

router.post(
    '/',
    checkCardLimit,
    validate(createCardSchema),
    cardController.createCard
);

router.patch('/:id/subdomain', requirePaid, validate(setSubdomainSchema), cardController.setSubdomain);

router.delete('/:id/subdomain', requirePaid, validate(getCardSchema), cardController.removeSubdomain);

router.patch('/:id', validate(updateCardSchema), cardController.updateCard);

router.delete('/:id', validate(deleteCardSchema), cardController.deleteCard);

export default router;

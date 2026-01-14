import {Router} from 'express';
import * as linkController from '../controllers/link.controller';
import {authenticate, optionalAuth} from '../middleware/auth.middleware';
import {checkSubdomainAccess} from '../middleware/accountType';
import {linkCreationLimiter} from '../middleware/rateLimiter';
import {validate} from '../middleware/validator';
import {
    createLinkSchema,
    updateLinkSchema,
    getLinkSchema,
    deleteLinkSchema,
} from '../validators/link.validator';

const router = Router();

router.get('/:slug', validate(getLinkSchema), linkController.getLink);

router.use(authenticate);

router.get('/', linkController.getMyLinks);

router.post(
    '/',
    linkCreationLimiter,
    checkSubdomainAccess,
    validate(createLinkSchema),
    linkController.createLink
);

router.patch('/:slug', validate(updateLinkSchema), linkController.updateLink);

router.delete('/:slug', validate(deleteLinkSchema), linkController.deleteLink);

router.get('/:slug/stats', linkController.getLinkStats);

export default router;

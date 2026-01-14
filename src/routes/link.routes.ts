import { Router } from 'express';
import * as linkController from '../controllers/link.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { checkSubdomainAccess } from '../middleware/accountType';
import { linkCreationLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validator';
import {
  createLinkSchema,
  updateLinkSchema,
  getLinkSchema,
  deleteLinkSchema,
} from '../validators/link.validator';

const router = Router();

// Public routes
router.get('/:slug', validate(getLinkSchema), linkController.getLink);

// Protected routes
router.use(authenticate);

// Get my links
router.get('/', linkController.getMyLinks);

// Create link (with rate limiting and subdomain check)
router.post(
  '/',
  linkCreationLimiter,
  checkSubdomainAccess,
  validate(createLinkSchema),
  linkController.createLink
);

// Update link
router.patch('/:slug', validate(updateLinkSchema), linkController.updateLink);

// Delete link
router.delete('/:slug', validate(deleteLinkSchema), linkController.deleteLink);

// Get link stats
router.get('/:slug/stats', linkController.getLinkStats);

export default router;

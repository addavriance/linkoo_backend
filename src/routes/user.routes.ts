import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import * as cardController from '../controllers/card.controller';
import * as linkController from '../controllers/link.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validator';
import { updateUserSchema } from '../validators/auth.validator';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Profile
router.get('/me', userController.getProfile);
router.patch('/me', validate(updateUserSchema), userController.updateProfile);
router.delete('/me', userController.deleteAccount);

// User's resources
router.get('/me/cards', cardController.getMyCards);
router.get('/me/links', linkController.getMyLinks);
router.get('/me/stats', userController.getStats);

export default router;

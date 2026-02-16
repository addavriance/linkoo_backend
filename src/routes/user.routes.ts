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

router.get('/me', userController.getProfile);
router.patch('/me', validate(updateUserSchema), userController.updateProfile);
router.post('/me/avatar', avatarUpload.single('avatar'), userController.uploadAvatar);
router.delete('/me', userController.deleteAccount);

router.get('/me/cards', cardController.getMyCards);
router.get('/me/links', linkController.getMyLinks);
router.get('/me/stats', userController.getStats);

export default router;

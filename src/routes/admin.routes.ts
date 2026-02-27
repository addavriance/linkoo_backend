import {Router} from 'express';
import {authenticate} from '@/middleware/auth.middleware';
import {requireAdmin, requireStaff} from '@/middleware/role';
import * as adminController from '@/controllers/admin.controller';

const router = Router();

router.use(authenticate);

router.get('/stats', requireStaff, adminController.getStats);

router.get('/users', requireAdmin, adminController.getUsers);
router.patch('/users/:id', requireAdmin, adminController.updateUser);

router.get('/cards', requireStaff, adminController.getCards);
router.patch('/cards/:id', requireStaff, adminController.updateCard);

router.get('/links', requireStaff, adminController.getLinks);
router.patch('/links/:id', requireStaff, adminController.updateLink);

export default router;

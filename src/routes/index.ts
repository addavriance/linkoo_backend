import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import cardRoutes from './card.routes';
import linkRoutes from './link.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/cards', cardRoutes);
router.use('/links', linkRoutes);

export default router;

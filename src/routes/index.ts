import {Router} from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import cardRoutes from './card.routes';
import linkRoutes from './link.routes';
import paymentRoutes from './payment.routes';
import * as cardController from '../controllers/card.controller';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/cards', cardRoutes);
router.use('/links', linkRoutes);
router.use('/payments', paymentRoutes);

router.get('/subdomain/:subdomain', cardController.getCardBySubdomain);

export default router;

import {Router} from 'express';
import {authenticate} from '@/middleware/auth.middleware';
import {
    createPayment,
    getPaymentStatus,
    handleWebhook,
    getPaymentHistory,
    getPaymentMethods,
    deletePaymentMethod,
    linkCard,
} from '@/controllers/payment.controller';

const router = Router();


router.post('/webhook', handleWebhook);

router.use(authenticate);

router.post('/create', createPayment);

router.post('/link-card', linkCard);

router.get('/history', getPaymentHistory);

router.get('/methods', getPaymentMethods);

router.delete('/methods/:paymentMethodId', deletePaymentMethod);

router.get('/:paymentKey', getPaymentStatus);

export default router;

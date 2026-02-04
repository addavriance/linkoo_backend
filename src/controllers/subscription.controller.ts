import axios from 'axios';
import {randomUUID} from 'crypto';
import {Payment} from '../models/Payment';
import {User} from '../models/User';
import {env} from '../config/env';
import {AppError} from '../utils/errors';
import {DAY} from "../constants";

const YUKASSA_API_URL = 'https://api.yookassa.ru/v3';

const getAuthHeader = () => {
    if (!env.YUKASSA_SHOP_ID || !env.YUKASSA_SECRET_KEY) {
        throw new AppError('ЮKassa credentials not configured', 500);
    }
    return Buffer.from(`${env.YUKASSA_SHOP_ID}:${env.YUKASSA_SECRET_KEY}`).toString('base64');
};

export async function chargeSubscription(
    userId: string,
    paymentMethodId: string,
    amount: number,
    plan: 'monthly' | 'yearly'
): Promise<boolean> {
    const idempotenceKey = randomUUID();

    try {
        // Сохраняем платеж в БД
        const paymentDoc = await Payment.create({
            idempotenceKey,
            userId,
            amount,
            currency: 'RUB',
            status: 'pending',
            paid: false,
            plan,
            description: `Автопродление подписки Linkoo Premium (${plan})`,
            metadata: {
                auto_renewal: true,
                payment_method_id: paymentMethodId,
            },
        });

        // Создаем автоматический платеж
        const paymentResponse = await axios.post(
            `${YUKASSA_API_URL}/payments`,
            {
                amount: {
                    value: amount.toFixed(2),
                    currency: 'RUB',
                },
                capture: true,
                // Используем сохраненный платежный метод
                payment_method_id: paymentMethodId,
                description: `Автопродление подписки Linkoo Premium (${plan})`,
                metadata: {
                    userId: userId.toString(),
                    idempotenceKey,
                    plan,
                    auto_renewal: true,
                },
            },
            {
                headers: {
                    'Authorization': `Basic ${getAuthHeader()}`,
                    'Idempotence-Key': idempotenceKey,
                    'Content-Type': 'application/json',
                },
            }
        );

        const payment = paymentResponse.data;

        // Обновляем запись
        paymentDoc.paymentId = payment.id;
        paymentDoc.status = payment.status;
        paymentDoc.paid = payment.paid || false;
        await paymentDoc.save();

        // Если платеж успешен - продлеваем подписку
        if (payment.status === 'succeeded' && payment.paid) {
            const expiresAt = plan === 'yearly'
                ? new Date(Date.now() + 365 * DAY)
                : new Date(Date.now() + 30 * DAY);

            await User.findByIdAndUpdate(userId, {
                accountType: 'paid',
                'subscription.plan': plan,
                'subscription.expiresAt': expiresAt,
            });

            console.log(`Auto-renewed subscription for user ${userId}, expires at ${expiresAt}`);
            return true;
        }

        return false;
    } catch (error: any) {
        console.error('Auto charge failed:', error.response?.data || error.message);

        // Уведомляем пользователя об ошибке автоплатежа
        // TODO: отправить email о необходимости обновить платежные данные

        return false;
    }
}

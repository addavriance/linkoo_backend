import {Request, Response} from 'express';
import axios from 'axios';
import {randomUUID} from 'crypto';
import {Payment} from '../models/Payment';
import {User} from '../models/User';
import {env} from '../config/env';
import {AppError} from '../utils/errors';
import {successResponse} from '../utils/response';
import {getPlanInfo, SubscriptionPlan, calculateExpiryDate} from '../constants/payment';
import {asyncHandler} from '../utils/asyncHandler';
import {Types} from "mongoose";

const YUKASSA_API_URL = 'https://api.yookassa.ru/v3';

// Создаем Basic Auth заголовок
const getAuthHeader = () => {
    if (!env.YUKASSA_SHOP_ID || !env.YUKASSA_SECRET_KEY) {
        throw new AppError('ЮKassa credentials not configured', 500);
    }
    return Buffer.from(`${env.YUKASSA_SHOP_ID}:${env.YUKASSA_SECRET_KEY}`).toString('base64');
};

/**
 * Создание платежа в ЮKassa
 */
export const createPayment = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const {plan} = req.body as {plan: SubscriptionPlan};

    // Валидация плана
    if (!plan || !['monthly', 'yearly'].includes(plan)) {
        throw new AppError('Некорректный тарифный план', 400);
    }

    // Получаем информацию о тарифе из констант
    const planInfo = getPlanInfo(plan);
    const amount = planInfo.price;
    const description = planInfo.description;

    // Генерируем уникальный ключ идемпотентности
    const idempotenceKey = randomUUID();

    try {
        // Сохраняем платеж в БД ДО отправки запроса в ЮKassa
        const paymentDoc = await Payment.create({
            idempotenceKey,
            userId,
            amount,
            currency: 'RUB',
            status: 'pending',
            paid: false,
            plan,
            description,
        });

        // Создаем платеж в ЮKassa
        const paymentResponse = await axios.post(
            `${YUKASSA_API_URL}/payments`,
            {
                amount: {
                    value: amount.toFixed(2),
                    currency: 'RUB',
                },
                confirmation: {
                    type: 'redirect',
                    // Передаем наш idempotenceKey в return_url
                    return_url: `${env.YUKASSA_RETURN_URL}?paymentKey=${idempotenceKey}`,
                },
                capture: true, // Автоматическое подтверждение платежа
                save_payment_method: true, // Сохраняем метод оплаты для автоплатежей
                description,
                metadata: {
                    userId: userId.toString(),
                    idempotenceKey,
                    plan,
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

        paymentDoc.paymentId = payment.id;
        paymentDoc.status = payment.status;

        // Сохраняем payment_method если он есть
        if (payment.payment_method && payment.payment_method.saved) {
            paymentDoc.paymentMethod = {
                id: payment.payment_method.id,
                type: payment.payment_method.type,
                saved: payment.payment_method.saved,
                status: payment.payment_method.status,
                title: payment.payment_method.title,
                card: payment.payment_method.card ? {
                    first6: payment.payment_method.card.first6,
                    last4: payment.payment_method.card.last4,
                    expiry_year: payment.payment_method.card.expiry_year,
                    expiry_month: payment.payment_method.card.expiry_month,
                    card_type: payment.payment_method.card.card_type,
                    issuer_country: payment.payment_method.card.issuer_country,
                } : undefined,
            };
        }

        await paymentDoc.save();

        res.json(
            successResponse({
                idempotenceKey,
                id: payment.id,
                status: payment.status,
                confirmation_url: payment.confirmation.confirmation_url,
            })
        );
    } catch (error: any) {
        console.error('Payment creation error:', error.response?.data || error.message);
        throw new AppError(
            error.response?.data?.description || 'Ошибка при создании платежа',
            500
        );
    }
});

/**
 * Получение статуса платежа по ключу идемпотентности
 */
export const getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const {paymentKey} = req.params;

    try {
        const paymentDoc = await Payment.findOne({idempotenceKey: paymentKey});

        if (!paymentDoc) {
            throw new AppError('Платеж не найден', 404);
        }

        if (paymentDoc.userId.toString() !== userId.toString()) {
            throw new AppError('Доступ запрещен', 403);
        }

        if (paymentDoc.paymentId) {
            const paymentResponse = await axios.get(
                `${YUKASSA_API_URL}/payments/${paymentDoc.paymentId}`,
                {
                    headers: {
                        'Authorization': `Basic ${getAuthHeader()}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const payment = paymentResponse.data;

            paymentDoc.status = payment.status;
            paymentDoc.paid = payment.paid;

            // Сохраняем payment_method если он есть
            if (payment.payment_method && payment.payment_method.saved) {
                paymentDoc.paymentMethod = {
                    id: payment.payment_method.id,
                    type: payment.payment_method.type,
                    saved: payment.payment_method.saved,
                    status: payment.payment_method.status,
                    title: payment.payment_method.title,
                    card: payment.payment_method.card ? {
                        first6: payment.payment_method.card.first6,
                        last4: payment.payment_method.card.last4,
                        expiry_year: payment.payment_method.card.expiry_year,
                        expiry_month: payment.payment_method.card.expiry_month,
                        card_type: payment.payment_method.card.card_type,
                        issuer_country: payment.payment_method.card.issuer_country,
                    } : undefined,
                };
            }

            await paymentDoc.save();

            if (payment.status === 'succeeded' && payment.paid) {
                await activatePremiumSubscription(userId, paymentDoc.plan || 'monthly');
            }
        }

        res.json(
            successResponse({
                id: paymentDoc.paymentId,
                status: paymentDoc.status,
                paid: paymentDoc.paid,
                amount: paymentDoc.amount,
            })
        );
    } catch (error: any) {
        if (error instanceof AppError) throw error;

        console.error('Get payment error:', error.response?.data || error.message);
        throw new AppError(
            error.response?.data?.description || 'Ошибка при получении статуса платежа',
            500
        );
    }
});

/**
 * Обработка webhook уведомлений от ЮKassa
 */
export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const notification = req.body;

        // Валидация webhook (опционально - проверка IP)
        // const allowedIPs = ['185.71.76.0/27', '185.71.77.0/27', ...];
        // TODO: настроить iptables на сервере

        if (notification.event === 'payment.succeeded') {
            const payment = notification.object;
            const userId = payment.metadata?.userId;
            const plan = payment.metadata?.plan || 'monthly';
            const idempotenceKey = payment.metadata?.idempotenceKey;

            if (!userId) {
                console.error('Payment webhook: userId not found in metadata');
                return res.status(400).send('Bad Request');
            }

            // Обновляем статус платежа в БД (ищем по ключу или ID)
            const updateQuery = idempotenceKey
                ? {idempotenceKey}
                : {paymentId: payment.id};

            const updateData: any = {
                paymentId: payment.id,
                status: payment.status,
                paid: payment.paid,
            };

            // Сохраняем payment_method если он есть
            if (payment.payment_method && payment.payment_method.saved) {
                updateData.paymentMethod = {
                    id: payment.payment_method.id,
                    type: payment.payment_method.type,
                    saved: payment.payment_method.saved,
                    status: payment.payment_method.status,
                    title: payment.payment_method.title,
                    card: payment.payment_method.card ? {
                        first6: payment.payment_method.card.first6,
                        last4: payment.payment_method.card.last4,
                        expiry_year: payment.payment_method.card.expiry_year,
                        expiry_month: payment.payment_method.card.expiry_month,
                        card_type: payment.payment_method.card.card_type,
                        issuer_country: payment.payment_method.card.issuer_country,
                    } : undefined,
                };
            }

            await Payment.findOneAndUpdate(updateQuery, updateData);

            // Активируем Premium подписку
            await activatePremiumSubscription(userId, plan);

            console.log(`Premium activated for user ${userId}, plan: ${plan}, payment: ${payment.id}`);
        } else if (notification.event === 'payment.waiting_for_capture') {
            const payment = notification.object;
            const idempotenceKey = payment.metadata?.idempotenceKey;

            // Обновляем статус платежа в БД
            const updateQuery = idempotenceKey
                ? {idempotenceKey}
                : {paymentId: payment.id};

            const updateData: any = {
                paymentId: payment.id,
                status: payment.status,
                paid: payment.paid || false,
            };

            // Сохраняем payment_method если он есть (для привязки карты)
            if (payment.payment_method && payment.payment_method.saved) {
                updateData.paymentMethod = {
                    id: payment.payment_method.id,
                    type: payment.payment_method.type,
                    saved: payment.payment_method.saved,
                    status: payment.payment_method.status,
                    title: payment.payment_method.title,
                    card: payment.payment_method.card ? {
                        first6: payment.payment_method.card.first6,
                        last4: payment.payment_method.card.last4,
                        expiry_year: payment.payment_method.card.expiry_year,
                        expiry_month: payment.payment_method.card.expiry_month,
                        card_type: payment.payment_method.card.card_type,
                        issuer_country: payment.payment_method.card.issuer_country,
                    } : undefined,
                };
            }

            await Payment.findOneAndUpdate(updateQuery, updateData);

            console.log(`Card linked successfully, payment: ${payment.id}`);
        } else if (notification.event === 'payment.canceled') {
            const payment = notification.object;
            const idempotenceKey = payment.metadata?.idempotenceKey;

            // Обновляем статус платежа в БД
            const updateQuery = idempotenceKey
                ? {idempotenceKey}
                : {paymentId: payment.id};

            await Payment.findOneAndUpdate(
                updateQuery,
                {
                    paymentId: payment.id,
                    status: payment.status,
                    paid: payment.paid || false,
                }
            );

            console.log(`Payment ${payment.id} was canceled`);
        }

        // Обязательно отвечаем 200 OK, иначе ЮKassa будет повторять запрос
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).send('Internal Server Error');
    }
};

/**
 * Привязка карты через тестовый платеж на 1₽
 */
export const linkCard = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const idempotenceKey = randomUUID();

    try {
        // Создаем запись о платеже в БД
        const paymentDoc = await Payment.create({
            idempotenceKey,
            userId,
            amount: 1, // 1 рубль
            currency: 'RUB',
            status: 'pending',
            paid: false,
            description: 'Привязка карты к аккаунту',
        });

        // Создаем тестовый платеж в ЮKassa БЕЗ автоматического списания
        const paymentResponse = await axios.post(
            `${YUKASSA_API_URL}/payments`,
            {
                amount: {
                    value: '1.00', // 1 рубль
                    currency: 'RUB',
                },
                confirmation: {
                    type: 'redirect',
                    return_url: `${env.YUKASSA_RETURN_URL}?paymentKey=${idempotenceKey}`,
                },
                capture: false, // НЕ списывать деньги автоматически
                save_payment_method: true, // Сохранить метод оплаты
                description: 'Привязка карты к аккаунту Linkoo',
                metadata: {
                    userId: userId.toString(),
                    idempotenceKey,
                    type: 'card_link', // Помечаем как привязку карты
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

        // Сохраняем payment_method если он есть
        if (payment.payment_method && payment.payment_method.saved) {
            paymentDoc.paymentMethod = {
                id: payment.payment_method.id,
                type: payment.payment_method.type,
                saved: payment.payment_method.saved,
                status: payment.payment_method.status,
                title: payment.payment_method.title,
                card: payment.payment_method.card ? {
                    first6: payment.payment_method.card.first6,
                    last4: payment.payment_method.card.last4,
                    expiry_year: payment.payment_method.card.expiry_year,
                    expiry_month: payment.payment_method.card.expiry_month,
                    card_type: payment.payment_method.card.card_type,
                    issuer_country: payment.payment_method.card.issuer_country,
                } : undefined,
            };
        }

        await paymentDoc.save();

        res.json(
            successResponse({
                idempotenceKey,
                id: payment.id,
                status: payment.status,
                confirmation_url: payment.confirmation.confirmation_url,
            })
        );
    } catch (error: any) {
        console.error('Link card error:', error.response?.data || error.message);
        throw new AppError(
            error.response?.data?.description || 'Ошибка при привязке карты',
            500
        );
    }
});


/**
 * Получение истории платежей пользователя
 */
export const getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;

    const payments = await Payment.find({userId})
        .sort({createdAt: -1})
        .limit(50)
        .select('-metadata -__v');

    res.json(successResponse(payments));
});

/**
 * Получение сохраненных методов оплаты пользователя
 */
export const getPaymentMethods = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const uniqueMethods = await Payment.aggregate([
        // Фильтруем по условиям
        {
            $match: {
                userId: new Types.ObjectId(userId),
                status: { $in: ['succeeded', 'waiting_for_capture'] },
                'paymentMethod.saved': true,
            }
        },
        // Сортируем по дате (новые первыми)
        {
            $sort: { createdAt: -1 }
        },
        // Группируем по paymentMethod.id
        {
            $group: {
                _id: '$paymentMethod.id',
                paymentMethod: { $first: '$paymentMethod' },
                addedAt: { $first: '$createdAt' }
            }
        },
        // Формируем финальную структуру
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: ['$paymentMethod', { addedAt: '$addedAt' }]
                }
            }
        },
        // Сортируем результат по дате добавления
        {
            $sort: { addedAt: -1 }
        }
    ]);

    res.json(successResponse(uniqueMethods));
});

/**
 * Удаление сохраненного метода оплаты
 */
export const deletePaymentMethod = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const {paymentMethodId} = req.params;

    const payment = await Payment.findOne({
        userId,
        'paymentMethod.id': paymentMethodId,
    });

    if (!payment) {
        throw new AppError('Метод оплаты не найден', 404);
    }

    await Payment.updateMany(
        {userId, 'paymentMethod.id': paymentMethodId},
        {'paymentMethod.saved': false}
    );

    const user = await User.findById(userId);
    if (user?.subscription?.paymentMethodId === paymentMethodId) {
        await User.findByIdAndUpdate(userId, {
            'subscription.autoRenew': false,
            $unset: {'subscription.paymentMethodId': 1},
        });
    }

    res.json(successResponse({message: 'Метод оплаты удален'}));
});

/**
 * Активация Premium подписки для пользователя
 */
async function activatePremiumSubscription(userId: string, plan: SubscriptionPlan) {
    try {
        const expiresAt = calculateExpiryDate(plan);

        await User.findByIdAndUpdate(userId, {
            accountType: 'paid',
            subscription: {
                plan,
                expiresAt,
            },
        });

        console.log(`Premium subscription activated for user ${userId} until ${expiresAt}`);
    } catch (error) {
        console.error('Error activating premium subscription:', error);
        throw error;
    }
}

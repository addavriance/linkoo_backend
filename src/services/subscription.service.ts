import {User} from '@/models/User';
import {Payment} from '@/models/Payment';
import {chargeSubscription} from '@/controllers/subscription.controller';
import { pollImmediate, delay } from '@/utils/polling';
import {DAY, HOUR} from "@/constants";


export const renewSubscriptions = async (): Promise<void> => {
    console.log('🔄 Starting subscription renewal job...');

    try {
        const threeDaysFromNow = new Date(Date.now() + 3 * DAY);
        const now = new Date();

        const expiringUsers = await User.find({
            accountType: 'paid',
            'subscription.expiresAt': {
                $gte: now,
                $lte: threeDaysFromNow,
            },
            'subscription.autoRenew': {$ne: false},
        });

        console.log(`Found ${expiringUsers.length} subscriptions to renew`);

        for (const user of expiringUsers) {
            try {
                const lastPayment = await Payment.findOne({
                    userId: user._id,
                    status: 'succeeded',
                    'metadata.payment_method_id': {$exists: true},
                }).sort({createdAt: -1});

                if (!lastPayment || !lastPayment.metadata?.payment_method_id) {
                    console.log(`⚠User ${user._id} has no saved payment method, skipping`);
                    // TODO: отправить email о необходимости обновить платежные данные
                    continue;
                }

                const plan = user.subscription?.plan || 'monthly';
                const amount = plan === 'yearly' ? 2870 : 299;

                console.log(`Charging user ${user._id} for ${plan} subscription (${amount}₽)`);

                // Списываем деньги
                const success = await chargeSubscription(
                    user._id.toString(),
                    lastPayment.metadata.payment_method_id,
                    amount,
                    plan as 'monthly' | 'yearly'
                );

                if (success) {
                    console.log(`Successfully renewed subscription for user ${user._id}`);
                } else {
                    console.log(`Failed to renew subscription for user ${user._id}`);
                    // TODO: отправить email об ошибке автоплатежа
                }
            } catch (error) {
                console.error(`Error renewing subscription for user ${user._id}:`, error);
                // Продолжаем обработку других пользователей
            }
        }

        console.log('Subscription renewal job completed');
    } catch (error) {
        console.error('Subscription renewal job failed:', error);
    }
}

/**
 * Отменяет истекающие подписки (для тех, кто не оплатил)
 */
export const expireSubscriptions = async (): Promise<void> => {
    console.log('Starting subscription expiration job...');

    try {
        const now = new Date();

        const result = await User.updateMany(
            {
                accountType: 'paid',
                'subscription.expiresAt': {$lt: now},
            },
            {
                accountType: 'free',
                $unset: {subscription: 1},
            }
        );

        console.log(`Expired ${result.modifiedCount} subscriptions`);
    } catch (error) {
        console.error('Subscription expiration job failed:', error);
    }
}

/**
 * Запускает оба джоба подписок с задержкой
 */
export const runSubscriptionJobs = async (): Promise<void> => {
    try {
        // Сначала продление подписок (как в 00:00)
        await renewSubscriptions();

        // Ждем 1 час перед отменой неоплаченных (как в 01:00)
        await delay(HOUR);

        await expireSubscriptions();
    } catch (error) {
        console.error('Subscription jobs failed:', error);
    }
}

export const runSubscriptionJobsImmediate = async (): Promise<void> => {
    try {
        await renewSubscriptions();
        await expireSubscriptions();
    } catch (error) {
        console.error('Subscription jobs failed:', error);
    }
}

export const startSubscriptionPolling = (intervalMs: number = 24 * HOUR): void => {
    console.log('Subscription service started');

    pollImmediate(runSubscriptionJobs, intervalMs);
}

export const startSimpleSubscriptionPolling = (intervalMs: number = 24 * HOUR): void => {
    pollImmediate(runSubscriptionJobsImmediate, intervalMs);
}

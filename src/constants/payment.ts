import {DAY} from "./common";

export const SUBSCRIPTION_PLANS = {
    monthly: {
        name: 'Месячная подписка',
        price: 299,
        duration: 30 * DAY,
        description: 'Linkoo Premium - Месячная подписка',
    },
    yearly: {
        name: 'Годовая подписка',
        price: 2870,
        duration: 365 * DAY,
        description: 'Linkoo Premium - Годовая подписка',
        discount: 720,
    },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

export function getPlanInfo(plan: SubscriptionPlan) {
    return SUBSCRIPTION_PLANS[plan];
}

export function calculateExpiryDate(plan: SubscriptionPlan, fromDate: Date = new Date()): Date {
    const planInfo = SUBSCRIPTION_PLANS[plan];
    return new Date(fromDate.getTime() + planInfo.duration);
}

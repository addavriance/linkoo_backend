import {z} from 'zod';

export const createPaymentSchema = z.object({
    body: z.object({
        amount: z.number().positive('Сумма должна быть положительной'),
        description: z.string().max(128).optional(),
        metadata: z
            .object({
                plan: z.enum(['monthly', 'yearly']).optional(),
            })
            .optional(),
    }),
});

export const getPaymentSchema = z.object({
    params: z.object({
        paymentId: z.string().uuid('Некорректный ID платежа'),
    }),
});

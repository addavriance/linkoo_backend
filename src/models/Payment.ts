import mongoose, {Schema, Document, model, Model} from 'mongoose';

export interface IPaymentMethod {
    id: string;
    type: string;
    saved: boolean;
    status?: string;
    title?: string;
    card?: {
        first6: string;
        last4: string;
        expiry_year: string;
        expiry_month: string;
        card_type: string;
        issuer_country?: string;
    };
}

const PaymentMethodSchema = new Schema({
    id: { type: String, required: false },
    type: { type: String, required: false },
    saved: { type: Boolean, default: false },
    status: String,
    title: String,
    card: {
        first6: String,
        last4: String,
        expiry_year: String,
        expiry_month: String,
        card_type: String,
        issuer_country: String,
    },
}, { _id: false });

export interface IPayment extends Document {
    _id: mongoose.Types.ObjectId;
    idempotenceKey: string; // Наш внутренний ключ (UUID)
    paymentId?: string; // ID платежа из ЮKassa (заполняется после ответа)
    userId: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
    paid: boolean;
    plan?: 'monthly' | 'yearly';
    description?: string;
    paymentMethod?: IPaymentMethod; // Сохраненный метод оплаты
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPaymentModel extends Model<IPayment> {}

const PaymentSchema: Schema<IPayment, IPaymentModel> = new Schema<IPayment, IPaymentModel>(
    {
        idempotenceKey: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        paymentId: {
            type: String,
            unique: true,
            sparse: true, // Позволяет null значения
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'RUB',
        },
        status: {
            type: String,
            enum: ['pending', 'waiting_for_capture', 'succeeded', 'canceled'],
            required: true,
        },
        paid: {
            type: Boolean,
            default: false,
        },
        plan: {
            type: String,
            enum: ['monthly', 'yearly'],
        },
        description: {
            type: String,
        },
        paymentMethod: PaymentMethodSchema,
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

PaymentSchema.index({userId: 1, createdAt: -1});
PaymentSchema.index({status: 1});

export const Payment = model<IPayment, IPaymentModel>('Payment', PaymentSchema);

import mongoose, {Schema, Document, Model} from 'mongoose';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface IViewEvent {
    timestamp: Date;
    country?: string;  // 2-letter ISO code from CF-IPCountry
    device?: DeviceType;
    browser?: string;
    os?: string;
    referer?: string;
}

export type InteractionType =
    | 'social_click'
    | 'contact_save'
    | 'share'
    | 'website_click'
    | 'email_click'
    | 'phone_click';

export interface IInteractionEvent {
    timestamp: Date;
    type: InteractionType;
    platform?: string; // For social_click: 'telegram', 'instagram', etc.
    device?: DeviceType;
    country?: string;
}

export interface ICardAnalytics extends Document {
    cardId: mongoose.Types.ObjectId;
    views: IViewEvent[];
    interactions: IInteractionEvent[];
}

export interface ICardAnalyticsModel extends Model<ICardAnalytics> {}

const ViewEventSchema = new Schema<IViewEvent>(
    {
        timestamp: {type: Date, default: Date.now, index: true},
        country: {type: String, maxlength: 2},
        device: {type: String, enum: ['mobile', 'tablet', 'desktop']},
        browser: {type: String, maxlength: 50},
        os: {type: String, maxlength: 50},
        referer: {type: String, maxlength: 500},
    },
    {_id: false}
);

const InteractionEventSchema = new Schema<IInteractionEvent>(
    {
        timestamp: {type: Date, default: Date.now},
        type: {
            type: String,
            required: true,
            enum: ['social_click', 'contact_save', 'share', 'website_click', 'email_click', 'phone_click'],
        },
        platform: {type: String, maxlength: 50},
        device: {type: String, enum: ['mobile', 'tablet', 'desktop']},
        country: {type: String, maxlength: 2},
    },
    {_id: false}
);

const CardAnalyticsSchema = new Schema<ICardAnalytics, ICardAnalyticsModel>(
    {
        cardId: {
            type: Schema.Types.ObjectId,
            ref: 'Card',
            required: true,
            unique: true,
            index: true,
        },
        views: {
            type: [ViewEventSchema],
            default: [],
        },
        interactions: {
            type: [InteractionEventSchema],
            default: [],
        },
    },
    {timestamps: true}
);

export const CardAnalytics = mongoose.model<ICardAnalytics, ICardAnalyticsModel>(
    'CardAnalytics',
    CardAnalyticsSchema
);

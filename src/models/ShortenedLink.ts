import mongoose, {Schema, Document, Model} from 'mongoose';
import {LinkTargetType} from '@/types';

export interface IShortenedLink extends Document {
    _id: mongoose.Types.ObjectId;

    userId?: mongoose.Types.ObjectId;

    targetType: LinkTargetType;
    rawData?: string; // base64 (будет содержать magic bytes для валидации?)
    cardId?: mongoose.Types.ObjectId;

    slug: string;

    // Custom subdomain (paid feature: username.linkoo.dev)
    subdomain?: string;

    isActive: boolean;
    expiresAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

export interface IShortenedLinkModel extends Model<IShortenedLink, IShortenedLinkModel> {}

const ShortenedLinkSchema: Schema<IShortenedLink, IShortenedLinkModel> = new Schema<IShortenedLink, IShortenedLinkModel>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        targetType: {
            type: String,
            required: true,
            enum: ['url', 'card'],
        },
        rawData: {
            type: String,
            trim: true,
        },
        cardId: {
            type: Schema.Types.ObjectId,
            ref: 'Card',
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            minlength: 3,
            maxlength: 50,
        },
        subdomain: {
            type: String,
            lowercase: true,
            trim: true,
            sparse: true,
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        expiresAt: Date,
    },
    {
        timestamps: true,
    }
);

ShortenedLinkSchema.index(
    {subdomain: 1, slug: 1},
    {unique: true, sparse: true}
);

ShortenedLinkSchema.index({slug: 1, isActive: 1});

ShortenedLinkSchema.index({userId: 1, createdAt: -1});

ShortenedLinkSchema.pre('validate', function (next) {
    if (this.targetType === 'url' && !this.rawData) {
        next(new Error('rawData is required when targetType is url'));
    } else if (this.targetType === 'card' && !this.cardId) {
        next(new Error('cardId is required when targetType is card'));
    } else {
        next();
    }
});

export const ShortenedLink = mongoose.model<IShortenedLink, IShortenedLinkModel>(
    'ShortenedLink',
    ShortenedLinkSchema
);

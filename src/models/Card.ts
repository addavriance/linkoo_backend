import mongoose, {Schema, Document, Model} from 'mongoose';
import {SocialPlatform} from '@/types';

export interface ISocial {
    platform: SocialPlatform;
    link: string;
}

export interface ICustomTheme {
    background: string;
    textColor: string;
    accentColor: string;
    backdrop?: string;
    border?: string;
}

export interface IVisibilitySettings {
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
}

export interface ICard extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;

    name: string;
    title?: string;
    description?: string;

    email?: string;
    phone?: string;
    website?: string;

    company?: string;
    location?: string;

    avatar?: string;

    socials: ISocial[];

    theme: string;
    customTheme?: ICustomTheme;

    visibility: IVisibilitySettings;

    subdomain?: string;

    isActive: boolean;
    isPublic: boolean;

    viewCount: number;
    lastViewedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const SocialSchema = new Schema<ISocial>(
    {
        platform: {
            type: String,
            required: true,
            enum: [
                'telegram',
                'whatsapp',
                'instagram',
                'youtube',
                'linkedin',
                'twitter',
                'facebook',
                'github',
                'tiktok',
                'discord',
                'vk',
                'custom',
            ],
        },
        link: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {_id: false}
);

const CustomThemeSchema = new Schema<ICustomTheme>(
    {
        background: {type: String, required: true},
        textColor: {type: String, required: true},
        accentColor: {type: String, required: true},
        backdrop: {type: String},
        border: {type: String},
    },
    {_id: false}
);

const VisibilitySchema = new Schema<IVisibilitySettings>(
    {
        showEmail: {type: Boolean, default: true},
        showPhone: {type: Boolean, default: true},
        showLocation: {type: Boolean, default: true},
    },
    {_id: false}
);

export interface ICardModel extends Model<ICard> {}

const CardSchema: Schema<ICard, ICardModel> = new Schema<ICard, ICardModel>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        title: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
        phone: {
            type: String,
            trim: true,
            maxlength: 20,
        },
        website: {
            type: String,
            trim: true,
        },
        company: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        location: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        avatar: {
            type: String,
            trim: true,
        },
        socials: {
            type: [SocialSchema],
            validate: {
                validator: function (v: ISocial[]) {
                    return v.length <= 12;
                },
                message: 'Maximum 12 social links allowed',
            },
            default: [],
        },
        theme: {
            type: String,
            default: 'light_minimal',
        },
        customTheme: CustomThemeSchema,
        visibility: {
            type: VisibilitySchema,
            default: () => ({
                showEmail: true,
                showPhone: true,
                showLocation: true,
            }),
        },
        subdomain: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isPublic: {
            type: Boolean,
            default: true,
        },
        viewCount: {
            type: Number,
            default: 0,
        },
        lastViewedAt: Date,
    },
    {
        timestamps: true,
    }
);

CardSchema.index({userId: 1, isActive: 1});

CardSchema.index({isPublic: 1, isActive: 1});

export const Card = mongoose.model<ICard, ICardModel>('Card', CardSchema);

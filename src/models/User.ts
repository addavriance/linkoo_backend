import mongoose, {Schema, Document, model, Model} from 'mongoose';
import {OAuthProvider, AccountType} from '@/types';

export interface IUserProfile {
    name: string;
    avatar?: string;
    locale?: string;
}

export interface ISubscription {
    plan: string;
    expiresAt: Date;
    stripeCustomerId?: string;
    autoRenew?: boolean;
    paymentMethodId?: string;
}

export interface IUserSettings {
    emailNotifications: boolean;
    language: string;
}

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    phone: string;
    provider: OAuthProvider;
    providerId: string;
    accountType: AccountType;
    profile: IUserProfile;
    subscription?: ISubscription;
    settings: IUserSettings;
    lastLoginAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
    {
        name: {type: String, required: true, trim: true},
        avatar: {type: String},
        locale: {type: String, default: 'ru'},
    },
    {_id: false}
);

const SubscriptionSchema = new Schema<ISubscription>(
    {
        plan: {type: String, required: true},
        expiresAt: {type: Date, required: true},
        stripeCustomerId: {type: String},
    },
    {_id: false}
);

const UserSettingsSchema = new Schema<IUserSettings>(
    {
        emailNotifications: {type: Boolean, default: true},
        language: {type: String, default: 'ru'},
    },
    {_id: false}
);

export interface IUserModel extends Model<IUser> {}

const UserSchema: Schema<IUser, IUserModel> = new Schema<IUser, IUserModel>(
    {
        email: {
            type: String,
            required: false,
            lowercase: true,
            trim: true,
            index: true,
        },
        phone: {
            type: String,
            required: false,
            lowercase: true,
            trim: true,
            index: true,
        },
        provider: {
            type: String,
            required: true,
            enum: ['google', 'vk', 'discord', 'github', 'max'],
        },
        providerId: {
            type: String,
            required: true,
        },
        accountType: {
            type: String,
            enum: ['free', 'paid'],
            default: 'free',
        },
        profile: {
            type: UserProfileSchema,
            required: true,
        },
        subscription: SubscriptionSchema,
        settings: {
            type: UserSettingsSchema,
            default: () => ({
                emailNotifications: true,
                language: 'ru',
            }),
        },
        lastLoginAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

UserSchema.index({provider: 1, providerId: 1}, {unique: true});

export const User = model<IUser, IUserModel>('User', UserSchema);

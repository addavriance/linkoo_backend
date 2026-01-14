import mongoose, {Schema, Document, Model} from 'mongoose';

export interface IRefreshToken extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    token: string;
    deviceInfo?: string;
    ipAddress?: string;
    expiresAt: Date;
    isRevoked: boolean;
    createdAt: Date;
}

export interface IRefreshTokenModel extends Model<IRefreshToken> {
}

const RefreshTokenSchema: Schema<IRefreshToken, IRefreshTokenModel> = new Schema<IRefreshToken, IRefreshTokenModel>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        deviceInfo: String,
        ipAddress: String,
        expiresAt: {
            type: Date,
            required: true,
        },
        isRevoked: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: {createdAt: true, updatedAt: false},
    }
);

RefreshTokenSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

RefreshTokenSchema.index({token: 1, isRevoked: 1});

export const RefreshToken = mongoose.model<IRefreshToken, IRefreshTokenModel>(
    'RefreshToken',
    RefreshTokenSchema
);

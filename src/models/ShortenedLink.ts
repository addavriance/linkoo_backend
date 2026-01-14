import mongoose, { Schema, Document } from 'mongoose';
import { LinkTargetType } from '../types';

export interface IClickAnalytics {
  timestamp: Date;
  userAgent?: string;
  referer?: string;
  country?: string;
  city?: string;
}

export interface IShortenedLink extends Document {
  _id: mongoose.Types.ObjectId;

  // Owner (optional - anonymous links allowed)
  userId?: mongoose.Types.ObjectId;

  // Link target - either external URL or card reference
  targetType: LinkTargetType;
  originalUrl?: string;
  cardId?: mongoose.Types.ObjectId;

  // Slug - the short code (e.g., "abc123")
  slug: string;

  // Custom subdomain (paid feature: username.linkoo.dev)
  subdomain?: string;

  // Analytics
  clickCount: number;
  clicks?: IClickAnalytics[];

  // Status
  isActive: boolean;
  expiresAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ClickAnalyticsSchema = new Schema<IClickAnalytics>(
  {
    timestamp: { type: Date, default: Date.now },
    userAgent: String,
    referer: String,
    country: String,
    city: String,
  },
  { _id: false }
);

const ShortenedLinkSchema = new Schema<IShortenedLink>(
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
    originalUrl: {
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
    clickCount: {
      type: Number,
      default: 0,
    },
    clicks: [ClickAnalyticsSchema],
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

// Unique index for subdomain + slug combination
ShortenedLinkSchema.index(
  { subdomain: 1, slug: 1 },
  { unique: true, sparse: true }
);

// Index for slug lookups (main redirect route)
ShortenedLinkSchema.index({ slug: 1, isActive: 1 });

// Index for user's links
ShortenedLinkSchema.index({ userId: 1, createdAt: -1 });

// Validation: either originalUrl or cardId must be provided
ShortenedLinkSchema.pre('validate', function (next) {
  if (this.targetType === 'url' && !this.originalUrl) {
    next(new Error('originalUrl is required when targetType is url'));
  } else if (this.targetType === 'card' && !this.cardId) {
    next(new Error('cardId is required when targetType is card'));
  } else {
    next();
  }
});

export const ShortenedLink = mongoose.model<IShortenedLink>(
  'ShortenedLink',
  ShortenedLinkSchema
);

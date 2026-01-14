import mongoose, { Schema, Document } from 'mongoose';
import { SocialPlatform } from '../types';

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

  // Basic info
  name: string;
  title?: string;
  description?: string;

  // Contact info
  email?: string;
  phone?: string;
  website?: string;

  // Professional info
  company?: string;
  location?: string;

  // Media
  avatar?: string;

  // Social links (up to 12 platforms)
  socials: ISocial[];

  // Theme
  theme: string;
  customTheme?: ICustomTheme;

  // Visibility
  visibility: IVisibilitySettings;

  // Status
  isActive: boolean;
  isPublic: boolean;

  // Analytics
  viewCount: number;
  lastViewedAt?: Date;

  // Timestamps
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
  { _id: false }
);

const CustomThemeSchema = new Schema<ICustomTheme>(
  {
    background: { type: String, required: true },
    textColor: { type: String, required: true },
    accentColor: { type: String, required: true },
    backdrop: { type: String },
    border: { type: String },
  },
  { _id: false }
);

const VisibilitySchema = new Schema<IVisibilitySettings>(
  {
    showEmail: { type: Boolean, default: true },
    showPhone: { type: Boolean, default: true },
    showLocation: { type: Boolean, default: true },
  },
  { _id: false }
);

const CardSchema = new Schema<ICard>(
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

// Index for user's cards lookup
CardSchema.index({ userId: 1, isActive: 1 });

// Index for public card discovery
CardSchema.index({ isPublic: 1, isActive: 1 });

export const Card = mongoose.model<ICard>('Card', CardSchema);

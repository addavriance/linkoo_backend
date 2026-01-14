import { ShortenedLink, IShortenedLink, IClickAnalytics } from '../models/ShortenedLink';
import { Card } from '../models/Card';
import { CreateLinkInput, UpdateLinkInput } from '../validators/link.validator';
import {
  AppError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../utils/errors';
import { createSlug, isReservedSlug } from '../utils/slugGenerator';

export const createLink = async (
  data: CreateLinkInput,
  userId?: string
): Promise<IShortenedLink> => {
  // If custom slug provided, check if it's available
  let slug = data.customSlug;
  if (slug) {
    if (isReservedSlug(slug)) {
      throw new AppError('This slug is reserved', 400);
    }

    const existing = await ShortenedLink.findOne({ slug });
    if (existing) {
      throw new ConflictError('This slug is already taken');
    }
  } else {
    // Generate unique slug
    slug = createSlug();
    while (await ShortenedLink.findOne({ slug })) {
      slug = createSlug();
    }
  }

  // If linking to a card, verify the card exists
  if (data.targetType === 'card' && data.cardId) {
    const card = await Card.findOne({ _id: data.cardId, isActive: true });
    if (!card) {
      throw new NotFoundError('Card');
    }
  }

  const link = await ShortenedLink.create({
    userId,
    targetType: data.targetType,
    originalUrl: data.originalUrl,
    cardId: data.cardId,
    slug,
    subdomain: data.subdomain,
  });

  return link;
};

export const getLinkBySlug = async (
  slug: string,
  subdomain?: string
): Promise<IShortenedLink> => {
  const query: any = { slug, isActive: true };
  if (subdomain) {
    query.subdomain = subdomain;
  }

  const link = await ShortenedLink.findOne(query);
  if (!link) {
    throw new NotFoundError('Link');
  }

  // Check expiration
  if (link.expiresAt && link.expiresAt < new Date()) {
    throw new AppError('This link has expired', 410);
  }

  return link;
};

export const getUserLinks = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ links: IShortenedLink[]; total: number }> => {
  const skip = (page - 1) * limit;

  const [links, total] = await Promise.all([
    ShortenedLink.find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ShortenedLink.countDocuments({ userId, isActive: true }),
  ]);

  return { links, total };
};

export const updateLink = async (
  slug: string,
  userId: string,
  data: UpdateLinkInput
): Promise<IShortenedLink> => {
  const link = await ShortenedLink.findOne({ slug, isActive: true });
  if (!link) {
    throw new NotFoundError('Link');
  }

  // Check ownership
  if (!link.userId || link.userId.toString() !== userId) {
    throw new ForbiddenError('You can only edit your own links');
  }

  // If changing slug, check availability
  if (data.customSlug && data.customSlug !== link.slug) {
    if (isReservedSlug(data.customSlug)) {
      throw new AppError('This slug is reserved', 400);
    }

    const existing = await ShortenedLink.findOne({ slug: data.customSlug });
    if (existing) {
      throw new ConflictError('This slug is already taken');
    }

    link.slug = data.customSlug;
  }

  if (typeof data.isActive === 'boolean') {
    link.isActive = data.isActive;
  }

  await link.save();
  return link;
};

export const deleteLink = async (
  slug: string,
  userId: string
): Promise<void> => {
  const link = await ShortenedLink.findOne({ slug, isActive: true });
  if (!link) {
    throw new NotFoundError('Link');
  }

  // Check ownership
  if (!link.userId || link.userId.toString() !== userId) {
    throw new ForbiddenError('You can only delete your own links');
  }

  // Soft delete
  link.isActive = false;
  await link.save();
};

export const trackClick = async (
  slug: string,
  analytics: Partial<IClickAnalytics>
): Promise<void> => {
  await ShortenedLink.updateOne(
    { slug, isActive: true },
    {
      $inc: { clickCount: 1 },
      $push: {
        clicks: {
          $each: [{ timestamp: new Date(), ...analytics }],
          $slice: -1000, // Keep only last 1000 clicks
        },
      },
    }
  );
};

export const getLinkStats = async (
  slug: string,
  userId: string
): Promise<{
  clickCount: number;
  recentClicks: IClickAnalytics[];
  createdAt: Date;
}> => {
  const link = await ShortenedLink.findOne({ slug, isActive: true });
  if (!link) {
    throw new NotFoundError('Link');
  }

  // Check ownership for detailed stats
  if (!link.userId || link.userId.toString() !== userId) {
    throw new ForbiddenError('You can only view stats for your own links');
  }

  return {
    clickCount: link.clickCount,
    recentClicks: link.clicks?.slice(-100) || [],
    createdAt: link.createdAt,
  };
};

export const getRedirectTarget = async (
  slug: string,
  subdomain?: string
): Promise<string> => {
  const link = await getLinkBySlug(slug, subdomain);

  if (link.targetType === 'url' && link.originalUrl) {
    return link.originalUrl;
  }

  if (link.targetType === 'card' && link.cardId) {
    // Return the frontend URL to view the card
    return `/view/${link.cardId}`;
  }

  throw new AppError('Invalid link target', 500);
};

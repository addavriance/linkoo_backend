import {Card, ICard} from '@/models/Card';
import {CreateCardInput, UpdateCardInput} from '@/validators/card.validator';
import {NotFoundError, ForbiddenError, ConflictError} from '@/utils/errors';
import {ShortenedLink} from '@/models/ShortenedLink';
import {createSlug} from '@/utils/slugGenerator';
import {getRedisClient} from '@/config/redis';

const CARD_CACHE_TTL = 60; // секунд

async function cacheGet(key: string): Promise<any | null> {
    try {
        const redis = getRedisClient();
        if (!redis) return null;
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch { return null; }
}

async function cacheSet(key: string, value: any): Promise<void> {
    try {
        const redis = getRedisClient();
        if (!redis) return;
        await redis.set(key, JSON.stringify(value), 'EX', CARD_CACHE_TTL);
    } catch {}
}

async function cacheDel(...keys: string[]): Promise<void> {
    try {
        const redis = getRedisClient();
        if (!redis) return;
        await redis.del(...keys);
    } catch {}
}

export const createCard = async (
    userId: string,
    data: CreateCardInput
): Promise<ICard & { slug?: string }> => {
    const card = await Card.create({
        userId,
        ...data,
        visibility: data.visibility || {
            showEmail: true,
            showPhone: true,
            showLocation: true,
        },
    });

    // Автоматически создаем короткую ссылку для карточки
    let slug = createSlug();
    while (await ShortenedLink.findOne({slug})) {
        slug = createSlug();
    }

    await ShortenedLink.create({
        userId,
        targetType: 'card',
        cardId: card._id,
        slug,
    });

    // Возвращаем карточку со slug
    return Object.assign(card.toObject(), { slug });
};

export const getCardById = async (
    cardId: string,
    requesterId?: string
): Promise<ICard & { slug?: string }> => {
    const cacheKey = `card:id:${cardId}`;
    const isOwnerRequest = !!requesterId;

    if (!isOwnerRequest) {
        const cached = await cacheGet(cacheKey);
        if (cached) return cached;
    }

    const card = await Card.findOne({_id: cardId, isActive: true}) as ICard;

    if (!card) throw new NotFoundError('Card');

    if (!card.isPublic && card.userId.toString() !== requesterId) {
        throw new ForbiddenError('This card is private');
    }

    const link = await ShortenedLink.findOne({cardId: card._id, isActive: true}).select('slug');
    const result = Object.assign(card.toObject(), {slug: link?.slug});

    if (card.isPublic && !isOwnerRequest) {
        await cacheSet(cacheKey, result);
    }

    return result;
};

export const getUserCards = async (
    userId: string,
    page: number = 1,
    limit: number = 10
): Promise<{ cards: Array<ICard & { slug?: string }>; total: number }> => {
    const skip = (page - 1) * limit;

    const [cards, total] = await Promise.all([
        Card.find({userId, isActive: true})
            .sort({createdAt: -1})
            .skip(skip)
            .limit(limit),
        Card.countDocuments({userId, isActive: true}),
    ]);

    // Добавляем slug к каждой карточке
    const cardsWithSlugs = await Promise.all(
        cards.map(async (card) => {
            const link = await ShortenedLink.findOne({
                cardId: card._id,
                isActive: true,
            }).select('slug');

            return Object.assign(card.toObject(), { slug: link?.slug });
        })
    );

    return {cards: cardsWithSlugs, total};
};

export const updateCard = async (
    cardId: string,
    userId: string,
    data: UpdateCardInput
): Promise<ICard> => {
    const card = await Card.findOne({_id: cardId, isActive: true}) as ICard;

    if (!card) throw new NotFoundError('Card');
    if (card.userId.toString() !== userId) throw new ForbiddenError('You can only edit your own cards');

    const oldSubdomain = card.subdomain;
    Object.assign(card, data);
    await card.save();

    await cacheDel(`card:id:${cardId}`);
    if (oldSubdomain) await cacheDel(`card:subdomain:${oldSubdomain}`);
    if (card.subdomain && card.subdomain !== oldSubdomain) await cacheDel(`card:subdomain:${card.subdomain}`);

    return card;
};

export const deleteCard = async (
    cardId: string,
    userId: string
): Promise<void> => {
    const card = await Card.findOne({_id: cardId, isActive: true}) as ICard;

    if (!card) throw new NotFoundError('Card');
    if (card.userId.toString() !== userId) throw new ForbiddenError('You can only delete your own cards');

    card.isActive = false;
    await card.save();

    await cacheDel(`card:id:${cardId}`);
    if (card.subdomain) await cacheDel(`card:subdomain:${card.subdomain}`);
};

export const incrementViewCount = async (cardId: string): Promise<void> => {
    await Card.updateOne(
        {_id: cardId, isActive: true},
        {
            $inc: {viewCount: 1},
            $set: {lastViewedAt: new Date()},
        }
    );
};

export const setCardSubdomain = async (
    cardId: string,
    userId: string,
    subdomain: string
): Promise<ICard & { slug?: string }> => {
    const card = await Card.findOne({_id: cardId, isActive: true}) as ICard;

    if (!card) throw new NotFoundError('Card');
    if (card.userId.toString() !== userId) throw new ForbiddenError('You can only edit your own cards');

    const existing = await Card.findOne({subdomain, _id: {$ne: cardId}});
    if (existing) throw new ConflictError('Этот поддомен уже занят');

    card.subdomain = subdomain;
    await card.save();

    const link = await ShortenedLink.findOne({cardId: card._id, isActive: true}).select('slug');
    return Object.assign(card.toObject(), {slug: link?.slug});
};

export const removeCardSubdomain = async (
    cardId: string,
    userId: string
): Promise<void> => {
    const card = await Card.findOne({_id: cardId, isActive: true});

    if (!card) throw new NotFoundError('Card');
    if (card.userId.toString() !== userId) throw new ForbiddenError('You can only edit your own cards');

    await Card.updateOne({_id: cardId}, {$unset: {subdomain: ''}});
};

export const getCardBySubdomain = async (
    subdomain: string
): Promise<ICard & { slug?: string }> => {
    const cacheKey = `card:subdomain:${subdomain}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const card = await Card.findOne({subdomain, isActive: true}) as ICard;

    if (!card) throw new NotFoundError('Card');
    if (!card.isPublic) throw new ForbiddenError('This card is private');

    const link = await ShortenedLink.findOne({cardId: card._id, isActive: true}).select('slug');
    const result = Object.assign(card.toObject(), {slug: link?.slug});

    await cacheSet(cacheKey, result);
    return result;
};

export const getPublicCards = async (
    page: number = 1,
    limit: number = 20
): Promise<{ cards: ICard[]; total: number }> => {
    const skip = (page - 1) * limit;

    const [cards, total] = await Promise.all([
        Card.find({isPublic: true, isActive: true})
            .select('-email -phone') // Don't expose contact info in listings
            .sort({viewCount: -1, createdAt: -1})
            .skip(skip)
            .limit(limit),
        Card.countDocuments({isPublic: true, isActive: true}),
    ]);

    return {cards, total};
};


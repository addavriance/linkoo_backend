import {Card, ICard} from '../models/Card';
import {CreateCardInput, UpdateCardInput} from '../validators/card.validator';
import {AppError, NotFoundError, ForbiddenError} from '../utils/errors';

export const createCard = async (
    userId: string,
    data: CreateCardInput
): Promise<ICard> => {
    const card = await Card.create({
        userId,
        ...data,
        visibility: data.visibility || {
            showEmail: true,
            showPhone: true,
            showLocation: true,
        },
    });

    return card;
};

export const getCardById = async (
    cardId: string,
    requesterId?: string
): Promise<ICard> => {
    const card = await Card.findOne({
        _id: cardId,
        isActive: true,
    }) as ICard;

    if (!card) {
        throw new NotFoundError('Card');
    }

    if (!card.isPublic && card.userId.toString() !== requesterId) {
        throw new ForbiddenError('This card is private');
    }

    return card;
};

export const getUserCards = async (
    userId: string,
    page: number = 1,
    limit: number = 10
): Promise<{ cards: ICard[]; total: number }> => {
    const skip = (page - 1) * limit;

    const [cards, total] = await Promise.all([
        Card.find({userId, isActive: true})
            .sort({createdAt: -1})
            .skip(skip)
            .limit(limit),
        Card.countDocuments({userId, isActive: true}),
    ]);

    return {cards, total};
};

export const updateCard = async (
    cardId: string,
    userId: string,
    data: UpdateCardInput
): Promise<ICard> => {
    const card = await Card.findOne({
        _id: cardId,
        isActive: true,
    }) as ICard;

    if (!card) {
        throw new NotFoundError('Card');
    }

    if (card.userId.toString() !== userId) {
        throw new ForbiddenError('You can only edit your own cards');
    }

    Object.assign(card, data);
    await card.save();

    return card;
};

export const deleteCard = async (
    cardId: string,
    userId: string
): Promise<void> => {
    const card = await Card.findOne({
        _id: cardId,
        isActive: true,
    }) as ICard;

    if (!card) {
        throw new NotFoundError('Card');
    }

    if (card.userId.toString() !== userId) {
        throw new ForbiddenError('You can only delete your own cards');
    }

    card.isActive = false;
    await card.save();
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

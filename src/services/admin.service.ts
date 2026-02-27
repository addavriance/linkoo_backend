import {User} from '@/models/User';
import {Card} from '@/models/Card';
import {ShortenedLink} from '@/models/ShortenedLink';
import mongoose from 'mongoose';

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getStats = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalUsers, freeUsers, paidUsers, totalCards, activeCards, totalLinks, newUsersRaw, newCardsRaw] =
        await Promise.all([
            User.countDocuments(),
            User.countDocuments({accountType: 'free'}),
            User.countDocuments({accountType: 'paid'}),
            Card.countDocuments(),
            Card.countDocuments({isActive: true}),
            ShortenedLink.countDocuments(),
            User.aggregate([
                {$match: {createdAt: {$gte: thirtyDaysAgo}}},
                {
                    $group: {
                        _id: {$dateToString: {format: '%Y-%m-%d', date: '$createdAt'}},
                        count: {$sum: 1},
                    },
                },
                {$sort: {_id: 1}},
            ]),
            Card.aggregate([
                {$match: {createdAt: {$gte: thirtyDaysAgo}}},
                {
                    $group: {
                        _id: {$dateToString: {format: '%Y-%m-%d', date: '$createdAt'}},
                        count: {$sum: 1},
                    },
                },
                {$sort: {_id: 1}},
            ]),
        ]);

    const newUsersLast30d = newUsersRaw.map((d) => ({date: d._id, count: d.count}));
    const newCardsLast30d = newCardsRaw.map((d) => ({date: d._id, count: d.count}));

    return {totalUsers, freeUsers, paidUsers, totalCards, activeCards, totalLinks, newUsersLast30d, newCardsLast30d};
};

// ─── Users ────────────────────────────────────────────────────────────────────

interface GetUsersOpts {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    accountType?: string;
}

export const getUsers = async ({page, limit, search, role, accountType}: GetUsersOpts) => {
    const filter: Record<string, unknown> = {};

    if (search) {
        filter.$or = [
            {email: {$regex: search, $options: 'i'}},
            {'profile.name': {$regex: search, $options: 'i'}},
        ];
    }
    if (role) filter.role = role;
    if (accountType) filter.accountType = accountType;

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
        User.find(filter)
            .select('-subscription.stripeCustomerId -subscription.paymentMethodId')
            .sort({createdAt: -1})
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(filter),
    ]);

    return {users, total, page, limit};
};

export const updateUser = async (
    id: string,
    data: {role?: string; accountType?: string; isActive?: boolean}
) => {
    const user = await User.findByIdAndUpdate(id, {$set: data}, {new: true}).lean();
    return user;
};

// ─── Cards ────────────────────────────────────────────────────────────────────

interface GetCardsOpts {
    page: number;
    limit: number;
    search?: string;
    userId?: string;
}

export const getCards = async ({page, limit, search, userId}: GetCardsOpts) => {
    const filter: Record<string, unknown> = {};

    if (search) {
        filter.name = {$regex: search, $options: 'i'};
    }
    if (userId && mongoose.isValidObjectId(userId)) {
        filter.userId = new mongoose.Types.ObjectId(userId);
    }

    const skip = (page - 1) * limit;
    const [cards, total] = await Promise.all([
        Card.find(filter)
            .populate('userId', 'profile.name email')
            .select('userId name isActive isPublic viewCount subdomain createdAt')
            .sort({createdAt: -1})
            .skip(skip)
            .limit(limit)
            .lean(),
        Card.countDocuments(filter),
    ]);

    // Подтянуть slug из ShortenedLink для карточек без поддомена
    const cardIds = cards.map((c) => c._id);
    const links = await ShortenedLink.find({
        cardId: {$in: cardIds},
        targetType: 'card',
        isActive: true,
    })
        .select('cardId slug')
        .lean();

    const slugByCardId = new Map(links.map((l) => [l.cardId?.toString(), l.slug]));

    const cardsWithLinks = cards.map((c) => ({
        ...c,
        slug: slugByCardId.get(c._id.toString()),
    }));

    return {cards: cardsWithLinks, total, page, limit};
};

export const updateCard = async (id: string, data: {isActive?: boolean}) => {
    const card = await Card.findByIdAndUpdate(id, {$set: data}, {new: true}).lean();
    return card;
};

// ─── Links ────────────────────────────────────────────────────────────────────

interface GetLinksOpts {
    page: number;
    limit: number;
    search?: string;
    userId?: string;
}

export const getLinks = async ({page, limit, search, userId}: GetLinksOpts) => {
    const filter: Record<string, unknown> = {};

    if (search) {
        filter.slug = {$regex: search, $options: 'i'};
    }
    if (userId && mongoose.isValidObjectId(userId)) {
        filter.userId = new mongoose.Types.ObjectId(userId);
    }

    const skip = (page - 1) * limit;
    const [links, total] = await Promise.all([
        ShortenedLink.find(filter)
            .populate('userId', 'profile.name email')
            .sort({createdAt: -1})
            .skip(skip)
            .limit(limit)
            .lean(),
        ShortenedLink.countDocuments(filter),
    ]);

    return {links, total, page, limit};
};

export const updateLink = async (id: string, data: {isActive?: boolean}) => {
    const link = await ShortenedLink.findByIdAndUpdate(id, {$set: data}, {new: true}).lean();
    return link;
};

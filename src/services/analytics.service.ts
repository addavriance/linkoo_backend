import {CardAnalytics, IViewEvent, IInteractionEvent, InteractionType} from '@/models/CardAnalytics';
import {Card} from '@/models/Card';
import {parseUserAgent} from '@/utils/userAgent';
import {NotFoundError, ForbiddenError} from '@/utils/errors';

// Max events stored per card
const MAX_VIEWS = 10_000;
const MAX_INTERACTIONS = 5_000;

interface ViewInput {
    country?: string;
    userAgent?: string;
    referer?: string;
}

export const recordView = async (cardId: string, input: ViewInput): Promise<void> => {
    const {browser, os, device} = parseUserAgent(input.userAgent);

    const event: IViewEvent = {
        timestamp: new Date(),
        country: input.country && input.country !== 'XX' ? input.country.toUpperCase() : undefined,
        device,
        browser,
        os,
        referer: input.referer?.slice(0, 500),
    };

    await CardAnalytics.updateOne(
        {cardId},
        {
            $push: {
                views: {
                    $each: [event],
                    $slice: -MAX_VIEWS,
                },
            },
        },
        {upsert: true}
    );
};

export const recordInteraction = async (
    cardId: string,
    type: InteractionType,
    input: {platform?: string; userAgent?: string; country?: string}
): Promise<void> => {
    const {device} = parseUserAgent(input.userAgent);

    const event: IInteractionEvent = {
        timestamp: new Date(),
        type,
        platform: input.platform,
        device,
        country: input.country && input.country !== 'XX' ? input.country.toUpperCase() : undefined,
    };

    await CardAnalytics.updateOne(
        {cardId},
        {
            $push: {
                interactions: {
                    $each: [event],
                    $slice: -MAX_INTERACTIONS,
                },
            },
        },
        {upsert: true}
    );
};

// ─── Aggregated queries ─────────────────────────────────────────────────────

function daysAgo(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d;
}

function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function buildDayBuckets(days: number): Record<string, number> {
    const buckets: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        buckets[isoDate(d)] = 0;
    }
    return buckets;
}

// ─── Premium analytics ───────────────────────────────────────────────────────

export const getPremiumAnalytics = async (
    cardId: string,
    userId: string,
    period: '7d' | '30d' = '30d'
): Promise<object> => {
    const card = await Card.findOne({_id: cardId, isActive: true});
    if (!card) throw new NotFoundError('Card');
    if (card.userId.toString() !== userId) throw new ForbiddenError('Access denied');

    const analytics = await CardAnalytics.findOne({cardId});

    const days = period === '7d' ? 7 : 30;
    const since = daysAgo(days);

    if (!analytics) {
        return buildEmptyPremiumResponse(card.viewCount || 0, days);
    }

    // Filter events within period
    const recentViews = analytics.views.filter((v) => v.timestamp >= since);
    const recentInteractions = analytics.interactions.filter((i) => i.timestamp >= since);

    // Time series (views per day)
    const viewBuckets = buildDayBuckets(days);
    for (const v of recentViews) {
        const key = isoDate(v.timestamp);
        if (key in viewBuckets) viewBuckets[key]++;
    }
    const viewsTimeSeries = Object.entries(viewBuckets).map(([date, count]) => ({date, count}));

    // Top countries
    const countryMap: Record<string, number> = {};
    for (const v of recentViews) {
        if (v.country) countryMap[v.country] = (countryMap[v.country] || 0) + 1;
    }
    const topCountries = Object.entries(countryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([country, count]) => ({country, count}));

    // Device breakdown
    const deviceMap: Record<string, number> = {mobile: 0, tablet: 0, desktop: 0};
    for (const v of recentViews) {
        if (v.device) deviceMap[v.device] = (deviceMap[v.device] || 0) + 1;
    }
    const deviceBreakdown = Object.entries(deviceMap).map(([name, value]) => ({name, value}));

    // Browser breakdown
    const browserMap: Record<string, number> = {};
    for (const v of recentViews) {
        if (v.browser) browserMap[v.browser] = (browserMap[v.browser] || 0) + 1;
    }
    const browserBreakdown = Object.entries(browserMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({name, value}));

    // Interaction summary
    const interactionCounts: Record<string, number> = {};
    const socialMap: Record<string, number> = {};
    for (const i of recentInteractions) {
        interactionCounts[i.type] = (interactionCounts[i.type] || 0) + 1;
        if (i.type === 'social_click' && i.platform) {
            socialMap[i.platform] = (socialMap[i.platform] || 0) + 1;
        }
    }
    const socialClicks = Object.entries(socialMap)
        .sort((a, b) => b[1] - a[1])
        .map(([platform, count]) => ({platform, count}));

    // Unique countries count
    const uniqueCountries = new Set(recentViews.filter((v) => v.country).map((v) => v.country)).size;

    // Recent activity (last 20 interactions)
    const recentActivity = [...recentInteractions]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 20)
        .map((i) => ({
            type: i.type,
            platform: i.platform,
            timestamp: i.timestamp,
            country: i.country,
            device: i.device,
        }));

    return {
        viewCount: card.viewCount || 0,
        uniqueCountries,
        contactSaves: interactionCounts['contact_save'] || 0,
        viewsTimeSeries,
        topCountries,
        deviceBreakdown,
        browserBreakdown,
        interactionSummary: {
            contactSaves: interactionCounts['contact_save'] || 0,
            shares: interactionCounts['share'] || 0,
            websiteClicks: interactionCounts['website_click'] || 0,
            emailClicks: interactionCounts['email_click'] || 0,
            phoneClicks: interactionCounts['phone_click'] || 0,
            socialClicks,
        },
        recentActivity,
    };
};

function buildEmptyPremiumResponse(viewCount: number, days: number) {
    const empty = buildDayBuckets(days);
    const timeSeries = Object.entries(empty).map(([date, count]) => ({date, count}));
    return {
        viewCount,
        uniqueCountries: 0,
        contactSaves: 0,
        viewsTimeSeries: timeSeries,
        topCountries: [],
        deviceBreakdown: [
            {name: 'mobile', value: 0},
            {name: 'tablet', value: 0},
            {name: 'desktop', value: 0},
        ],
        browserBreakdown: [],
        interactionSummary: {
            contactSaves: 0,
            shares: 0,
            websiteClicks: 0,
            emailClicks: 0,
            phoneClicks: 0,
            socialClicks: [],
        },
        recentActivity: [],
    };
}

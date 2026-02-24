import {Request, Response} from 'express';
import * as analyticsService from '../services/analytics.service';
import {successResponse} from '@/utils/response';
import {asyncHandler} from '@/utils/asyncHandler';
import {ForbiddenError} from '@/utils/errors';

export const getCardAnalytics = asyncHandler(async (req: Request, res: Response) => {
    if (req.accountType !== 'paid') {
        throw new ForbiddenError('Analytics is a Premium feature');
    }

    const {cardId} = req.params;
    const period = (req.query.period as '7d' | '30d') || '30d';

    const data = await analyticsService.getPremiumAnalytics(cardId, req.userId!, period);
    res.json(successResponse(data));
});

export const trackCardEvent = asyncHandler(async (req: Request, res: Response) => {
    const {cardId} = req.params;
    const {type, platform} = req.body;

    analyticsService.recordInteraction(cardId, type, {
        platform,
        userAgent: req.headers['user-agent'],
        country: req.headers['cf-ipcountry'] as string,
    }).catch(console.error);

    res.json(successResponse({message: 'Event tracked'}));
});
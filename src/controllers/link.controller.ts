import {Request, Response} from 'express';
import * as linkService from '../services/link.service';
import {successResponse, paginatedResponse} from '@/utils/response';
import {env} from '@/config/env';
import {asyncHandler} from '@/utils/asyncHandler';

export const createLink = asyncHandler(async (req: Request, res: Response) => {
    const link = await linkService.createLink(req.body, req.userId);

    const publicLink = {
        slug: link.slug,
        targetType: link.targetType,
        rawData: link.rawData,
        cardId: link.cardId?.toString(),
        subdomain: link.subdomain,
        createdAt: link.createdAt,
    };

    res.status(201).json(successResponse(publicLink));
});

export const getLink = asyncHandler(async (req: Request, res: Response) => {
    const {slug} = req.params;
    const subdomain = req.query.subdomain as string | undefined;

    const link = await linkService.getLinkBySlug(slug, subdomain);

    // Don't expose click details in public response
    const publicLink = {
        slug: link.slug,
        targetType: link.targetType,
        rawData: link.rawData,
        cardId: link.cardId?.toString(),
        subdomain: link.subdomain,
        createdAt: link.createdAt,
    };

    res.json(successResponse(publicLink));
});

export const getMyLinks = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const {links, total} = await linkService.getUserLinks(
        req.userId!,
        page,
        limit
    );

    res.json(paginatedResponse(links, page, limit, total));
});

export const updateLink = asyncHandler(async (req: Request, res: Response) => {
    const {slug} = req.params;
    const link = await linkService.updateLink(slug, req.userId!, req.body);
    res.json(successResponse(link));
});

export const deleteLink = asyncHandler(async (req: Request, res: Response) => {
    const {slug} = req.params;
    await linkService.deleteLink(slug, req.userId!);
    res.json(successResponse({message: 'Link deleted successfully'}));
});

export const getLinkStats = asyncHandler(async (req: Request, res: Response) => {
    const {slug} = req.params;
    const stats = await linkService.getLinkStats(slug, req.userId!);
    res.json(successResponse(stats));
});

export const getLinkByCardId = asyncHandler(async (req: Request, res: Response) => {
    const {cardId} = req.params;
    const link = await linkService.getLinkByCardId(cardId, req.userId!);

    if (!link) {
        return res.json(successResponse({link: null}));
    }

    res.json(successResponse({
        slug: link.slug,
        createdAt: link.createdAt,
    }));
});

export const redirect = asyncHandler(async (req: Request, res: Response) => {
    const {slug} = req.params;

    const host = req.hostname;
    let subdomain: string | undefined;

    const parts = host.split('.');
    if (parts.length > 2 && !['www', 'api'].includes(parts[0])) {
        subdomain = parts[0];
    }

    const target = await linkService.getRedirectTarget(slug, subdomain);

    if (target.isCard) {
        return res.redirect(`${env.FRONTEND_URL}/${slug}`);
    }

    res.redirect(`${env.FRONTEND_URL}/view?card=${target.url}`);
});

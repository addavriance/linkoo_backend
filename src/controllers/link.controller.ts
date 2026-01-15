import {Request, Response, NextFunction} from 'express';
import * as linkService from '../services/link.service';
import {successResponse, paginatedResponse} from '../utils/response';
import {AppError} from '../utils/errors';
import {env} from '../config/env';

export const createLink = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const link = await linkService.createLink(req.body, req.userId);
        res.status(201).json(successResponse(link));
    } catch (error) {
        next(error);
    }
};

export const getLink = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {slug} = req.params;
        const subdomain = req.query.subdomain as string | undefined;

        const link = await linkService.getLinkBySlug(slug, subdomain);

        // Don't expose click details in public response
        const publicLink = {
            slug: link.slug,
            targetType: link.targetType,
            originalUrl: link.originalUrl,
            cardId: link.cardId?.toString(),
            subdomain: link.subdomain,
            createdAt: link.createdAt,
        };

        res.json(successResponse(publicLink));
    } catch (error) {
        next(error);
    }
};

export const getMyLinks = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.userId) {
            throw new AppError('Authentication required', 401);
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const {links, total} = await linkService.getUserLinks(
            req.userId,
            page,
            limit
        );

        res.json(paginatedResponse(links, page, limit, total));
    } catch (error) {
        next(error);
    }
};

export const updateLink = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.userId) {
            throw new AppError('Authentication required', 401);
        }

        const {slug} = req.params;
        const link = await linkService.updateLink(slug, req.userId, req.body);
        res.json(successResponse(link));
    } catch (error) {
        next(error);
    }
};

export const deleteLink = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.userId) {
            throw new AppError('Authentication required', 401);
        }

        const {slug} = req.params;
        await linkService.deleteLink(slug, req.userId);
        res.json(successResponse({message: 'Link deleted successfully'}));
    } catch (error) {
        next(error);
    }
};

export const getLinkStats = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.userId) {
            throw new AppError('Authentication required', 401);
        }

        const {slug} = req.params;
        const stats = await linkService.getLinkStats(slug, req.userId);
        res.json(successResponse(stats));
    } catch (error) {
        next(error);
    }
};

export const getLinkByCardId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.userId) {
            throw new AppError('Authentication required', 401);
        }

        const {cardId} = req.params;
        const link = await linkService.getLinkByCardId(cardId, req.userId);

        if (!link) {
            return res.json(successResponse({link: null}));
        }

        res.json(successResponse({
            slug: link.slug,
            createdAt: link.createdAt,
            clickCount: link.clickCount,
        }));
    } catch (error) {
        next(error);
    }
};

// Redirect handler (только для внешних URL, карточки обрабатываются фронтендом)
export const redirect = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {slug} = req.params;

        // Extract subdomain from host if present
        const host = req.hostname;
        let subdomain: string | undefined;

        // Check if this is a subdomain request (e.g., username.linkoo.dev)
        const parts = host.split('.');
        if (parts.length > 2 && !['www', 'api'].includes(parts[0])) {
            subdomain = parts[0];
        }

        // Track click analytics
        const analytics = {
            userAgent: req.headers['user-agent'],
            referer: req.headers.referer,
        };

        // Track the click asynchronously
        linkService.trackClick(slug, analytics).catch(console.error);

        // Get redirect target
        const target = await linkService.getRedirectTarget(slug, subdomain);

        // Для карточек - редирект на фронтенд, который сам обработает slug
        if (target.isCard) {
            // Если запрос пришел на api.linkoo.dev - редиректим на linkoo.dev
            // Фронтенд сам обработает /:slug и покажет карточку
            return res.redirect(`${env.FRONTEND_URL}/${slug}`);
        }

        // External URL redirect
        res.redirect(target.url);
    } catch (error) {
        next(error);
    }
};

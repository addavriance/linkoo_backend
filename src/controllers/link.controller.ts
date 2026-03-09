import {Request, Response} from 'express';
import * as linkService from '../services/link.service';
import * as cardService from '../services/card.service';
import {successResponse, paginatedResponse} from '@/utils/response';
import {env} from '@/config/env';
import {asyncHandler} from '@/utils/asyncHandler';

function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildOgHtml(card: { name?: string; title?: string; description?: string; avatar?: string; email?: string; website?: string; company?: string }, redirectUrl: string): string {
    const name = card.name ?? 'Linkoo';
    const ogTitle = escapeHtml(name);
    const descriptionParts = [card.title, card.description].filter(Boolean).join(' · ');
    const ogDescription = escapeHtml(descriptionParts || 'Цифровая визитка на Linkoo');
    const ogImage = card.avatar ? escapeHtml(card.avatar) : '';
    const ogUrl = escapeHtml(redirectUrl);

    const jsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name,
        ...(card.title && {jobTitle: card.title}),
        ...(card.description && {description: card.description}),
        ...(card.avatar && {image: card.avatar}),
        ...(card.email && {email: card.email}),
        ...(card.website && {url: card.website}),
        ...(card.company && {worksFor: {'@type': 'Organization', name: card.company}}),
        sameAs: redirectUrl,
    });

    return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>${ogTitle} — Linkoo</title>
<meta name="description" content="${ogDescription}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${ogTitle}">
<meta property="og:description" content="${ogDescription}">
<meta property="og:url" content="${ogUrl}">
<link rel="canonical" href="${ogUrl}">
${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${ogTitle}">
<meta name="twitter:description" content="${ogDescription}">
${ogImage ? `<meta name="twitter:image" content="${ogImage}">` : ''}
<script type="application/ld+json">${jsonLd}</script>
<meta http-equiv="refresh" content="0;url=${ogUrl}">
<script>location.replace(${JSON.stringify(redirectUrl)})</script>
</head>
<body></body>
</html>`;
}

function extractSubdomain(host: string): string | undefined {
    const parts = host.split('.');
    if (parts.length > 2 && !['www', 'api'].includes(parts[0])) {
        return parts[0];
    }
    return undefined;
}

export const createLink = asyncHandler(async (req: Request, res: Response) => {
    const guestId = req.headers['x-user-id']?.toString();
    const link = await linkService.createLink(req.body, req.userId, guestId);

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
    const subdomain = extractSubdomain(req.hostname);

    const target = await linkService.getRedirectTarget(slug, subdomain);

    if (target.isCard && target.cardId) {
        const frontendUrl = `${env.FRONTEND_URL}/${slug}`;
        try {
            const card = await cardService.getCardById(target.cardId);
            return res.send(buildOgHtml(card, frontendUrl));
        } catch {
            return res.redirect(frontendUrl);
        }
    }

    res.redirect(`${env.FRONTEND_URL}/view?card=${target.url}`);
});

export const redirectSubdomain = asyncHandler(async (req: Request, res: Response) => {
    const subdomain = extractSubdomain(req.hostname);

    if (!subdomain) {
        return res.redirect(env.FRONTEND_URL);
    }

    try {
        const card = await cardService.getCardBySubdomain(subdomain);
        const link = await linkService.getLinkByCardId(card._id.toString(), card.userId.toString()).catch(() => null);
        const frontendUrl = link?.slug
            ? `${env.FRONTEND_URL}/${link.slug}`
            : env.FRONTEND_URL;
        return res.send(buildOgHtml(card, frontendUrl));
    } catch {
        return res.redirect(env.FRONTEND_URL);
    }
});

import {Request, Response} from 'express';
import * as cardService from '../services/card.service';
import {successResponse, paginatedResponse} from '@/utils/response';
import {asyncHandler} from '@/utils/asyncHandler';

export const createCard = asyncHandler(async (req: Request, res: Response) => {
    const card = await cardService.createCard(req.userId!, req.body);
    res.status(201).json(successResponse(card));
});

export const getCard = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;
    const card = await cardService.getCardById(id, req.userId);
    res.json(successResponse(card));
});

export const getMyCards = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const {cards, total} = await cardService.getUserCards(req.userId!, page, limit);

    res.json(paginatedResponse(cards, page, limit, total));
});

export const updateCard = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;
    const card = await cardService.updateCard(id, req.userId!, req.body);
    res.json(successResponse(card));
});

export const deleteCard = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;
    await cardService.deleteCard(id, req.userId!);
    res.json(successResponse({message: 'Card deleted successfully'}));
});

export const trackView = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;
    await cardService.incrementViewCount(id);
    res.json(successResponse({message: 'View tracked'}));
});

export const setSubdomain = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;
    const {subdomain} = req.body;
    const card = await cardService.setCardSubdomain(id, req.userId!, subdomain);
    res.json(successResponse(card));
});

export const removeSubdomain = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;
    await cardService.removeCardSubdomain(id, req.userId!);
    res.json(successResponse({message: 'Subdomain removed successfully'}));
});

export const getCardBySubdomain = asyncHandler(async (req: Request, res: Response) => {
    const {subdomain} = req.params;
    const card = await cardService.getCardBySubdomain(subdomain);
    res.json(successResponse(card));
});

export const getPublicCards = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const {cards, total} = await cardService.getPublicCards(page, limit);
    res.json(paginatedResponse(cards, page, limit, total));
});

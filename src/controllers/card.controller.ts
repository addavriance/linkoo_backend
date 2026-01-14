import {Request, Response, NextFunction} from 'express';
import * as cardService from '../services/card.service';
import {successResponse, paginatedResponse} from '../utils/response';
import {AppError} from '../utils/errors';

export const createCard = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.userId) {
            throw new AppError('Authentication required', 401);
        }

        const card = await cardService.createCard(req.userId, req.body);
        res.status(201).json(successResponse(card));
    } catch (error) {
        next(error);
    }
};

export const getCard = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {id} = req.params;
        const card = await cardService.getCardById(id, req.userId);
        res.json(successResponse(card));
    } catch (error) {
        next(error);
    }
};

export const getMyCards = async (
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

        const {cards, total} = await cardService.getUserCards(
            req.userId,
            page,
            limit
        );

        res.json(paginatedResponse(cards, page, limit, total));
    } catch (error) {
        next(error);
    }
};

export const updateCard = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.userId) {
            throw new AppError('Authentication required', 401);
        }

        const {id} = req.params;
        const card = await cardService.updateCard(id, req.userId, req.body);
        res.json(successResponse(card));
    } catch (error) {
        next(error);
    }
};

export const deleteCard = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.userId) {
            throw new AppError('Authentication required', 401);
        }

        const {id} = req.params;
        await cardService.deleteCard(id, req.userId);
        res.json(successResponse({message: 'Card deleted successfully'}));
    } catch (error) {
        next(error);
    }
};

export const trackView = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {id} = req.params;
        await cardService.incrementViewCount(id);
        res.json(successResponse({message: 'View tracked'}));
    } catch (error) {
        next(error);
    }
};

export const getPublicCards = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

        const {cards, total} = await cardService.getPublicCards(page, limit);
        res.json(paginatedResponse(cards, page, limit, total));
    } catch (error) {
        next(error);
    }
};

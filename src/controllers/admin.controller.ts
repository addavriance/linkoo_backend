import {Request, Response} from 'express';
import {asyncHandler} from '@/utils/asyncHandler';
import {successResponse, paginatedResponse} from '@/utils/response';
import * as adminService from '@/services/admin.service';
import {NotFoundError} from '@/utils/errors';

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminService.getStats();
    res.json(successResponse(stats));
});

// ─── Users ────────────────────────────────────────────────────────────────────

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1')));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'))));
    const search = req.query.search ? String(req.query.search) : undefined;
    const role = req.query.role ? String(req.query.role) : undefined;
    const accountType = req.query.accountType ? String(req.query.accountType) : undefined;

    const {users, total} = await adminService.getUsers({page, limit, search, role, accountType});
    res.json(paginatedResponse(users, page, limit, total));
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;
    const {role, accountType, isActive} = req.body;

    const user = await adminService.updateUser(id, {role, accountType, isActive});
    if (!user) throw new NotFoundError('User not found');

    res.json(successResponse(user));
});

// ─── Cards ────────────────────────────────────────────────────────────────────

export const getCards = asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1')));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'))));
    const search = req.query.search ? String(req.query.search) : undefined;
    const userId = req.query.userId ? String(req.query.userId) : undefined;

    const {cards, total} = await adminService.getCards({page, limit, search, userId});
    res.json(paginatedResponse(cards, page, limit, total));
});

export const updateCard = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;
    const {isActive} = req.body;

    const card = await adminService.updateCard(id, {isActive});
    if (!card) throw new NotFoundError('Card not found');

    res.json(successResponse(card));
});

// ─── Links ────────────────────────────────────────────────────────────────────

export const getLinks = asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1')));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'))));
    const search = req.query.search ? String(req.query.search) : undefined;
    const userId = req.query.userId ? String(req.query.userId) : undefined;

    const {links, total} = await adminService.getLinks({page, limit, search, userId});
    res.json(paginatedResponse(links, page, limit, total));
});

export const updateLink = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;
    const {isActive} = req.body;

    const link = await adminService.updateLink(id, {isActive});
    if (!link) throw new NotFoundError('Link not found');

    res.json(successResponse(link));
});

import { Router, Request, Response } from 'express';
import { getFileStream } from '@/services/storage.service';
import { asyncHandler } from '@/utils/asyncHandler';

const router = Router();

const ALLOWED_FOLDERS = ['avatars', 'cards'];

router.get('/:folder/:filename', asyncHandler(async (req: Request, res: Response) => {
    const { folder, filename } = req.params;

    if (!ALLOWED_FOLDERS.includes(folder)) {
        res.status(404).json({ error: 'Not found' });
        return;
    }

    if (filename.includes('..') || filename.includes('/')) {
        res.status(400).json({ error: 'Invalid filename' });
        return;
    }

    const { stream, contentType } = await getFileStream(folder, filename);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    stream.pipe(res);
}));

export default router;

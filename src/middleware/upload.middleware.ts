import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'avatars');

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, {recursive: true});
        }
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${req.userId}-${Date.now()}${ext}`);
    },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Поддерживаются только изображения: JPEG, PNG, WebP, GIF'));
    }
};

export const avatarUpload = multer({
    storage,
    fileFilter,
    limits: {fileSize: 5 * 1024 * 1024}, // 5MB
});

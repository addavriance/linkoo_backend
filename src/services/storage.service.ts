import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { env } from '@/config/env';

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads');

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
    if (!s3Client) {
        s3Client = new S3Client({
            region: 'ru-central1',
            endpoint: 'https://storage.yandexcloud.net',
            credentials: {
                accessKeyId: env.S3_ACCESS_KEY!,
                secretAccessKey: env.S3_SECRET_KEY!,
            },
        });
    }
    return s3Client;
}

function getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const map: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
    };
    return map[ext] || 'application/octet-stream';
}

export async function uploadFile(
    buffer: Buffer,
    filename: string,
    mimetype: string,
    folder: string = 'avatars',
): Promise<string> {
    if (env.NODE_ENV !== 'production') {
        const dir = path.join(UPLOAD_DIR, folder);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, filename), buffer);
        return `${env.API_URL}/images/${folder}/${filename}`;
    }

    await new Upload({
        client: getS3Client(),
        params: {
            Bucket: env.S3_BUCKET!,
            Key: `${folder}/${filename}`,
            Body: buffer,
            ContentType: mimetype,
        },
    }).done();

    return `${env.API_URL}/images/${folder}/${filename}`;
}

export async function deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl.includes('/api/images/')) return;

    const match = fileUrl.match(/\/api\/images\/(.+)$/);
    if (!match) return;

    const key = match[1];

    if (env.NODE_ENV !== 'production') {
        const filePath = path.join(UPLOAD_DIR, key);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return;
    }

    await getS3Client().send(new DeleteObjectCommand({
        Bucket: env.S3_BUCKET!,
        Key: key,
    }));
}

export async function getFileStream(
    folder: string,
    filename: string,
): Promise<{ stream: Readable; contentType: string }> {
    if (env.NODE_ENV !== 'production') {
        const filePath = path.join(UPLOAD_DIR, folder, filename);
        if (!fs.existsSync(filePath)) {
            throw Object.assign(new Error('File not found'), { statusCode: 404 });
        }
        return {
            stream: fs.createReadStream(filePath),
            contentType: getMimeType(filename),
        };
    }

    const response = await getS3Client().send(new GetObjectCommand({
        Bucket: env.S3_BUCKET!,
        Key: `${folder}/${filename}`,
    }));

    return {
        stream: response.Body as Readable,
        contentType: response.ContentType || getMimeType(filename),
    };
}

import request from 'supertest';
import app from '@/app';
import { connectTestDB, disconnectTestDB } from './helpers/db';

beforeAll(async () => {
    await connectTestDB();
});

afterAll(async () => {
    await disconnectTestDB();
});

describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
        const res = await request(app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            status: 'ok',
            environment: 'test',
        });
        expect(res.body.timestamp).toBeDefined();
    });
});

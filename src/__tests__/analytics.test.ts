import request from 'supertest';
import app from '@/app';
import { connectTestDB, disconnectTestDB, clearTestDB } from './helpers/db';
import { createTestUser } from './helpers/auth';

beforeAll(async () => {
    await connectTestDB();
});

afterAll(async () => {
    await disconnectTestDB();
});

afterEach(async () => {
    await clearTestDB();
});

describe('Analytics endpoints', () => {
    describe('POST /api/analytics/:cardId/event', () => {
        it('should return 200 for a valid interaction event', async () => {
            const { accessToken } = await createTestUser({ accountType: 'paid' });

            const cardRes = await request(app)
                .post('/api/cards')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'My Card' });

            const cardId = cardRes.body.data._id;

            const res = await request(app)
                .post(`/api/analytics/${cardId}/event`)
                .send({ type: 'social_click', platform: 'telegram' });

            expect(res.status).toBe(200);
        });

        it('should return 200 even when cardId does not exist (fire-and-forget)', async () => {
            const res = await request(app)
                .post('/api/analytics/000000000000000000000001/event')
                .send({ type: 'share' });

            // The controller is fire-and-forget; always returns 200
            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/analytics/:cardId', () => {
        it('should return 401 without authorization', async () => {
            const res = await request(app).get('/api/analytics/000000000000000000000001');

            expect(res.status).toBe(401);
        });

        it('should return 200 for a paid user accessing their own card analytics', async () => {
            const { accessToken } = await createTestUser({ accountType: 'paid' });

            const cardRes = await request(app)
                .post('/api/cards')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Analytics Card' });

            const cardId = cardRes.body.data._id;

            const res = await request(app)
                .get(`/api/analytics/${cardId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.viewCount).toBeDefined();
        });
    });
});

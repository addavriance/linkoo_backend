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

describe('Auth endpoints', () => {
    describe('GET /api/auth/me', () => {
        it('should return 401 without a token', async () => {
            const res = await request(app).get('/api/auth/me');

            expect(res.status).toBe(401);
        });

        it('should return 200 with a valid token', async () => {
            const { user, accessToken } = await createTestUser();

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.email).toBe(user.email);
        });
    });

    describe('POST /api/auth/refresh', () => {
        it('should return 401 for an invalid refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: 'invalid-token-that-does-not-exist' });

            expect(res.status).toBe(401);
        });

        it('should return 200 and new tokens for a valid refresh token', async () => {
            const { refreshToken } = await createTestUser();

            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken });

            expect(res.status).toBe(200);
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should return 200 when logging out', async () => {
            const { refreshToken } = await createTestUser();

            const res = await request(app)
                .post('/api/auth/logout')
                .send({ refreshToken });

            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/auth/sessions', () => {
        it('should return 200 with active sessions', async () => {
            const { accessToken } = await createTestUser();

            const res = await request(app)
                .get('/api/auth/sessions')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
});

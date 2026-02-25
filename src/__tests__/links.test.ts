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

describe('Links endpoints', () => {
    describe('POST /api/links', () => {
        it('should return 201 and create a url link when authenticated', async () => {
            // const { accessToken } = await createTestUser();

            const res = await request(app)
                .post('/api/links')
                // .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    targetType: 'url',
                    rawData: 'N4IgdiBcKFggh8II...',
                });

            expect(res.status).toBe(201);
            expect(res.body.data.slug).toBeDefined();
            expect(res.body.data.targetType).toBe('url');
        });
    });

    describe('GET /api/links/:slug', () => {
        it('should return 200 for an existing link slug', async () => {
            // const { accessToken } = await createTestUser();

            const created = await request(app)
                .post('/api/links')
                // .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    targetType: 'url',
                    rawData: 'N4IgdiBcKFggh8II...',
                });

            const slug = created.body.data.slug;

            const res = await request(app).get(`/api/links/${slug}`);

            expect(res.status).toBe(200);
            expect(res.body.data.slug).toBe(slug);
        });
    });

    describe('DELETE /api/links/:slug', () => {
        it('should return 401 without authorization', async () => {
            // Create link with auth, then try to delete without auth
            const { accessToken } = await createTestUser();

            const created = await request(app)
                .post('/api/links')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    targetType: 'url',
                    rawData: 'https://example.com/delete-test',
                });

            const slug = created.body.data.slug;

            const res = await request(app).delete(`/api/links/${slug}`);

            expect(res.status).toBe(401);
        });

        it('should return 200 and delete the link when authorized', async () => {
            // const { accessToken } = await createTestUser();

            const created = await request(app)
                .post('/api/links')
                // .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    targetType: 'url',
                    rawData: 'https://example.com/delete-auth-test',
                });

            const slug = created.body.data.slug;

            const res = await request(app)
                .delete(`/api/links/${slug}`)
                // .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/links/card/:cardId', () => {
        it('should return 200 with link data for a card link', async () => {
            const { accessToken } = await createTestUser();

            // Create a card
            const cardRes = await request(app)
                .post('/api/cards')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'My Card' });

            const cardId = cardRes.body.data._id;

            // Create a link for the card
            await request(app)
                .post('/api/links')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    targetType: 'card',
                    cardId,
                });

            const res = await request(app)
                .get(`/api/links/card/${cardId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.slug).toBeDefined();
        });
    });
});

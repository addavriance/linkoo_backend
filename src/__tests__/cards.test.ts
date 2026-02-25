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

const cardPayload = {
    name: 'Test Card',
    title: 'Software Engineer',
    email: 'test@example.com',
};

describe('Cards endpoints', () => {
    describe('GET /api/cards/public', () => {
        it('should return 200 with empty list when no public cards exist', async () => {
            const res = await request(app).get('/api/cards/public');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('POST /api/cards', () => {
        it('should return 401 without authorization', async () => {
            const res = await request(app)
                .post('/api/cards')
                .send(cardPayload);

            expect(res.status).toBe(401);
        });

        it('should return 201 and create a card when authorized', async () => {
            const { accessToken } = await createTestUser();

            const res = await request(app)
                .post('/api/cards')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(cardPayload);

            expect(res.status).toBe(201);
            expect(res.body.data.name).toBe(cardPayload.name);
        });

        it('should return 403 when free user tries to create a second card', async () => {
            const { accessToken } = await createTestUser({ accountType: 'free' });

            // Create first card
            await request(app)
                .post('/api/cards')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(cardPayload);

            // Attempt to create second card
            const res = await request(app)
                .post('/api/cards')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Second Card' });

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/cards/:id', () => {
        it('should return 200 for an existing card', async () => {
            const { accessToken } = await createTestUser();

            const created = await request(app)
                .post('/api/cards')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(cardPayload);

            const cardId = created.body.data._id;

            const res = await request(app).get(`/api/cards/${cardId}`);

            expect(res.status).toBe(200);
            expect(res.body.data._id).toBe(cardId);
        });
    });

    describe('PATCH /api/cards/:id', () => {
        it('should return 200 and update the card', async () => {
            const { accessToken } = await createTestUser();

            const created = await request(app)
                .post('/api/cards')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(cardPayload);

            const cardId = created.body.data._id;

            const res = await request(app)
                .patch(`/api/cards/${cardId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Updated Card Name' });

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Updated Card Name');
        });
    });

    describe('DELETE /api/cards/:id', () => {
        it('should return 200 and delete the card', async () => {
            const { accessToken } = await createTestUser();

            const created = await request(app)
                .post('/api/cards')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(cardPayload);

            const cardId = created.body.data._id;

            const res = await request(app)
                .delete(`/api/cards/${cardId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
        });
    });

    describe('POST /api/cards/:id/view', () => {
        it('should return 200 and track a view', async () => {
            const { accessToken } = await createTestUser();

            const created = await request(app)
                .post('/api/cards')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(cardPayload);

            const cardId = created.body.data._id;

            const res = await request(app).post(`/api/cards/${cardId}/view`);

            expect(res.status).toBe(200);
        });
    });
});

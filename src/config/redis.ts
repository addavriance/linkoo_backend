import Redis from 'ioredis';
import {env} from '@/config/env';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
    return redisClient;
}

export async function connectRedis(): Promise<void> {
    if (!env.REDIS_URL) {
        console.warn('[Redis] REDIS_URL not set, running without Redis');
        return;
    }

    try {
        redisClient = new Redis(env.REDIS_URL, {
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            lazyConnect: true,
        });

        redisClient.on('error', (err) => {
            console.error('[Redis] Connection error:', err.message);
        });

        await redisClient.connect();
        console.log('[Redis] Connected');
    } catch (err) {
        console.error('[Redis] Failed to connect, running without Redis:', err);
        redisClient = null;
    }
}

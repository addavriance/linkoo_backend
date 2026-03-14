import { WebSocket } from 'ws';
import { OneMeAuthSession, UserAgentData } from '@/services/MAXAuth.service';
import {SECOND} from "@/constants";
import {pollImmediate} from "@/utils/polling";

interface SessionData {
    session: OneMeAuthSession;
    createdAt: number;
    closedAt: number | null;
}

const sessionStore = new Map<string, SessionData>();

const SESSION_TTL = 30 * 1000;

export const maxAuthSessions = {
    get: (sessionId: string) => sessionStore.get(sessionId)?.session,
    set: (sessionId: string, session: OneMeAuthSession) => {
        sessionStore.set(sessionId, {
            session,
            createdAt: Date.now(),
            closedAt: null
        });
    },
    delete: (sessionId: string) => sessionStore.delete(sessionId),
    has: (sessionId: string) => sessionStore.has(sessionId),
    size: () => sessionStore.size,
    markClosed: (sessionId: string) => {
        const data = sessionStore.get(sessionId);
        if (data) {
            data.closedAt = Date.now();
            console.log(`[MAX Auth Handler] 🕐 Сессия ${sessionId} помечена как закрытая (будет удалена через ${SESSION_TTL / 1000}с)`);
        }
    }
};


const cleanupExpiredSessions = () => {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, data] of sessionStore.entries()) {
        const isExpiredClosed = data.closedAt && (now - data.closedAt > SESSION_TTL);
        const isStale = !data.closedAt && (now - data.createdAt > SESSION_TTL * 10); // 5 минут для зависших

        if (isExpiredClosed || isStale) {
            sessionStore.delete(sessionId);
            cleanedCount++;
            console.log(`[MAX Auth Handler] 🗑️ Сессия ${sessionId} удалена (${isStale ? 'зависшая' : 'истекла'})`);
        }
    }

    if (cleanedCount > 0) {
        console.log(`[MAX Auth Handler] 🧹 Очищено сессий: ${cleanedCount}, осталось: ${sessionStore.size}`);
    }
};

export const startMaxSessionsCleanup = (intervalMs: number = 30 * SECOND): void => {
    console.log('MAX Auth session cleanup service started');

    pollImmediate(cleanupExpiredSessions, intervalMs);
};

export const handleMaxAuthConnection = (ws: WebSocket) => {
    console.log('[MAX Auth Handler] 🔌 Новое WebSocket соединение');

    const initTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
            console.warn('[MAX Auth Handler] ⏱️ Таймаут ожидания начального сообщения');
            ws.close(1002, 'No initial message received');
        }
    }, 10000);

    ws.once('message', (data) => {
        clearTimeout(initTimeout);

        try {
            const payload = JSON.parse(data.toString());
            console.log('[MAX Auth Handler] 📥 Получен начальный payload:', payload);

            const userAgent: UserAgentData = payload.userAgent || {
                deviceType: 'WEB',
                locale: 'ru-RU',
                deviceLocale: 'ru',
                osVersion: 'macOS',
                deviceName: 'Chrome',
                headerUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                appVersion: '26.2.1',
                screen: '1920x1080 2.0x',
                timezone: 'Europe/Moscow'
            };

            const sessionId = Math.random().toString(36).substring(7);

            const session = new OneMeAuthSession(sessionId, userAgent, ws);
            maxAuthSessions.set(sessionId, session);

            console.log(`[MAX Auth Handler] ✅ Сессия ${sessionId} создана и запущена`);
            session.start();

            ws.on('close', () => {
                maxAuthSessions.markClosed(sessionId);
            });
        } catch (error) {
            console.error('[MAX Auth Handler] ❌ Ошибка парсинга начального сообщения:', error);
            clearTimeout(initTimeout);
            ws.close(1003, 'Invalid initial message');
        }
    });
};

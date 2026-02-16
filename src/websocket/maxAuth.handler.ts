import { WebSocket } from 'ws';
import { OneMeAuthSession, UserAgentData } from '../services/MAXAuth.service';

export const maxAuthSessions = new Map<string, OneMeAuthSession>();

export const handleMaxAuthConnection = (ws: WebSocket) => {
    console.log('[MAX Auth Handler] 🔌 Новое WebSocket соединение');

    ws.once('message', (data) => {
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
                maxAuthSessions.delete(sessionId);
                console.log(`[MAX Auth Handler] 🗑️ Сессия ${sessionId} удалена`);
            });
        } catch (error) {
            console.error('[MAX Auth Handler] ❌ Ошибка парсинга начального сообщения:', error);
            ws.close(1003, 'Invalid initial message');
        }
    });

    const initTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
            console.warn('[MAX Auth Handler] ⏱️ Таймаут ожидания начального сообщения');
            ws.close(1002, 'No initial message received');
        }
    }, 10000);

    ws.on('close', () => {
        clearTimeout(initTimeout);
    });
};
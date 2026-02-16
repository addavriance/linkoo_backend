import { Response } from 'express';
import WebSocket from 'ws';
import {OAuthUserData} from "@/types";

export interface UserAgentData {
    deviceType: string;
    locale: string;
    deviceLocale: string;
    osVersion: string;
    deviceName: string;
    headerUserAgent: string;
    appVersion: string;
    screen: string;
    timezone: string;
}

export interface OneMeMessage<T = any> {
    ver: number;
    cmd: number;
    seq: number;
    opcode: number;
    payload?: T;
}

interface OneMeProfile {
    profileOptions: any[];
    contact: {
        accountStatus: number;
        country: string;
        names: Array<{
            name: string;
            firstName: string;
            lastName: string;
            type: string;
        }>;
        phone: number;
        options: string[];
        updateTime: number;
        id: number;
    };
}

export type OneMeAuthResponse = OneMeMessage<{
    token: string;
    profile: OneMeProfile;
}>

export class OneMeAuthSession {
    private ws: WebSocket | null = null;
    private seq = 0;
    private trackId: string | null = null;
    private pollingInterval: NodeJS.Timeout | null = null;
    private deviceId: string;

    userData?: OAuthUserData;

    constructor(
        private sessionId: string,
        private userAgent: UserAgentData,
        private sseResponse: Response,
    ) {
        this.deviceId = this.generateDeviceId();
        console.log('[MAX Auth] 🚀 Создана новая сессия авторизации');
        console.log('[MAX Auth] SessionID:', sessionId);
        console.log('[MAX Auth] DeviceID:', this.deviceId);

        sseResponse.on('close', () => {
            console.log('[MAX Auth] 📡 SSE соединение закрыто клиентом');
            this.cleanup();
        })
    }

    private generateDeviceId(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private sendSSE(event: string, data: any) {
        const payload =
            `event: ${event}\n` +
            `data: ${JSON.stringify(data)}\n\n`;

        console.log(`[MAX Auth] 📡 Отправка SSE клиенту - событие: "${event}":`, data);
        this.sseResponse.write(payload);

        // Принудительный flush через нативный socket
        if ((this.sseResponse as any).flush) {
            (this.sseResponse as any).flush();
        } else if ((this.sseResponse as any).socket) {
            // Fallback для Express без compression middleware
            (this.sseResponse as any).socket.write('');
        }
    }

    private sendMessage(payload: Partial<OneMeMessage>) {
        const message: OneMeMessage = {
            ver: 11,
            cmd: 0,
            seq: this.seq++,
            opcode: payload.opcode!,
            payload: payload.payload
        };
        console.log(`[MAX Auth] 📤 Отправка сообщения (opcode: ${message.opcode}, seq: ${message.seq}):`, message);
        this.ws?.send(JSON.stringify(message));
    }

    private startPolling() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);

        console.log('[MAX Auth] ⏱️ Запущен polling статуса QR (каждые 5 сек)');
        this.pollingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN && this.trackId) {
                console.log('[MAX Auth] 🔄 Polling статуса QR, trackId:', this.trackId);
                this.sendMessage({
                    opcode: 289,
                    payload: { trackId: this.trackId }
                });
            } else {
                console.log('[MAX Auth] ⚠️ Пропущен polling: readyState =', this.ws?.readyState, ', trackId =', this.trackId);
            }
        }, 5000);
    }

    private handleMessage(data: OneMeMessage) {
        console.log(`[MAX Auth] 📥 Получено сообщение (opcode: ${data.opcode}, cmd: ${data.cmd}):`, JSON.stringify(data, null, 2));

        if (data.opcode === 6 && data.cmd === 1) {
            console.log('[MAX Auth] ✅ Handshake успешен, запрашиваем QR-код');
            this.sendSSE('status', { message: 'Получаем QR-код...' });
            this.sendMessage({ opcode: 288 });
        }

        if (data.opcode === 288 && data.payload) {
            console.log('[MAX Auth] ✅ QR-код получен:', data.payload.qrLink);
            this.trackId = data.payload.trackId;

            this.sendSSE('qr', {
                qrLink: data.payload.qrLink,
                trackId: this.trackId,
                expiresAt: data.payload.expiresAt
            });

            this.sendMessage({
                opcode: 5,
                payload: {
                    events: [
                        {
                            type: 'NAV',
                            userId: -1,
                            time: Date.now(),
                            sessionId: Date.now() - 100,
                            event: 'COLD_START',
                            params: { action_id: 1, screen_to: 49 }
                        },
                        {
                            event: 'LOG',
                            type: 'AUTH_QR',
                            time: Date.now(),
                            userId: -1,
                            sessionId: Date.now() - 100,
                            params: {
                                qr_ts_ms: data.payload.expiresAt,
                                action: 'web_qr_view',
                                platform: 'web',
                                device_id: this.deviceId,
                                action_id: 1
                            }
                        }
                    ]
                }
            });

            this.startPolling();
        }

        if (data.opcode === 289 && data.payload?.status?.loginAvailable) {
            console.log('[MAX Auth] ✅ QR отсканирован, запрашиваем токен');
            this.sendSSE('status', { message: 'QR отсканирован! Получаем токен...' });

            if (this.pollingInterval) clearInterval(this.pollingInterval);

            this.sendMessage({
                opcode: 291,
                payload: { trackId: this.trackId }
            });
        }

        if (data.opcode === 291 && data.payload?.tokenAttrs) {
            console.log('[MAX Auth] ✅ Токен получен, авторизация успешна');
            this.sendSSE('success', {
                token: data.payload.tokenAttrs.LOGIN.token,
                profile: data.payload.profile,
                sessionId: this.sessionId,
            });

            const profile = data.payload?.profile?.contact;

            this.userData = {
                providerId: profile?.id?.toString()!, // use profile id instead
                name: profile?.names[0].firstName! + ' ' + profile?.names[0].lastName!,
                phone: profile?.phone?.toString(),
            }

            this.cleanup();
        }

        if (data.cmd === 3 /* error */) {
            console.log('[MAX Auth] ⚠️ Ошибка от сервера (QR устарел), перезапускаем соединение');
            this.sendSSE('status', { message: 'QR-код устарел, получаем новый...' });

            this.resetSocket();
        }
    }

    public start() {
        console.log('[MAX Auth] 🔌 Подключение к WebSocket wss://ws-api.oneme.ru/websocket');
        console.log('[MAX Auth] DeviceID:', this.deviceId);
        console.log('[MAX Auth] SessionID:', this.sessionId);

        this.ws = new WebSocket('wss://ws-api.oneme.ru/websocket', {
            headers: {
                'Origin': 'https://web.max.ru',
                'User-Agent': this.userAgent.headerUserAgent,
                'Accept-Language': 'ru-RU,ru;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            perMessageDeflate: true
        });

        this.ws.on('open', () => {
            console.log('[MAX Auth] ✅ WebSocket соединение открыто, отправляем handshake');
            this.sendMessage({
                opcode: 6,
                payload: {
                    userAgent: this.userAgent,
                    deviceId: this.deviceId
                }
            });
        });

        this.ws.on('message', (rawData: object) => {
            try {
                const data = JSON.parse(rawData.toString());
                this.handleMessage(data);
            } catch (e) {
                console.error('[MAX Auth] ❌ Ошибка парсинга сообщения:', e);
                console.error('[MAX Auth] Сырые данные:', rawData);
            }
        });

        this.ws.on('error', (error: Error) => {
            console.error('[MAX Auth] ❌ WebSocket ошибка:', error.message);
            console.error('[MAX Auth] Полная ошибка:', error);
            this.sendSSE('error', { message: error.message });
            this.cleanup();
        });

        this.ws.on('close', (code, reason) => {
            console.log('[MAX Auth] 🔌 WebSocket соединение закрыто');
            console.log('[MAX Auth] Код закрытия:', code);
            console.log('[MAX Auth] Причина:', reason.toString());
            this.cleanup();
        });
    }

    private cleanup() {
        console.log('[MAX Auth] 🧹 Очистка ресурсов');
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            console.log('[MAX Auth] ⏹️ Polling остановлен');
        }
        if (this.ws) {
            console.log('[MAX Auth] 🔌 Закрытие WebSocket');
            this.ws.close();
        }
        console.log('[MAX Auth] 📡 Закрытие SSE соединения');
        this.sseResponse.end();
    }

    private resetSocket() {
        console.log('[MAX Auth] 🔄 Перезапуск WebSocket соединения');

        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('[MAX Auth] ⏹️ Polling остановлен');
        }

        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws.close();
            this.ws = null;
            console.log('[MAX Auth] 🔌 WebSocket закрыт');
        }

        this.seq = 0;
        this.trackId = null;
        console.log('[MAX Auth] 🔄 Счетчики сброшены, запускаем новое соединение');

        this.start();
    }
}

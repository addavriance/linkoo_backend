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

        sseResponse.on('close', () => {
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

        this.sseResponse.write(payload);
        this.sseResponse.flush?.();

        // console.log('📡 SSE →', payload);
    }

    private sendMessage(payload: Partial<OneMeMessage>) {
        const message: OneMeMessage = {
            ver: 11,
            cmd: 0,
            seq: this.seq++,
            opcode: payload.opcode!,
            payload: payload.payload
        };
        this.ws?.send(JSON.stringify(message));
        // console.log('Sent:', message);
    }

    private startPolling() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);

        this.pollingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN && this.trackId) {
                this.sendMessage({
                    opcode: 289,
                    payload: { trackId: this.trackId }
                });
            }
        }, 5000);
    }

    private handleMessage(data: OneMeMessage) {
        // console.log('Received:', data);

        if (data.opcode === 6 && data.cmd === 1) {
            this.sendSSE('status', { message: 'Получаем QR-код...' });
            this.sendMessage({ opcode: 288 });
        }

        if (data.opcode === 288 && data.payload) {
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
            this.sendSSE('status', { message: 'QR отсканирован! Получаем токен...' });

            if (this.pollingInterval) clearInterval(this.pollingInterval);

            this.sendMessage({
                opcode: 291,
                payload: { trackId: this.trackId }
            });
        }

        if (data.opcode === 291 && data.payload?.tokenAttrs) {
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
            this.sendSSE('status', { message: 'QR-код устарел, получаем новый...' });

            this.resetSocket();
        }
    }

    public start() {
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
                console.error('Parse error:', e);
            }
        });

        this.ws.on('error', (error: Error) => {
            this.sendSSE('error', { message: error.message });
            this.cleanup();
        });

        this.ws.on('close', () => {
            this.cleanup();
        });
    }

    private cleanup() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        if (this.ws) this.ws.close();
        this.sseResponse.end();
    }

    private resetSocket() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws.close();
            this.ws = null;
        }

        this.seq = 0;
        this.trackId = null;

        this.start();
    }
}

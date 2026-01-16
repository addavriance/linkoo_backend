import axios from 'axios';
import * as crypto from 'crypto';
import {env} from '../config/env';
import {OAuthUserData} from '../types';

interface VkOAuthStateEntry {
    codeVerifier: string;
    timeout: ReturnType<typeof setTimeout>;
}

const vkStateMap = new Map<string, VkOAuthStateEntry>();
const VK_STATE_TTL_MS = 10 * 60 * 1000;

const generatePKCE = () => {
    const codeVerifier = crypto.randomBytes(32).toString('base64');
    const base64UrlCodeVerifier = codeVerifier
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const hash = crypto.createHash('sha256').update(base64UrlCodeVerifier).digest('base64');
    const codeChallenge = hash
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return {
        codeVerifier: base64UrlCodeVerifier,
        codeChallenge,
        codeChallengeMethod: 'S256' as const,
    };
};

const generateState = (): string => {
    return crypto.randomBytes(16).toString('hex');
};

const removePortFromUrl = (url: string): string => {
    try {
        const urlObj = new URL(url);
        urlObj.port = '';
        return urlObj.toString();
    } catch {
        return url.replace(/:\d+/, '');
    }
};

export const getGoogleAuthUrl = (): string => {
    if (!env.GOOGLE_CLIENT_ID) {
        throw new Error('Google OAuth not configured');
    }

    const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: `${env.API_URL}/api/auth/google/callback`,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

export const getGoogleUserData = async (code: string): Promise<OAuthUserData> => {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
        throw new Error('Google OAuth not configured');
    }

    const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${env.API_URL}/api/auth/google/callback`,
            grant_type: 'authorization_code',
        }
    );

    const {access_token} = tokenResponse.data;

    const userResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {headers: {Authorization: `Bearer ${access_token}`}}
    );

    return {
        email: userResponse.data.email,
        name: userResponse.data.name,
        avatar: userResponse.data.picture,
        providerId: userResponse.data.id,
    };
};

export const getVkAuthUrl = async (): Promise<string> => {
    if (!env.VK_CLIENT_ID) {
        throw new Error('VK OAuth not configured');
    }

    const pkce = generatePKCE();
    const state = generateState();

    const timeout = setTimeout(() => vkStateMap.delete(state), VK_STATE_TTL_MS);
    vkStateMap.set(state, { codeVerifier: pkce.codeVerifier, timeout });

    const redirectUri = removePortFromUrl(`${env.API_URL}/api/auth/vk/callback`);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: env.VK_CLIENT_ID,
        redirect_uri: redirectUri,
        state,
        code_challenge: pkce.codeChallenge,
        code_challenge_method: pkce.codeChallengeMethod,
        scope: 'vkid.personal_info',
    });

    return `https://id.vk.com/authorize?${params}`;
};

export const getVkUserData = async (
    code: string,
    state: string,
    deviceId?: string
): Promise<OAuthUserData> => {
    if (!env.VK_CLIENT_ID) {
        throw new Error('VK OAuth not configured');
    }

    const entry = vkStateMap.get(state);
    if (!entry) {
        throw new Error('Invalid state parameter');
    }

    clearTimeout(entry.timeout);
    vkStateMap.delete(state);

    const codeVerifier = entry.codeVerifier;

    const redirectUri = removePortFromUrl(`${env.API_URL}/api/auth/vk/callback`);

    const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
        code,
        client_id: env.VK_CLIENT_ID,
        state,
    });

    if (deviceId) {
        tokenParams.append('device_id', deviceId);
    }

    const tokenResponse = await axios.post(
        'https://id.vk.ru/oauth2/auth',
        tokenParams,
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
    );

    if (tokenResponse.data.error) {
        throw new Error(
            `VK ID OAuth error: ${tokenResponse.data.error_description || tokenResponse.data.error}`
        );
    }

    const {access_token} = tokenResponse.data;

    const userParams = new URLSearchParams({
        client_id: env.VK_CLIENT_ID,
        access_token,
    });

    const userResponse = await axios.post(
        'https://id.vk.ru/oauth2/user_info',
        userParams,
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
    );

    if (userResponse.data.error) {
        throw new Error(
            `VK ID profile error: ${userResponse.data.error_description || userResponse.data.error}`
        );
    }

    const user = userResponse.data.user;

    // получаем username через VK API, потом нужно прокидывать в почту, но это все равно эвристика
    let username: string | null = null;
    try {
        const vkApiParams = new URLSearchParams({
            fields: 'screen_name',
            access_token,
            v: '5.131',
        });

        const vkApiResponse = await axios.post(
            'https://api.vk.ru/method/users.get',
            vkApiParams,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        if (vkApiResponse.data.response?.[0]?.screen_name) {
            username = vkApiResponse.data.response[0].screen_name;
        }
    } catch (error) {
        console.error('Failed to get VK username:', error);
    }

    return {
        email: user.email || `${user.user_id}@vk.com`,
        name:
            user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.first_name || 'VK User',
        avatar: user.avatar,
        providerId: user.user_id,
    };
};

// Discord OAuth
export const getDiscordAuthUrl = (): string => {
    if (!env.DISCORD_CLIENT_ID) {
        throw new Error('Discord OAuth not configured');
    }

    const params = new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        redirect_uri: `${env.API_URL}/api/auth/discord/callback`,
        response_type: 'code',
        scope: 'identify email',
    });
    return `https://discord.com/api/oauth2/authorize?${params}`;
};

export const getDiscordUserData = async (
    code: string
): Promise<OAuthUserData> => {
    if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
        throw new Error('Discord OAuth not configured');
    }

    const tokenResponse = await axios.post(
        'https://discord.com/api/oauth2/token',
        new URLSearchParams({
            client_id: env.DISCORD_CLIENT_ID,
            client_secret: env.DISCORD_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `${env.API_URL}/api/auth/discord/callback`,
        }),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    );

    const {access_token} = tokenResponse.data;

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
        headers: {Authorization: `Bearer ${access_token}`},
    });

    const user = userResponse.data;
    const avatar = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : undefined;

    return {
        email: user.email,
        name: user.global_name || user.username,
        avatar,
        providerId: user.id,
    };
};

// GitHub OAuth
export const getGithubAuthUrl = (): string => {
    if (!env.GITHUB_CLIENT_ID) {
        throw new Error('GitHub OAuth not configured');
    }

    const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: `${env.API_URL}/api/auth/github/callback`,
        scope: 'user:email',
    });
    return `https://github.com/login/oauth/authorize?${params}`;
};

export const getGithubUserData = async (
    code: string
): Promise<OAuthUserData> => {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
        throw new Error('GitHub OAuth not configured');
    }

    const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
        },
        {headers: {Accept: 'application/json'}}
    );

    const {access_token} = tokenResponse.data;

    const [userResponse, emailsResponse] = await Promise.all([
        axios.get('https://api.github.com/user', {
            headers: {Authorization: `Bearer ${access_token}`},
        }),
        axios.get('https://api.github.com/user/emails', {
            headers: {Authorization: `Bearer ${access_token}`},
        }),
    ]);

    const user = userResponse.data;
    const primaryEmail = emailsResponse.data.find(
        (e: { primary: boolean; verified: boolean; email: string }) =>
            e.primary && e.verified
    );

    return {
        email: primaryEmail?.email || user.email,
        name: user.name || user.login,
        avatar: user.avatar_url,
        providerId: String(user.id),
    };
};

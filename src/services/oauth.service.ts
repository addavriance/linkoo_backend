import axios from 'axios';
import { env } from '../config/env';
import { OAuthUserData } from '../types';

// Google OAuth
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

  // Exchange code for tokens
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

  const { access_token } = tokenResponse.data;

  // Fetch user info
  const userResponse = await axios.get(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  return {
    email: userResponse.data.email,
    name: userResponse.data.name,
    avatar: userResponse.data.picture,
    providerId: userResponse.data.id,
  };
};

// VK OAuth
export const getVkAuthUrl = (): string => {
  if (!env.VK_CLIENT_ID) {
    throw new Error('VK OAuth not configured');
  }

  const params = new URLSearchParams({
    client_id: env.VK_CLIENT_ID,
    redirect_uri: `${env.API_URL}/api/auth/vk/callback`,
    display: 'page',
    scope: 'email',
    response_type: 'code',
    v: '5.131',
  });
  return `https://oauth.vk.com/authorize?${params}`;
};

export const getVkUserData = async (code: string): Promise<OAuthUserData> => {
  if (!env.VK_CLIENT_ID || !env.VK_CLIENT_SECRET) {
    throw new Error('VK OAuth not configured');
  }

  const tokenResponse = await axios.get('https://oauth.vk.com/access_token', {
    params: {
      client_id: env.VK_CLIENT_ID,
      client_secret: env.VK_CLIENT_SECRET,
      redirect_uri: `${env.API_URL}/api/auth/vk/callback`,
      code,
    },
  });

  const { access_token, user_id, email } = tokenResponse.data;

  const userResponse = await axios.get('https://api.vk.com/method/users.get', {
    params: {
      user_ids: user_id,
      fields: 'photo_200',
      access_token,
      v: '5.131',
    },
  });

  const user = userResponse.data.response[0];

  return {
    email: email || `${user_id}@vk.com`,
    name: `${user.first_name} ${user.last_name}`,
    avatar: user.photo_200,
    providerId: String(user_id),
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
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token } = tokenResponse.data;

  const userResponse = await axios.get('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${access_token}` },
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
    { headers: { Accept: 'application/json' } }
  );

  const { access_token } = tokenResponse.data;

  const [userResponse, emailsResponse] = await Promise.all([
    axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}` },
    }),
    axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${access_token}` },
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

import {customAlphabet} from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

const generateSlug = customAlphabet(alphabet, 8);

export const createSlug = (): string => {
    return generateSlug();
};

export const isValidSlug = (slug: string): boolean => {
    const slugRegex = /^[a-z0-9-]{3,50}$/;
    return slugRegex.test(slug);
};

export const sanitizeSlug = (input: string): string => {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

const reservedSlugs = new Set([
    'api',
    'admin',
    'auth',
    'login',
    'logout',
    'signup',
    'register',
    'settings',
    'profile',
    'dashboard',
    'health',
    'status',
    'help',
    'support',
    'about',
    'terms',
    'privacy',
    'legal',
    'static',
    'assets',
    'images',
    'css',
    'js',
    'fonts',
    'subscription',
    'subscriptions',
    'subscribe',
]);

export const isReservedSlug = (slug: string): boolean => {
    return reservedSlugs.has(slug.toLowerCase());
};

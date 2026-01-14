import { customAlphabet } from 'nanoid';

// Use lowercase alphanumeric characters for URL-friendly slugs
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

// Default slug length of 8 characters provides ~2.8 trillion combinations
const generateSlug = customAlphabet(alphabet, 8);

export const createSlug = (): string => {
  return generateSlug();
};

// Validate custom slug format
export const isValidSlug = (slug: string): boolean => {
  // Only lowercase letters, numbers, and hyphens
  // Must be 3-50 characters
  const slugRegex = /^[a-z0-9-]{3,50}$/;
  return slugRegex.test(slug);
};

// Sanitize a custom slug input
export const sanitizeSlug = (input: string): string => {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-') // Replace invalid chars with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

// Reserved slugs that cannot be used
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
]);

export const isReservedSlug = (slug: string): boolean => {
  return reservedSlugs.has(slug.toLowerCase());
};

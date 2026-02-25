import { createSlug, isValidSlug, sanitizeSlug, isReservedSlug } from '@/utils/slugGenerator';

describe('slugGenerator utilities', () => {
    describe('createSlug()', () => {
        it('should generate a string of the expected length (8 chars)', () => {
            const slug = createSlug();
            expect(slug).toHaveLength(8);
        });

        it('should only contain characters matching [a-z0-9]', () => {
            const slug = createSlug();
            expect(slug).toMatch(/^[a-z0-9]+$/);
        });

        it('should generate unique slugs across multiple calls', () => {
            const slugs = new Set(Array.from({ length: 50 }, () => createSlug()));
            // With 36^8 possible values, collisions in 50 calls are essentially impossible
            expect(slugs.size).toBe(50);
        });
    });

    describe('isValidSlug()', () => {
        it('should return true for valid slugs', () => {
            expect(isValidSlug('abc')).toBe(true);
            expect(isValidSlug('abc123')).toBe(true);
            expect(isValidSlug('my-link')).toBe(true);
        });

        it('should return false for slugs that are too short', () => {
            expect(isValidSlug('ab')).toBe(false);
            expect(isValidSlug('')).toBe(false);
        });

        it('should return false for slugs with invalid characters', () => {
            expect(isValidSlug('UPPERCASE')).toBe(false);
            expect(isValidSlug('with space')).toBe(false);
            expect(isValidSlug('special!')).toBe(false);
        });
    });

    describe('sanitizeSlug()', () => {
        it('should convert input to lowercase', () => {
            expect(sanitizeSlug('MySlug')).toBe('myslug');
        });

        it('should replace invalid characters with hyphens', () => {
            expect(sanitizeSlug('hello world')).toBe('hello-world');
            expect(sanitizeSlug('test@email.com')).toBe('test-email-com');
        });

        it('should strip leading and trailing hyphens', () => {
            expect(sanitizeSlug('-hello-')).toBe('hello');
        });

        it('should collapse multiple hyphens into one', () => {
            expect(sanitizeSlug('a--b')).toBe('a-b');
        });
    });

    describe('isReservedSlug()', () => {
        it('should return true for reserved slugs', () => {
            expect(isReservedSlug('api')).toBe(true);
            expect(isReservedSlug('admin')).toBe(true);
            expect(isReservedSlug('health')).toBe(true);
        });

        it('should return false for non-reserved slugs', () => {
            expect(isReservedSlug('myprofile')).toBe(false);
            expect(isReservedSlug('john')).toBe(false);
        });
    });
});

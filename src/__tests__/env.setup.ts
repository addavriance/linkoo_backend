// This file runs BEFORE any module imports in tests.
// It sets process.env so that config/env.ts validation passes.
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), override: false });

// Ensure required vars are set even if .env.test is missing
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://placeholder/test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-for-testing-min-32-chars!';
process.env.API_URL = process.env.API_URL ?? 'http://localhost:3001';
process.env.FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

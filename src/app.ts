import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { env } from './config/env';
import { corsOptions } from './config/cors';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';
import redirectRoutes from './routes/redirect.routes';

const app: Application = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check (before rate limiting)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Rate limiting for API routes
app.use('/api', apiLimiter);

// API routes
app.use('/api', routes);

// Redirect handler for shortened URLs (at root level)
// This catches /:slug requests for URL shortening
app.use('/', redirectRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

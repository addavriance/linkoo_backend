import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { formatResponse } from '../utils/response';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      formatResponse({
        success: false,
        error: {
          message: err.message,
          code: err.statusCode,
          details: err.details,
        },
      })
    );
  }

  // Handle MongoDB duplicate key error
  if ((err as any).code === 11000) {
    return res.status(409).json(
      formatResponse({
        success: false,
        error: {
          message: 'Duplicate entry',
          code: 409,
        },
      })
    );
  }

  // Handle MongoDB validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json(
      formatResponse({
        success: false,
        error: {
          message: 'Validation failed',
          code: 400,
          details: err.message,
        },
      })
    );
  }

  // Handle MongoDB CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json(
      formatResponse({
        success: false,
        error: {
          message: 'Invalid ID format',
          code: 400,
        },
      })
    );
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      formatResponse({
        success: false,
        error: {
          message: 'Invalid token',
          code: 401,
        },
      })
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      formatResponse({
        success: false,
        error: {
          message: 'Token expired',
          code: 401,
        },
      })
    );
  }

  // Handle unknown errors
  const statusCode = 500;
  const message =
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  res.status(statusCode).json(
    formatResponse({
      success: false,
      error: {
        message,
        code: statusCode,
      },
    })
  );
};

// 404 handler for undefined routes
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  res.status(404).json(
    formatResponse({
      success: false,
      error: {
        message: `Route ${req.method} ${req.path} not found`,
        code: 404,
      },
    })
  );
};

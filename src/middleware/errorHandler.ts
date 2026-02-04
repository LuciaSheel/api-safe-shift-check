/**
 * Error Handling Middleware
 * Centralized error handling for the API
 */

import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  errors?: string[];
}

/**
 * Custom error class for API errors
 */
export class AppError extends Error implements ApiError {
  statusCode: number;
  errors?: string[];

  constructor(message: string, statusCode: number = 500, errors?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found error handler
 */
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    Success: false,
    Message: `Route ${req.method} ${req.path} not found`,
  });
}

/**
 * Global error handler
 */
export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Handle common error messages
  if (message.includes('not found')) {
    statusCode = 404;
  }

  if (message.includes('already exists')) {
    statusCode = 409;
  }

  if (message.includes('unauthorized') || message.includes('Unauthorized')) {
    statusCode = 401;
  }

  if (message.includes('forbidden') || message.includes('Forbidden')) {
    statusCode = 403;
  }

  // Don't expose internal errors in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && statusCode === 500) {
    message = 'Internal Server Error';
  }

  res.status(statusCode).json({
    Success: false,
    Message: message,
    Errors: err.errors,
    ...(isProduction ? {} : { Stack: err.stack }),
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

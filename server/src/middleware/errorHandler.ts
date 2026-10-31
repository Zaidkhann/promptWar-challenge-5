import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Base Application Error class with HTTP status code and operational flag.
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errorCode?: string;

  constructor(message: string, statusCode = 400, errorCode?: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict or duplicate entry') {
    super(message, 409, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

interface DatabaseErrorLike {
  code?: string;
  message?: string;
}

/**
 * Centralized Express Error Handling Middleware.
 * Provides consistent error payloads and prevents sensitive stack leakage in production.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // 1. Handle Zod schema validation errors
  if (err instanceof ZodError) {
    const issues = (err as { issues?: Array<{ path?: unknown[]; message: string }> }).issues ||
      (err as { errors?: Array<{ path?: unknown[]; message: string }> }).errors || [];
    const formattedErrors = issues.map((e) => ({
      field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      errors: formattedErrors,
    });
    return;
  }

  // 2. Handle known operational AppError hierarchy
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
    });
    return;
  }

  // 3. Handle SQLite constraint errors
  const dbErr = err as DatabaseErrorLike;
  if (dbErr && dbErr.code === 'SQLITE_CONSTRAINT') {
    res.status(409).json({
      success: false,
      message: 'Database constraint violation (record already exists or reference is invalid).',
      errorCode: 'DATABASE_CONSTRAINT_VIOLATION',
    });
    return;
  }

  // 4. Handle other unexpected errors safely without leaking internal stack trace in production
  if (process.env.NODE_ENV !== 'test') {
    console.error('Unhandled Application Error:', err);
  }

  const errorMessage = err instanceof Error ? err.message : 'Internal server error';

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : errorMessage,
    errorCode: 'INTERNAL_SERVER_ERROR',
  });
}

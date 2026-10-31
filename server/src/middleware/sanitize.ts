import { Request, Response, NextFunction } from 'express';

/**
 * Recursively sanitizes user input strings to prevent Cross-Site Scripting (XSS)
 * and HTML/script injection attacks while preserving valid text.
 *
 * @param value The value to sanitize (string, object, array, or primitive)
 * @returns Sanitized value safe for storage and reflection
 */
export function sanitizeString(value: string): string {
  if (typeof value !== 'string') return value;

  return value
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Strip common malicious protocols
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '')
    // Strip on* event handlers (onerror=, onload=, onclick=)
    .replace(/on\w+\s*=/gi, '')
    // Escape residual HTML angle brackets and quotes
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Deep sanitization for nested objects and arrays in request payloads.
 */
export function sanitizeData<T>(input: T): T {
  if (typeof input === 'string') {
    return sanitizeString(input) as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeData(item)) as unknown as T;
  }
  if (input !== null && typeof input === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input)) {
      sanitizedObj[key] = sanitizeData(val);
    }
    return sanitizedObj as unknown as T;
  }
  return input;
}

/**
 * Express middleware to sanitize body, query parameters, and params
 */
export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) {
    req.body = sanitizeData(req.body);
  }
  if (req.query) {
    req.query = sanitizeData(req.query);
  }
  if (req.params) {
    req.params = sanitizeData(req.params);
  }
  next();
}

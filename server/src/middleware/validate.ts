import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

/**
 * Validates incoming Express request properties (body, query, or params) against a Zod schema.
 * Replaces request data with parsed, validated, and type-coerced values.
 */
export function validate(schema: ZodType, source: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
}

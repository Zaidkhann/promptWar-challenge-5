import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError } from './errorHandler';
import { Event } from '../types';

export interface RequestWithEvent extends Request {
  currentEvent?: Event;
}

/**
 * Middleware ensuring the authenticated user owns the specified event.
 * Enforces strict Row-Level Security (RLS) across all sub-resources.
 */
export function verifyEventOwnership(req: Request, _res: Response, next: NextFunction): void {
  const eventId = req.params.eventId;
  const userId = req.user?.id;

  if (!eventId) {
    return next(new ValidationError('Event ID is required'));
  }

  if (!userId) {
    return next(new UnauthorizedError('Unauthorized'));
  }

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as Event | undefined;

  if (!event) {
    return next(new NotFoundError('Event not found'));
  }

  if (event.user_id !== userId) {
    return next(new ForbiddenError('Forbidden: You do not have permission to access or modify this event'));
  }

  (req as RequestWithEvent).currentEvent = event;
  next();
}

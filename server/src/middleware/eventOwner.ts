import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { AppError } from './errorHandler';
import { Event } from '../types';

export interface RequestWithEvent extends Request {
  currentEvent?: Event;
}

export function verifyEventOwnership(req: Request, res: Response, next: NextFunction): void {
  const eventId = req.params.eventId;
  const userId = req.user?.id;

  if (!eventId) {
    throw new AppError('Event ID is required', 400);
  }

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as Event | undefined;

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  if (event.user_id !== userId) {
    throw new AppError('Forbidden: You do not have permission to access or modify this event', 403);
  }

  (req as RequestWithEvent).currentEvent = event;
  next();
}

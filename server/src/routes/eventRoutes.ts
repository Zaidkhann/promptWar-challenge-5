import { Router } from 'express';
import { EventController } from '../controllers/eventController';
import { authenticate } from '../middleware/auth';
import { verifyEventOwnership } from '../middleware/eventOwner';
import { validate } from '../middleware/validate';
import { createEventSchema, updateEventSchema } from '../types';

export const eventRouter = Router();

eventRouter.use(authenticate);

eventRouter.get('/', EventController.getEvents);
eventRouter.post('/', validate(createEventSchema), EventController.createEvent);

eventRouter.get('/:eventId', verifyEventOwnership, EventController.getEventById);
eventRouter.put('/:eventId', verifyEventOwnership, validate(updateEventSchema), EventController.updateEvent);
eventRouter.delete('/:eventId', verifyEventOwnership, EventController.deleteEvent);

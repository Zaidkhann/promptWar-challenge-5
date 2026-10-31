import { Router } from 'express';
import { TimelineController } from '../controllers/timelineController';
import { authenticate } from '../middleware/auth';
import { verifyEventOwnership } from '../middleware/eventOwner';
import { validate } from '../middleware/validate';
import { createTimelineTaskSchema, updateTimelineTaskSchema } from '../types';

export const timelineRouter = Router({ mergeParams: true });

timelineRouter.use(authenticate);
timelineRouter.use(verifyEventOwnership);

timelineRouter.get('/tasks', TimelineController.getTasks);
timelineRouter.post('/tasks', validate(createTimelineTaskSchema), TimelineController.createTask);
timelineRouter.put('/tasks/:taskId', validate(updateTimelineTaskSchema), TimelineController.updateTask);
timelineRouter.delete('/tasks/:taskId', TimelineController.deleteTask);

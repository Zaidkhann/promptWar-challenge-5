import { Router } from 'express';
import { AIController } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { verifyEventOwnership } from '../middleware/eventOwner';
import { validate } from '../middleware/validate';
import { aiLimiter } from '../middleware/rateLimiter';
import { aiPlanPromptSchema } from '../types';

export const aiRouter = Router({ mergeParams: true });

aiRouter.use(authenticate);
aiRouter.use(verifyEventOwnership);

// AI Planning Assistant endpoints
aiRouter.post('/plan/generate', aiLimiter, validate(aiPlanPromptSchema), AIController.generatePlan);
aiRouter.post('/plan/apply', AIController.applyPlan);

// Recommendations
aiRouter.get('/recommendations', AIController.getRecommendations);
aiRouter.post('/recommendations/regenerate', aiLimiter, AIController.regenerateRecommendations);

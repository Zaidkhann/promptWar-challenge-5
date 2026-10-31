import { Router } from 'express';
import { authRouter } from './authRoutes';
import { eventRouter } from './eventRoutes';
import { budgetRouter } from './budgetRoutes';
import { timelineRouter } from './timelineRoutes';
import { vendorRouter } from './vendorRoutes';
import { aiRouter } from './aiRoutes';
import { dashboardRouter } from './dashboardRoutes';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CelebraPlan AI API',
  });
});

// Top-level routers
apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/events', eventRouter);

// Event-scoped nested routers (e.g. /api/events/:eventId/budget, /api/events/:eventId/timeline, etc.)
apiRouter.use('/events/:eventId/budget', budgetRouter);
apiRouter.use('/events/:eventId/timeline', timelineRouter);
apiRouter.use('/events/:eventId/vendors', vendorRouter);
apiRouter.use('/events/:eventId/ai', aiRouter);

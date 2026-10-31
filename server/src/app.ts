import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { initDatabase } from './db';
import { seedDatabase } from './db/seed';
import { apiRouter } from './routes';
import { errorHandler, AppError } from './middleware/errorHandler';

// Initialize database schema, indexes, and seed demo records
initDatabase();
seedDatabase().catch((err) => console.error('Seed error:', err));

export const app = express();

// Security middleware
app.use(helmet());

// CORS configuration with explicit trusted origins
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Mount all API endpoints
app.use('/api', apiRouter);

// Handle unknown API routes
app.use('/api/*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`API endpoint not found: ${req.method} ${req.originalUrl}`, 404));
});

// Centralized error handling
app.use(errorHandler);

import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { registerSchema, loginSchema } from '../types';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), AuthController.register);
authRouter.post('/login', authLimiter, validate(loginSchema), AuthController.login);
authRouter.get('/me', authenticate, AuthController.me);

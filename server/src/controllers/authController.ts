import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { User } from '../types';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
      if (existingUser) {
        throw new AppError('An account with this email address already exists.', 409);
      }

      // Hash password with 10 salt rounds
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).run(userId, name.trim(), normalizedEmail, passwordHash);

      // Generate JWT
      const token = jwt.sign(
        { id: userId, email: normalizedEmail, name: name.trim() },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          token,
          user: {
            id: userId,
            name: name.trim(),
            email: normalizedEmail,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as User | undefined;

      if (!user) {
        throw new AppError('Invalid email or password.', 401);
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        throw new AppError('Invalid email or password.', 401);
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.user.id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

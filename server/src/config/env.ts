import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
  GEMINI_API_KEY: z.string().optional().default(''),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),
  DATABASE_PATH: z.string().default('./data/celebraplan.sqlite'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment configuration validation error:', parsed.error.format());
  throw new Error('Invalid environment variables. Please check your .env file.');
}

export const env = parsed.data;

import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  REDIS_URL: z.string().min(1, 'Redis URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  MAX_PLAYERS_PER_SESSION: z.string().transform(Number).default('8'),
  SESSION_TIMEOUT_MINUTES: z.string().transform(Number).default('60'),
  DEFAULT_GAME_DURATION_MINUTES: z.string().transform(Number).default('90'),
});

// Validate and export environment variables
export const env = envSchema.parse(process.env);

// Derived configurations
export const config = {
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
  },
  database: {
    url: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    bcryptRounds: env.BCRYPT_ROUNDS,
  },
  cors: {
    allowedOrigins: env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
  },
  game: {
    maxPlayersPerSession: env.MAX_PLAYERS_PER_SESSION,
    sessionTimeoutMinutes: env.SESSION_TIMEOUT_MINUTES,
    defaultGameDurationMinutes: env.DEFAULT_GAME_DURATION_MINUTES,
  },
} as const;
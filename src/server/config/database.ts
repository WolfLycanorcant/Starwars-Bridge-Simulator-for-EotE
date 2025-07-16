import { Pool } from 'pg';
import { createClient } from 'redis';

// PostgreSQL connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis connection
export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Initialize connections
export async function initializeDatabase() {
  try {
    // Test PostgreSQL connection
    const client = await pool.connect();
    console.log('Connected to PostgreSQL');
    client.release();

    // Connect to Redis
    await redisClient.connect();
    
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Graceful shutdown
export async function closeDatabaseConnections() {
  try {
    await pool.end();
    await redisClient.quit();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
}
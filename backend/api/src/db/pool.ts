import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (3 levels up from backend/api/src)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config(); // fallback to local .env if any

const connectionString = process.env.DATABASE_URL;

console.log('🔌 Initializing PostgreSQL Pool...');
console.log('📡 Database Host:', connectionString ? connectionString.split('@')[1]?.split(':')[0] : 'None');

export const pool = new Pool({
  connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000, // 10 seconds timeout
  idleTimeoutMillis: 30000,
  max: 20,
});

pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err.message);
});

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (3 levels up from backend/api/src)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config(); // fallback to local .env if any

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

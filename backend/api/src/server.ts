import express from 'express';
import cors from 'cors';
import { pool } from './db/pool';
import clientsRouter from './routes/clients';
import appointmentsRouter from './routes/appointments';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
}));
app.use(express.json());


// ── Routes ──────────────────────────────────────────────────────
app.use('/api/clients', clientsRouter);
app.use('/api/appointments', appointmentsRouter);

// ── Health Check ─────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time');
    res.json({
      status: 'ok',
      db: 'connected',
      time: result.rows[0].time,
      host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0],
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: (err as Error).message });
  }
});

// ── Init DB ───────────────────────────────────────────────────────
app.post('/api/init-db', async (_req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        client_name  VARCHAR(100),
        email        VARCHAR(100),
        preferred_treatment VARCHAR(100),
        status       VARCHAR(20) DEFAULT 'Active',
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS appointments (
        id               SERIAL PRIMARY KEY,
        phone_number     VARCHAR(20),
        client_name      VARCHAR(100),
        treatment        VARCHAR(100),
        appointment_date VARCHAR(100),
        status           VARCHAR(20) DEFAULT 'Booked',
        gemini_notes     TEXT,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    res.json({ message: 'Tables created (or already exist)' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Start Server ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ API server running at http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
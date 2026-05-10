import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'medspa',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'password',
});

// Middleware to validate phone (simple regex)
const validatePhone = (req: Request, res: Response, next: any) => {
  const { phone_number } = req.body;
  if (phone_number && !/^\+?[1-9]\d{1,14}$/.test(phone_number.replace(/\D/g, ''))) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }
  next();
};

// CLIENTS ENDPOINTS
app.get('/api/clients', async (req: Request, res: Response) => {
  const { search, status, sort = 'created_at', order = 'DESC' } = req.query;
  let query = 'SELECT * FROM clients WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;
  if (search) {
    query += ` AND (phone_number ILIKE $${paramIndex} OR client_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  if (status) {
    query += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }
  query += ` ORDER BY ${sort} ${order} LIMIT 100`;
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/clients', validatePhone, async (req: Request, res: Response) => {
  const { phone_number, client_name, email, preferred_treatment, status = 'Active' } = req.body;
  const query = `INSERT INTO clients (phone_number, client_name, email, preferred_treatment, status) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
  try {
    const result = await pool.query(query, [phone_number, client_name, email, preferred_treatment, status]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.put('/api/clients/:id', validatePhone, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const updates: any = { ...req.body };
  const fields = Object.keys(updates);
  const values = fields.map((_, i) => `$${i + 2}`);
  const query = `UPDATE clients SET ${fields.map(f => `${f} = ${values[fields.indexOf(f)]}`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
  try {
    const result = await pool.query(query, [id, ...fields.map(f => updates[f])]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Client not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.delete('/api/clients/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// APPOINTMENTS ENDPOINTS (similar structure)
app.get('/api/appointments', async (req: Request, res: Response) => {
  const { search, status, sort = 'created_at', order = 'DESC' } = req.query;
  let query = 'SELECT * FROM appointments WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;
  if (search) {
    query += ` AND (phone_number ILIKE $${paramIndex} OR client_name ILIKE $${paramIndex} OR treatment ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  if (status) {
    query += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }
  query += ` ORDER BY ${sort} ${order} LIMIT 100`;
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/appointments', async (req: Request, res: Response) => {
  const { phone_number, client_name, treatment, appointment_date, status = 'Booked', gemini_notes } = req.body;
  const query = `INSERT INTO appointments (phone_number, client_name, treatment, appointment_date, status, gemini_notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
  try {
    const result = await pool.query(query, [phone_number, client_name, treatment, appointment_date, status, gemini_notes]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.put('/api/appointments/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const updates: any = { ...req.body };
  const fields = Object.keys(updates);
  const values = fields.map((_, i) => `$${i + 2}`);
  const query = `UPDATE appointments SET ${fields.map(f => `${f} = ${values[fields.indexOf(f)]}`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
  try {
    const result = await pool.query(query, [id, ...fields.map(f => updates[f])]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.delete('/api/appointments/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query('DELETE FROM appointments WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
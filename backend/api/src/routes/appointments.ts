import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const router = Router();

// GET /api/appointments
router.get('/', async (req: Request, res: Response) => {
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

// POST /api/appointments
router.post('/', async (req: Request, res: Response) => {
  const { phone_number, client_name, treatment, appointment_date, status = 'Booked', gemini_notes } = req.body;
  const query = `INSERT INTO appointments (phone_number, client_name, treatment, appointment_date, status, gemini_notes)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
  try {
    const result = await pool.query(query, [phone_number, client_name, treatment, appointment_date, status, gemini_notes]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// PUT /api/appointments/:id
router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const updates: Record<string, any> = { ...req.body };
  const fields = Object.keys(updates);
  const values = fields.map((_, i) => `$${i + 2}`);
  const setClause = fields.map((f, i) => `${f} = ${values[i]}`).join(', ');
  const query = `UPDATE appointments SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
  try {
    const result = await pool.query(query, [id, ...fields.map(f => updates[f])]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query('DELETE FROM appointments WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;

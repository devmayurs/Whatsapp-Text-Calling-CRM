import { Request, Response, NextFunction } from 'express';

export const validatePhone = (req: Request, res: Response, next: NextFunction): void => {
  const { phone_number } = req.body;
  if (phone_number && !/^\+?[1-9]\d{1,14}$/.test(phone_number.replace(/\D/g, ''))) {
    res.status(400).json({ error: 'Invalid phone number' });
    return;
  }
  next();
};

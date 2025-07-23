import { pool } from '../config/db.js';
import createError from 'http-errors';

export default async (req, res, next) => {
  try {
    const [results] = await pool.query(
      `(SELECT role FROM users WHERE id = ?)
       UNION
       SELECT role FROM consultants WHERE id = ?
       UNION
       SELECT role FROM admin WHERE id = ?`,
      [req.user.id, req.user.id, req.user.id]
    );

    if (!results.length || results[0].role !== 'admin') {
      return next(createError(403, 'Admin privileges required'));
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    next(createError(500, 'Error verifying admin privileges'));
  }
};

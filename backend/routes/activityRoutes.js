import express from 'express';
import { pool } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Log a new activity (for use in controllers, not exposed as a public endpoint)
export const logActivity = async (userId, role, type, description) => {
    await pool.query(
        'INSERT INTO activities (user_id, role, type, description) VALUES (?, ?, ?, ?)',
        [userId, role, type, description]
    );
};

// Get recent activities for the logged-in user (user, consultant, or admin)
router.get('/', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, type, description, created_at FROM activities WHERE user_id = ? AND role = ? ORDER BY created_at DESC LIMIT 20',
            [req.user.id, req.user.role]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch activities' });
    }
});

export default router;

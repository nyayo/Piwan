import express from 'express';
import {register, login, consultant} from '../controllors/AuthController.js';
import { pool } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register-user', register)
router.post('/register-consultant', consultant) 
router.post('/login-user', login)

export default router; 
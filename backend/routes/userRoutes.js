import express from 'express';
import { profile, user, consultant, consultants, users, del_consultant, del_user, prof_update } from '../controllors/UserController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', authenticate, profile);
router.patch('/update-profile', authenticate, prof_update);
router.get('/user/:id', user);
router.get('/consultant/:id', consultant);
router.get('/consultants', consultants);
router.get('/users', users);
router.delete('/delete/user/:id', authenticate, del_user);
router.delete('/delete/consultant/:id', authenticate, del_consultant);

export default router;
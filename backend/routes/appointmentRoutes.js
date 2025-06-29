import express from 'express';
import { body } from 'express-validator';
import { create, 
    get, 
    reject, 
    review, 
    update, 
    cancel,
    confirm, 
    blockSlot, 
    reschedule,
    getUserAppointments, 
    getAvailableAppointments, 
    getConsultantAppointments, 
    getConsultantReviewsPaginated, 
} from '../controllors/AppointmentController.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/error.js';

const router = express.Router();

router.post('/create', authenticate, create)
router.get('/user/:userId', authenticate, getUserAppointments)
router.get('/consultant/:consultantId', authenticate, getConsultantAppointments)
router.get('/consultant/:consultantId/availability', authenticate, getAvailableAppointments)
router.get('/get', authenticate, handleValidationErrors, [body('status').optional(), body('date_from').optional(), body('date_to').optional()], get)
router.patch('/:id/status', authenticate, update)
router.get('/consultants/:consultantId/reviews', getConsultantReviewsPaginated);
router.post('/:id/review', handleValidationErrors, authenticate, [body('review_text').optional().isString().withMessage('Review text must be a string')], review)
router.post('/block', authenticate, blockSlot)
router.post('/:id/confirm', authenticate, confirm);
router.post('/:id/reject', authenticate, reject);
router.post('/:id/reschedule', authenticate, reschedule);
router.post('/:id/cancel', authenticate, cancel);


export default router;
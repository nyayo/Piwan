import express from 'express';
import { profile, user, consultant, consultants, users, del_consultant, del_user, prof_update, savePushToken, sendPushNotification, saveConsultantPushToken, sendPushNotificationToConsultant, saveNotificationController, getUserNotifications, getConsultantNotifications, markNotificationRead, updateNotificationPreference } from '../controllors/UserController.js';
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
router.post('/push-token', savePushToken);
router.post('/send-notification', sendPushNotification);
router.post('/consultant/push-token', saveConsultantPushToken);
router.post('/consultant/send-notification', sendPushNotificationToConsultant);
router.post('/notification/save', saveNotificationController);
router.get('/notifications', authenticate, getUserNotifications);
router.get('/consultant/notifications', authenticate, getConsultantNotifications);
router.post('/notification/read', authenticate, markNotificationRead);
router.patch('/notification-preference', authenticate, updateNotificationPreference);

export default router;
import express from 'express';
import cors from 'cors';
import { doubleCsrf } from 'csrf-csrf';
import { checkConnection } from './config/db.js';
import { createAllTables } from './utils/DButils.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import cloudinarySignatureRouter from './routes/cloudinarySignature.js';
import moodRoutes from './routes/moodRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
// import adminRoutes from './routes/adminRoutes.js';
import './jobs/reminderJob.js';

const app = express();

// CORS configuration
app.use(cors());

// Configure CSRF protection
// const { doubleCsrfProtection } = doubleCsrf({
//   getSecret: () => process.env.CSRF_SECRET,
//   cookieName: '__Host-psifi.x-csrf-token',
//   cookieOptions: {
//     httpOnly: true,
//     sameSite: 'strict',
//     secure: process.env.NODE_ENV === 'production'
//   }
// });

// app.use(doubleCsrfProtection);

// CRITICAL: Raw body parser for webhook signature verification
// This must come BEFORE express.json() and only for the webhook route
app.use('/api/chat/webhook', express.raw({ 
    type: 'application/json',
    limit: '50mb' // Adjust size limit as needed
}));

// Middleware to capture raw body for signature verification
app.use('/api/chat/webhook', (req, res, next) => {
    req.rawBody = req.body; // Store raw buffer
    try {
        req.body = JSON.parse(req.body); // Parse JSON for controller
    } catch (error) {
        console.error('Error parsing webhook JSON:', error);
        return res.status(400).json({ error: 'Invalid JSON' });
    }
    next();
});

// Regular JSON parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route definitions
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api', cloudinarySignatureRouter);
app.use('/api/resources', resourceRoutes);
app.use('/api/chat', chatRoutes);
// app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async() => {
    console.log(`Server running at port ${PORT}.`);
    try {
        await checkConnection();
        await createAllTables();
    } catch (error) {
        console.log('Failed to initialize db:', error);
    }
});

export default app;

import express from 'express';
import cors from 'cors';
import { checkConnection } from './config/db.js';
import { createAllTables } from './utils/DButils.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import cloudinarySignatureRouter from './routes/cloudinarySignature.js';
import moodRoutes from './routes/moodRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js'
import chatRoutes from './routes/chatRoutes.js';
import './jobs/reminderJob.js';

const app = express();
app.use(cors()); 
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api', cloudinarySignatureRouter);
app.use('/api/resources', resourceRoutes);
app.use('/api/chat', chatRoutes);

app.listen(3000, async() => {
    console.log('Server running at port 3000.')
    try {
        await checkConnection();
        await createAllTables(); 
    } catch (error) {
        console.log('Failed to initial db: ', error)
    }
});
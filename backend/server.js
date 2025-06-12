import express from 'express';
import { checkConnection } from './config/db.js';
import { createAllTables } from './utils/DButils.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import cors from 'cors';

const app = express();
app.use(cors()); 
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/events', eventRoutes);

app.listen(3000, async() => {
    console.log('Server running at port 3000.')
    try {
        await checkConnection();
        await createAllTables(); 
    } catch (error) {
        console.log('Failed to initial db: ', error)
    }
});
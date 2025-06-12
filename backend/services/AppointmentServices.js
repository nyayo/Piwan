import { pool } from "../config/db.js";

export const createAppointment = async(appointment, user_id) => {
    try {
        const [consultants] = await pool.query('SELECT * FROM consultants WHERE id = ?', [appointment.consultant_id]);
        if (consultants.length === 0) {
            return {success: false, message: "Consultant not found or inactive"}; 
        }

        const durationInMinutes = appointment.duration_minutes || 60;

        const appointmentEnd = new Date(appointment.appointment_date);
        appointmentEnd.setMinutes(appointmentEnd.getMinutes() + durationInMinutes);

        const [conflicts] = await pool.query(`
            SELECT id FROM appointments 
            WHERE consultant_id = ? 
            AND status IN ('pending', 'confirmed') 
            AND (
                (appointment_date <= ? AND DATE_ADD(appointment_date, INTERVAL duration_minutes MINUTE) > ?) OR
                (appointment_date < ? AND DATE_ADD(appointment_date, INTERVAL duration_minutes MINUTE) >= ?)
            )
            `, [appointment.consultant_id, appointment.appointment_date, appointment.appointment_date, appointmentEnd, appointmentEnd]);

        if (conflicts.length > 0) {
            return {success: false, message: "Time slot is already booked"};
        }
        const [result] = await pool.query(
            `INSERT INTO appointments (user_id, consultant_id, title, description, appointment_date, 
            duration_minutes) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, appointment.consultant_id, appointment.title, appointment.description || null, appointment.appointment_date, 
            durationInMinutes]
            );
        
        return {
            success: true,
            message: 'Appointment created successfully',
            appointment: {
                id: result.insertId,
                appointment
            }
        }

    } catch (error) {
        return {
            success: false,
            message: "Cannot create an appointment."
        }
    }
}

export const getAppointments = async(userId, userType, appointment) => {
    try {
        let query, params;

        if (userType === 'user') {
        query = `
            SELECT a.*, c.username as consultant_name, c.profession, c.phone as consultant_phone
            FROM appointments a
            JOIN consultants c ON a.consultant_id = c.id
            WHERE a.user_id = ?
        `;
        params = [userId];
        } else {
        query = `
            SELECT a.*, u.username as user_name, u.email as user_email, u.phone as user_phone
            FROM appointments a
            JOIN users u ON a.user_id = u.id
            WHERE a.consultant_id = ?
        `;
        params = [userId];
        }

        if (appointment.status) {
            query += ' AND a.status = ?';
            params.push(appointment.status);
        }

        if (appointment.date_from) {
            query += ' AND a.appointment_date >= ?';
            params.push(date_from);
        }

        if (appointment.date_to) {
            query += ' AND a.appointment_date <= ?';
            params.push(date_to);
        }

        query += ' ORDER BY a.appointment_date DESC';

        const [appointments] = await pool.query(query, params);

        return {
            success: true,
            message: "Appointments fetched successfully.",
            appointments
        }
    } catch (error) {
        return {success: false, message: "Internal server error"}
    }
}

export const updateStatus = async(userId, userType, appointmentId, statusUpdate) => {
    try {
        const [appointments] = await pool.query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
        if (appointments.length === 0) {
            return {success: false, message: "Appointment not found"};
        }

        const appointment = appointments[0];

        if (userType === 'consultant' && appointment.consultant_id !== userId) {
            return {success: false, message: "Not authorized to update this appointment"};
        }
        
        if (userType === 'user' && appointment.user_id !== userId) {
            return {success: false, message: "Not authorized to update this appointment"};
        }

        if (userType === 'user' && statusUpdate.status !== 'cancelled') {
            return {success: false, message: "Users can only cancel appointments"};
        }

        await pool.query(
            'UPDATE appointments SET status = ?, cancellation_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [statusUpdate.status, statusUpdate.cancellation_reason || null, appointmentId]
        );

        // if (statusUpdate.status === 'completed' && appointment.status !== 'completed') {
        //     await pool.query(
        //         'UPDATE consultants SET total_appointments = total_appointments + 1 WHERE id = ?',
        //         [appointment.consultant_id]
        //     );
        // }

        return {
            success: true,
            message: "Appointment status updated successfully"
        };
    } catch (error) {
        return {success: false, message: "Internal server error"}
    }
}


export const appointmentReview = async(userId, appointmentId, review) => {
    try {
        const [appointments] = await pool.query(
            'SELECT * FROM appointments WHERE id = ? AND user_id = ? AND status = "completed"',
            [appointmentId, userId]
        );

        if (appointments.length === 0) {
            return {success: false, message: "Completed appointment not found"};
        }

        const appointment = appointments[0];

        const [existingReviews] = await pool.query(
            'SELECT id FROM reviews WHERE appointment_id = ? AND user_id = ?',
            [appointmentId, userId]
        );

        if (existingReviews.length > 0) {
            return {success: false, message: "Review already exists for this appointment"};
        }

        await pool.query(
            'INSERT INTO reviews (appointment_id, user_id, consultant_id, rating, review_text) VALUES (?, ?, ?, ?, ?)',
            [appointmentId, userId, appointment.consultant_id, review.rating, review.review_text || null]
        );

        const [ratingData] = await pool.query(
            'SELECT AVG(rating) as avg_rating FROM reviews WHERE consultant_id = ?',
            [appointment.consultant_id]
        );

        await pool.query(
            'UPDATE consultants SET rating = ? WHERE id = ?',
            [parseFloat(ratingData[0].avg_rating).toFixed(2), appointment.consultant_id]
        );

        return {
            success: true,
            message: "Review added successfully"
        }
    } catch (error) {
        return {
            success: false,
            message: "Internal server error"
        }
    }
}

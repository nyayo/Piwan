import { pool } from "../config/db.js";

// Cancel all expired appointments (pending/confirmed) whose start time is more than 15 minutes in the past (UTC)
export const cancelExpiredAppointments = async () => {
    try {
        // Get all pending/confirmed appointments
        const [appointments] = await pool.query(
            `SELECT id, appointment_datetime FROM appointments 
             WHERE status IN ('pending', 'confirmed')`
        );
        const now = new Date();
        const expiredIds = [];
        for (const appt of appointments) {
            const apptStart = new Date(appt.appointment_datetime);
            if (!isNaN(apptStart.getTime())) {
                // Cancel if now > appointment start + 15 min
                if (now > new Date(apptStart.getTime() + 15 * 60000)) {
                    expiredIds.push(appt.id);
                }
            }
        }
        if (expiredIds.length > 0) {
            await pool.query(
                `UPDATE appointments SET status = 'cancelled', cancellation_reason = 'Missed/Expired', updated_at = CURRENT_TIMESTAMP WHERE id IN (?)`,
                [expiredIds]
            );
            console.log('Cancelled appointment IDs:', expiredIds);
        }
        return { success: true, cancelled: expiredIds.length };
    } catch (error) {
        console.error('Error cancelling expired appointments:', error);
        return { success: false, message: "Internal server error" };
    }
};

export const createAppointment = async(appointment, user_id) => {
    try {
        const [consultants] = await pool.query('SELECT * FROM consultants WHERE id = ?', [appointment.consultant_id]);
        if (consultants.length === 0) {
            return {success: false, message: "Consultant not found or inactive"}; 
        }

        const durationInMinutes = appointment.duration_minutes || 90;
        // appointment.appointment_datetime should be an ISO string in UTC
        const appointmentDateTime = new Date(appointment.appointment_datetime);
        if (isNaN(appointmentDateTime.getTime())) {
            return {success: false, message: "Invalid appointment_datetime"};
        }
        // Use full ISO string (UTC) for MySQL DATETIME fields
        const appointmentDateTimeStr = appointmentDateTime.toISOString();

        // Conflict check
        const [conflicts] = await pool.query(
            `SELECT id FROM appointments 
            WHERE consultant_id = ? 
            AND status IN ('pending', 'confirmed') 
            AND (
                (appointment_datetime <= ? AND DATE_ADD(appointment_datetime, INTERVAL duration_minutes MINUTE) > ?)
                OR
                (appointment_datetime < ? AND DATE_ADD(appointment_datetime, INTERVAL duration_minutes MINUTE) >= ?)
            )`,
            [
                appointment.consultant_id,
                appointmentDateTimeStr,
                appointmentDateTimeStr,
                appointmentDateTimeStr,
                appointmentDateTimeStr
            ]
        );

        if (conflicts.length > 0) {
            return {success: false, message: "Time slot is already booked"};
        }

        const [result] = await pool.query(
            `INSERT INTO appointments (user_id, consultant_id, title, description, appointment_datetime, duration_minutes, status, mood, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
            [
                user_id, 
                appointment.consultant_id, 
                appointment.title, 
                appointment.description || null, 
                appointmentDateTimeStr, 
                durationInMinutes,
                appointment.mood || null
            ]
        );
        
        return {
            success: true,
            message: 'Appointment created successfully',
            appointment: {
                id: result.insertId,
                ...appointment,
                user_id,
                status: 'pending',
                duration_minutes: durationInMinutes,
                appointment_datetime: appointmentDateTimeStr
            }
        }

    } catch (error) {
        console.error('Error creating appointment:', error);
        return {
            success: false,
            message: "Cannot create an appointment."
        }
    }
}

export const getAppointments = async(userId, userType, appointment = {}) => {
    try {
        // Cancel expired appointments before fetching
        await cancelExpiredAppointments();

        let query, params, countQuery, countParams;

        // Base query construction with reviews join
        if (userType === 'user') {
            query = `
                SELECT 
                    a.*, 
                    CONCAT(c.first_name, ' ', c.last_name) as consultant_name, 
                    c.email asconsultantr_email, 
                    c.phone as consultant_phone, 
                    c.profile_image, 
                    c.dob,
                    c.gender,
                    r.id as review_id,
                    r.rating,
                    r.review_text,
                    r.created_at as review_date
                FROM appointments a
                LEFT JOIN consultants c ON a.consultant_id = c.id
                LEFT JOIN reviews r ON a.id = r.appointment_id
                WHERE a.user_id = ?
            `;
            
            countQuery = `
                SELECT COUNT(DISTINCT a.id) as total
                FROM appointments a
                LEFT JOIN consultants c ON a.user_id = c.id
                LEFT JOIN reviews r ON a.id = r.appointment_id
                WHERE a.consultant_id = ?
            `;
            
            params = [userId];
            countParams = [userId];
        } else {
            query = `
                SELECT 
                    a.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as user_name, 
                    u.email as user_email, 
                    u.phone as user_phone, 
                    u.profile_image, 
                    u.dob,
                    u.gender,
                    r.id as review_id,
                    r.rating,
                    r.review_text,
                    r.created_at as review_date
                FROM appointments a
                LEFT JOIN users u ON a.user_id = u.id
                LEFT JOIN reviews r ON a.id = r.appointment_id
                WHERE a.consultant_id = ?
            `;
            
            countQuery = `
                SELECT COUNT(DISTINCT a.id) as total
                FROM appointments a
                LEFT JOIN users u ON a.user_id = u.id
                LEFT JOIN reviews r ON a.id = r.appointment_id
                WHERE a.consultant_id = ?
            `;
            
            params = [userId];
            countParams = [userId];
        }

        // Add filters
        if (appointment.status) {
            // Handle multiple statuses (comma-separated)
            const statuses = appointment.status.split(',').map(s => s.trim());
            const statusPlaceholders = statuses.map(() => '?').join(',');
            
            query += ` AND a.status IN (${statusPlaceholders})`;
            countQuery += ` AND a.status IN (${statusPlaceholders})`;
            
            params.push(...statuses);
            countParams.push(...statuses);
        }

        if (appointment.date_from) {
            query += ' AND a.appointment_datetime >= ?';
            countQuery += ' AND a.appointment_datetime >= ?';
            params.push(appointment.date_from);
            countParams.push(appointment.date_from);
        }

        if (appointment.date_to) {
            query += ' AND a.appointment_datetime <= ?';
            countQuery += ' AND a.appointment_datetime <= ?';
            params.push(appointment.date_to);
            countParams.push(appointment.date_to);
        }

        // Add date filter for exact day if provided
        if (appointment.date) {
            query += ' AND DATE(a.appointment_datetime) = ?';
            countQuery += ' AND DATE(a.appointment_datetime) = ?';
            params.push(appointment.date);
            countParams.push(appointment.date);
        }

        // Add filter for reviewed/unreviewed appointments
        if (appointment.reviewed === 'true') {
            query += ' AND r.id IS NOT NULL';
            countQuery += ' AND r.id IS NOT NULL';
        } else if (appointment.reviewed === 'false') {
            query += ' AND r.id IS NULL';
            countQuery += ' AND r.id IS NULL';
        }

        // Add ordering
        query += ' ORDER BY a.appointment_datetime DESC';

        // Add pagination
        const page = parseInt(appointment.page) || 1;
        const limit = parseInt(appointment.limit) || 10;
        const offset = (page - 1) * limit;

        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        // Execute queries
        const [appointments] = await pool.query(query, params);
        
        let total = 0;
        if (appointment.include_total === 'true') {
            const [countResult] = await pool.query(countQuery, countParams);
            total = countResult[0].total;
        }

        const result = {
            success: true,
            message: "Appointments fetched successfully.",
            appointments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        };

        // Include total in response if requested
        if (appointment.include_total === 'true') {
            result.total = total;
        }

        return result;
        
    } catch (error) {
        console.error('Database error:', error);
        return {
            success: false, 
            message: "Internal server Error"
        }
    }
}

export const getConsultantAvailability = async (consultantId, dateFrom, dateTo) => {
    try {
        const query = `
            SELECT appointment_datetime, status
            FROM appointments 
            WHERE consultant_id = ? 
            AND appointment_datetime BETWEEN ? AND ?
            AND status IN ('confirmed', 'pending')
            ORDER BY appointment_datetime ASC
        `;
        
        const [appointments] = await pool.query(query, [consultantId, dateFrom, dateTo]);

        return {
            success: true,
            message: "Availability fetched successfully.",
            appointments
        }
    } catch (error) {
        console.error('Database error:', error);
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

export const consultantReview = async(userId, consultantId, review) => {
    try {
        // Check if consultant exists
        const [consultants] = await pool.query(
            'SELECT * FROM consultants WHERE id = ?',
            [consultantId]
        );

        if (consultants.length === 0) {
            return {success: false, message: "Consultant not found"};
        }

        // Check if user has already reviewed this consultant
        const [existingReviews] = await pool.query(
            'SELECT id FROM reviews WHERE consultant_id = ? AND user_id = ?',
            [consultantId, userId]
        );

        if (existingReviews.length > 0) {
            return {success: false, message: "Review already exists for this consultant"};
        }

        // Optional: Check if user has had at least one completed appointment with this consultant
        const [completedAppointments] = await pool.query(
            'SELECT id FROM appointments WHERE user_id = ? AND consultant_id = ? AND status = "completed"',
            [userId, consultantId]
        );

        if (completedAppointments.length === 0) {
            return {success: false, message: "You must have a completed appointment with this consultant to leave a review"};
        }

        // Insert the review
        await pool.query(
            'INSERT INTO reviews (appointment_id, consultant_id, user_id, rating, review_text) VALUES (?, ?, ?, ?, ?)',
            [completedAppointments[0].id, consultantId, userId, review.rating, review.review_text || null]
        );

        // Update consultant's average rating
        const [ratingData] = await pool.query(
            'SELECT AVG(rating) as avg_rating FROM reviews WHERE consultant_id = ?',
            [consultantId]
        );

        await pool.query(
            'UPDATE consultants SET rating = ? WHERE id = ?',
            [parseFloat(ratingData[0].avg_rating).toFixed(2), consultantId]
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

export const fetchConsultantReviewsPaginated = async (consultantId, page, limit, sortBy, sortOrder) => {
    try {
        // First, verify the consultant exists
        const [consultantCheck] = await pool.query(
            'SELECT id, first_name, last_name FROM consultants WHERE id = ?',
            [consultantId]
        );

        if (consultantCheck.length === 0) {
            return {
                success: false,
                message: "Consultant not found"
            };
        }

        // Calculate offset
        const offset = (page - 1) * limit;

        // Get total count
        const [totalCount] = await pool.query(
            'SELECT COUNT(*) as total FROM reviews WHERE consultant_id = ?',
            [consultantId]
        );

        const total = totalCount[0].total;
        const totalPages = Math.ceil(total / limit);

        // Fetch paginated reviews
        const [reviews] = await pool.query(`
            SELECT 
                r.id,
                r.rating,
                r.review_text,
                r.created_at,
                u.first_name as user_first_name,
                u.last_name as user_last_name,
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.profile_image as user_profile_image
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.consultant_id = ?
            ORDER BY r.${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `, [consultantId, limit, offset]);

        // Get average rating and statistics
        const [avgRating] = await pool.query(
            'SELECT AVG(rating) as avg_rating FROM reviews WHERE consultant_id = ?',
            [consultantId]
        );

        return {
            success: true,
            reviews: reviews.map(review => ({
                id: review.id,
                rating: review.rating,
                review_text: review.review_text,
                created_at: review.created_at,
                user_name: review.user_name,
                user_profile_image: review.user_profile_image
            })),
            pagination: {
                current_page: page,
                total_pages: totalPages,
                total_reviews: total,
                reviews_per_page: limit,
                has_next: page < totalPages,
                has_previous: page > 1
            },
            statistics: {
                average_rating: avgRating[0].avg_rating ? parseFloat(avgRating[0].avg_rating).toFixed(2) : 0
            }
        };
    } catch (error) {
        console.error('Error in fetchConsultantReviewsPaginated:', error);
        return {
            success: false,
            message: "Internal server error"
        };
    }
}

// Block a slot for a consultant (status: 'blocked', no patient_id)
export const blockAppointmentSlot = async ({ consultant_id, appointment_datetime, duration_minutes = 90 }) => {
    try {
        // Check for existing blocked slot at this time
        const [conflicts] = await pool.query(
            `SELECT id FROM appointments WHERE consultant_id = ? AND appointment_datetime = ? AND status = 'blocked'`,
            [consultant_id, appointment_datetime]
        );
        if (conflicts.length > 0) {
            return { success: false, message: 'Slot already blocked' };
        }
        await pool.query(
            `INSERT INTO appointments (consultant_id, appointment_datetime, duration_minutes, status, user_id, created_at, updated_at) VALUES (?, ?, ?, 'blocked', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [consultant_id, appointment_datetime, duration_minutes]
        );
        return { success: true };
    } catch (error) {
        console.error('Error blocking slot:', error);
        return { success: false, message: 'Internal server error' };
    }
};

// Confirm a pending appointment (consultant only)
export const confirmAppointment = async (consultantId, appointmentId) => {
    try {
        const [appointments] = await pool.query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
        if (appointments.length === 0) {
            return { success: false, message: 'Appointment not found' };
        }
        const appointment = appointments[0];
        if (appointment.consultant_id !== consultantId) {
            return { success: false, message: 'Not authorized to confirm this appointment' };
        }
        if (appointment.status !== 'pending') {
            return { success: false, message: 'Only pending appointments can be confirmed' };
        }
        await pool.query(
            'UPDATE appointments SET status = \'confirmed\', updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [appointmentId]
        );
        return { success: true, message: 'Appointment confirmed' };
    } catch (error) {
        console.error('Error confirming appointment:', error);
        return { success: false, message: 'Internal server error' };
    }
};

// Reject a pending appointment (consultant only)
export const rejectAppointment = async (consultantId, appointmentId) => {
    try {
        const [appointments] = await pool.query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
        if (appointments.length === 0) {
            return { success: false, message: 'Appointment not found' };
        }
        const appointment = appointments[0];
        if (appointment.consultant_id !== consultantId) {
            return { success: false, message: 'Not authorized to reject this appointment' };
        }
        if (appointment.status !== 'pending') {
            return { success: false, message: 'Only pending appointments can be rejected' };
        }
        await pool.query(
            'UPDATE appointments SET status = \'rejected\', updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [appointmentId]
        );
        return { success: true, message: 'Appointment rejected' };
    } catch (error) {
        console.error('Error rejecting appointment:', error);
        return { success: false, message: 'Internal server error' };
    }
};

// Reschedule an appointment (user or consultant)
export const rescheduleAppointment = async (userId, userType, appointmentId, newDateTime) => {
    try {
        const [appointments] = await pool.query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
        if (appointments.length === 0) {
            return { success: false, message: "Appointment not found" };
        }
        const appointment = appointments[0];
        // Only the consultant or user who owns the appointment can reschedule
        if (
            (userType === 'consultant' && appointment.consultant_id !== userId) ||
            (userType === 'user' && appointment.user_id !== userId)
        ) {
            return { success: false, message: "Not authorized to reschedule this appointment" };
        }
        // Check for conflicts (reuse your conflict logic)
        const [conflicts] = await pool.query(
            `SELECT id FROM appointments 
             WHERE consultant_id = ? 
             AND id != ? 
             AND status IN ('pending', 'confirmed') 
             AND (
                (appointment_datetime <= ? AND DATE_ADD(appointment_datetime, INTERVAL duration_minutes MINUTE) > ?)
                OR
                (appointment_datetime < ? AND DATE_ADD(appointment_datetime, INTERVAL duration_minutes MINUTE) >= ?)
             )`,
            [
                appointment.consultant_id,
                appointmentId,
                newDateTime, newDateTime,
                newDateTime, newDateTime
            ]
        );
        if (conflicts.length > 0) {
            return { success: false, message: "Time slot is already booked" };
        }
        await pool.query(
            'UPDATE appointments SET appointment_datetime = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newDateTime, 'pending', appointmentId]
        );
        return { success: true, message: "Appointment rescheduled successfully" };
    } catch (error) {
        console.error('Error rescheduling appointment:', error);
        return { success: false, message: "Internal server error" };
    }
};

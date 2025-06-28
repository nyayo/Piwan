import { createAppointment, getAppointments, updateStatus, consultantReview, getConsultantAvailability, fetchConsultantReviewsPaginated, cancelExpiredAppointments } from "../services/AppointmentServices.js"
import { logActivity } from "../routes/activityRoutes.js";

export const create = async(req, res) => {
    const { consultant_id, title, description, appointment_datetime, duration_minutes } = req.body;
    const user_id = req.user.id;

    if (req.user.role !== 'user') {
        return res.status(403).json({ error: 'Only users can create appointments' });
    }

    // Validate required fields
    if (!consultant_id || !appointment_datetime) {
        return res.status(400).json({ 
            success: false, 
            message: 'Consultant ID and appointment_datetime are required' 
        });
    }

    const appointment = { 
        consultant_id, 
        title: title || 'Consultation', 
        description, 
        appointment_datetime, 
        duration_minutes 
    };

    try {
        const response = await createAppointment(appointment, user_id);
        if(response.success){
            // Log activity for user
            await logActivity(req.user.id, req.user.role, 'appointment_create', `Created appointment with consultant ID ${consultant_id}`);
            return res.status(201).json(response);
        } else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Error in create appointment controller:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to create an appointment. Please try again later.' 
        });
    }
}

export const get = async(req, res) => {
    const userId = req.user.id;
    const userType = req.user.role;
    const { status, date_from, date_to } = req.body;

    const appointment = { status, date_from, date_to };

    try {
        // Cancel expired appointments before fetching
        await cancelExpiredAppointments();
        const response = await getAppointments(userId, userType, appointment);
        if(response.success){
            return res.status(200).json(response);
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'No appointments found. Please try again later.' });
    }
}

export const getAvailableAppointments = async(req, res) => {
        try {
            const { consultantId } = req.params;
            const { date_from, date_to } = req.query;
            
            if (!date_from || !date_to) {
                return res.status(400).json({
                    success: false,
                    message: "date_from and date_to are required"
                });
            }
            
            const result = await getConsultantAvailability(consultantId, date_from, date_to);
            
            if (result.success) {
                res.json(result);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
}

export const getUserAppointments = async(req, res) => {
    try {
        const { userId } = req.params;
        const appointment = req.query;
        // Cancel expired appointments before fetching
        await cancelExpiredAppointments();
        const result = await getAppointments(userId, 'user', appointment);
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

export const getConsultantAppointments = async(req, res) => {
    try {
        const { consultantId } = req.params;
        const appointment = req.query;
        // Cancel expired appointments before fetching
        await cancelExpiredAppointments();
        const result = await getAppointments(consultantId, 'consultant', appointment);
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

export const update = async(req, res) => {
    const appointmentId = req.params.id;
    const { status, cancellation_reason } = req.body;
    const userId = req.user.id;
    const userType = req.user.role;
    const statusUpdate = { status, cancellation_reason };

    try {
        const response = await updateStatus(userId, userType, appointmentId, statusUpdate);
        if(response.success){
            return res.status(200).json(response);
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to update appointment status. Please try again later.' });
    }
}

export const review = async(req, res) => {
    const consultantId = req.params.id;
    const { rating, review_text } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'user') {
        return res.status(403).json({ error: 'Only users can leave reviews' });
    }

    const review = { rating, review_text };

    try {
        const response = await consultantReview(userId, consultantId, review);
        if(response.success){
            return res.status(200).json(response);
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to review an appointment. Please try again later.' });
    }
}

export const getConsultantReviewsPaginated = async (req, res) => {
    const consultantId = req.params.consultantId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'created_at'; // created_at, rating
    const sortOrder = req.query.sortOrder || 'DESC'; // ASC, DESC

    // Validate consultant ID
    if (!consultantId || isNaN(consultantId)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Valid consultant ID is required' 
        });
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 50) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid pagination parameters' 
        });
    }

    // Validate sorting parameters
    const validSortFields = ['created_at', 'rating'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (!validSortFields.includes(sortBy) || !validSortOrders.includes(sortOrder)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid sorting parameters' 
        });
    }

    try {
        const response = await fetchConsultantReviewsPaginated(
            consultantId, 
            page, 
            limit, 
            sortBy, 
            sortOrder
        );
        
        if (response.success) {
            return res.status(200).json(response);
        } else {
            return res.status(404).json(response);
        }
    } catch (error) {
        console.error('Error in getConsultantReviewsPaginated controller:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch consultant reviews. Please try again later.' 
        });
    }
};

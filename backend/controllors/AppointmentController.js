import { createAppointment, getAppointments, updateStatus, appointmentReview } from "../services/AppointmentServices.js"

export const create = async(req, res) => {
    const { consultant_id, title, description, appointment_date, duration_minutes } = req.body;
    const user_id = req.user.id;

    if (req.user.role !== 'user') {
        return res.status(403).json({ error: 'Only users can create appointments' });
    }

    const appointment = { consultant_id, title, description, appointment_date, duration_minutes };

    try {
        const response = await createAppointment(appointment, user_id);
        if(response.success){
            return res.status(200).json(response);
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to create an appointment. Please try again later.' });
    }
}

export const get = async(req, res) => {
    const userId = req.user.id;
    const userType = req.user.role;
    const { status, date_from, date_to } = req.body;

    const appointment = { status, date_from, date_to };

    try {
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
    const appointmentId = req.params.id;
    const { rating, review_text } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'user') {
        return res.status(403).json({ error: 'Only users can leave reviews' });
    }

    const review = { rating, review_text };

    try {
        const response = await appointmentReview(userId, appointmentId, review);
        if(response.success){
            return res.status(200).json(response);
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to review an appointment. Please try again later.' });
    }
}

import { getUserAppointments, cancelAppointment } from '../services/api';

/**
 * Simple function to cancel appointments that have passed their date/time
 * @param {string} userId - The user ID to check appointments for
 * @returns {Promise<number>} Number of appointments cancelled
 */
export const cancelExpiredAppointments = async (userId) => {
    try {
        // Get pending/confirmed appointments
        const result = await getUserAppointments(userId, {
        status: 'pending,confirmed'
        });

        if (!result.success) return 0;

        const appointments = result.appointments || [];
        const now = new Date();
        let cancelledCount = 0;

        // Check each appointment
        for (const appointment of appointments) {
        // Extract date from the ISO string and combine with time
        let appointmentDateTime;
        
        try {
            // Get the date part from ISO string (2025-06-27T21:00:00.000Z -> 2025-06-27)
            const dateOnly = appointment.appointment_date.split('T')[0];
            
            // Combine date with appointment time
            if (appointment.appointment_time) {
            appointmentDateTime = new Date(`${dateOnly}T${appointment.appointment_time}`);
            } else {
            appointmentDateTime = new Date(dateOnly);
            }

            // Check if date is valid
            if (isNaN(appointmentDateTime.getTime())) {
            continue;
            }
        } catch (error) {
            continue;
        }
        
        // If appointment time has passed, cancel it
        if (appointmentDateTime < now) {
            
            const cancelResult = await cancelAppointment(appointment, {
            status: 'cancelled',
            cancellation_reason: 'Appointment time has passed'
            });

            if (cancelResult.success) {
            cancelledCount++;
            }
        }
        }

        console.log(`Total appointments cancelled: ${cancelledCount}`);
        return cancelledCount;
    } catch (error) {
        console.error('Error cancelling expired appointments:', error);
        return 0;
    }
};
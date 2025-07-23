import { 
    getProfile, 
    getUserDetails, 
    getConsultantDetails, 
    getConsultants, 
    getUsers,
    deleteUser, 
    deleteConsultant, 
    updateProfile,
    saveUserPushToken,
    sendPushNotificationToUser,
    saveConsultantPushToken as saveConsultantPushTokenService,
    sendPushNotificationToConsultant as sendPushNotificationToConsultantService,
    saveNotification,
    getNotificationsForUser,
    getNotificationsForConsultant,
    markNotificationAsRead,
    updateUserNotificationPreference,
    updateConsultantNotificationPreference
} from "../services/UserServices.js";
import { logActivity } from "../routes/activityRoutes.js";

export const profile = async (req, res) => {
    try {
        const response = await getProfile(req);
        if(response.success){
            // Log activity for profile view
            // await logActivity(req.user.id, req.user.role, 'profile_view', 'Viewed profile');
            return res.status(200).json(response); 
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
}

export const user = async(req, res) => {
    try {
        const response = await getUserDetails(req);
        if(response.success){
            return res.status(200).json(response); 
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('User error:', error);
        res.status(500).json({ error: 'Failed to fetch user details.' });
    }
}

export const consultant = async(req, res) => {
    try {
        const response = await getConsultantDetails(req);
        if(response.success){
            return res.status(200).json(response); 
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Consultant error:', error);
        res.status(500).json({ error: 'Failed to fetch consultant details.' });
    }
}

export const consultants = async(req, res) => {
    try {
        const response = await getConsultants(req);
        if(response.success){
            return res.status(200).json(response); 
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Consultants error:', error);
        res.status(500).json({ error: 'Failed to fetch consultants.' });
    }
}

export const users = async(req, res) => {
    try {
        const response = await getUsers(req);
        if(response.success){
            return res.status(200).json(response); 
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Users error:', error);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
}

export const del_user = async(req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const response = await deleteUser(req);
        if(response.success){
            return res.status(200).json(response); 
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete user. Please try again later."
        });
    }
}

export const del_consultant = async(req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const response = await deleteConsultant(req);
        if(response.success){
            return res.status(200).json(response); 
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete consultant. Please try again later."
        });
    }
}

export const prof_update = async(req, res) => {
    const { username, email, first_name, last_name, phone, profile_image } = req.body;
    const currentEmail = req.user.email;

    const fieldsToUpdate = { username, email, first_name, last_name, phone, profile_image };
    const hasValidFields = Object.values(fieldsToUpdate).some(field => field !== undefined && field !== null && field !== '');
    if (!hasValidFields) {
        return res.status(400).json({ success: false, message: "At least one field is required to update." });
    }

    try {
        const response = await updateProfile(currentEmail, fieldsToUpdate, req);
        if(response.success){
            // Log activity for profile update
            await logActivity(req.user.id, req.user.role, 'profile_update', 'Updated profile');
            return res.status(200).json(response); 
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update profile. Please try again later."
        });
    }
}

export const savePushToken = async (req, res) => {
    try {
        const { userId, pushToken } = req.body;
        if (!userId || !pushToken) {
        return res.status(400).json({ error: 'userId and pushToken are required' });
        }
        await saveUserPushToken(userId, pushToken);
        res.status(200).json({ message: 'Push token saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const sendPushNotification = async (req, res) => {
    try {
        const { userId, title, body, data } = req.body;
        if (!userId || !title || !body) {
        return res.status(400).json({ error: 'userId, title, and body are required' });
        }
        const result = await sendPushNotificationToUser(userId, title, body, data);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const saveConsultantPushToken = async (req, res) => {
    try {
        const { consultantId, pushToken } = req.body;
        if (!consultantId || !pushToken) {
        return res.status(400).json({ error: 'consultantId and pushToken are required' });
        }
        await saveConsultantPushTokenService(consultantId, pushToken);
        res.status(200).json({ message: 'Consultant push token saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const sendPushNotificationToConsultant = async (req, res) => {
    try {
        const { consultantId, title, body, data } = req.body;
        if (!consultantId || !title || !body) {
        return res.status(400).json({ error: 'consultantId, title, and body are required' });
        }
        const result = await sendPushNotificationToConsultantService(consultantId, title, body, data);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const saveNotificationController = async (req, res) => {
    try {
        const { userId, consultantId, title, body, data } = req.body;
        await saveNotification({ userId, consultantId, title, body, data });
        res.status(200).json({ success: true, message: "Notification saved" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await getNotificationsForUser(userId);
        res.status(200).json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getConsultantNotifications = async (req, res) => {
    // Log the incoming headers and user for debugging
    console.log('Authorization header:', req.headers.authorization);
    console.log('Decoded req.user:', req.user);
    
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    
    let consultantId = req.user.id || req.user.userId || req.user.sub;
    console.log('Raw consultantId from token:', consultantId, 'Type:', typeof consultantId);
    
    if (!consultantId) {
        console.error('No consultant ID found in token. Token payload:', req.user);
        return res.status(400).json({ success: false, message: 'Invalid authentication token - missing user ID.' });
    }
    
    consultantId = Number(consultantId);
    if (isNaN(consultantId)) {
        console.error('Consultant ID is not a valid number:', consultantId);
        return res.status(400).json({ success: false, message: 'Consultant ID is not a valid number.' });
    }
    
    try {
        const notifications = await getNotificationsForConsultant(consultantId);
        console.log('Fetched notifications for consultantId', consultantId, ':', notifications);
        res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error('Error fetching consultant notifications:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markNotificationRead = async (req, res) => {
    try {
        const { notificationId } = req.body;
        await markNotificationAsRead(notificationId);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateNotificationPreference = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    const { enabled } = req.body;
    try {
        let result;
        if (role === 'consultant') {
            result = await updateConsultantNotificationPreference(userId, enabled);
        } else {
            result = await updateUserNotificationPreference(userId, enabled);
        }
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
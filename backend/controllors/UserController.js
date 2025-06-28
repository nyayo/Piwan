import { 
    getProfile, 
    getUserDetails, 
    getConsultantDetails, 
    getConsultants, 
    getUsers,
    deleteUser, 
    deleteConsultant, 
    updateProfile
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
        const response = await getConsultants();
        if(response.success){
            return res.status(200).json(response); 
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Consultant error:', error);
        res.status(500).json({ error: 'Failed to fetch consultants.' });
    }
}

export const users = async(req, res) => {
    try {
        const response = await getUsers();
        if(response.success){
            return res.status(200).json(response); 
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Consultant error:', error);
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
        return {
            success: false,
            message: "Failed to delete user. Please try again later."
        }
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
        return {
            success: false,
            message: "Failed to delete user. Please try again later."
        }
    }
}

export const prof_update = async(req, res) => {
    const { username, email, first_name, last_name, phone, profile_image } = req.body;
    const currentEmail = req.user.email;

    const fieldsToUpdate = { username, email, first_name, last_name, phone, profile_image };
    const hasValidFields = Object.values(fieldsToUpdate).some(field => field !== undefined && field !== null && field !== '');
    if (!hasValidFields) {
        return { success: false, message: "At least one field is required to update." };
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
        return {
            success: false,
            message: "Failed to delete user. Please try again later."
        }
    }
}




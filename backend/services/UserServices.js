import { pool } from "../config/db.js";
import { sendPushNotificationAsync } from './NotificationService.js';

export const getProfile = async(req) => {
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [req.user.email]);
        let profile = null;

        if (users && users.length > 0) {
            profile = users[0];
        } else {
            const [consultants] = await pool.query('SELECT * FROM consultants WHERE email = ?', [req.user.email]);
            if (consultants && consultants.length > 0){
                profile = consultants[0];
            }else {
                const [admins] = await pool.query('SELECT * FROM admin WHERE email = ?', [req.user.email]);
                if(admins && admins.length > 0){
                    profile = admins[0]; 
                }
            }
        }

        if(!profile || profile.length === 0){
            return {success: false, message: "User profile not found."}
        }

        return {
            success: true,
            message: "User profile retrieved.",
            user: {
                id: profile.id,
                username: profile.username, 
                first_name: profile.first_name,
                last_name: profile.last_name,
                email: profile.email,
                profile_image: profile.profile_image,
                role: profile.role
            }
        }
    } catch (error) {
        return {success: false, message: "Profile not found. Please try again later."};
    }
}

export const getUserDetails = async(req) => {
    try {
        const [users] = await pool.query(`
        SELECT id, email, username, first_name, last_name, role, created_at
        FROM users 
        WHERE id = ?
        `, [req.params.id]);

        if (users.length === 0) {
            return { success: false, message: "User not found" };
        }

        const user = users[0];
        return {
            success: true,
            message: "User details fetched.",
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                created_at: user.created_at
            }
        }
    } catch (error) {
        return {
            success: false,
            message: "Failed to fetch user data."
        }
    }
}

export const getConsultantDetails = async(req) => {
    try {
        const [consultants] = await pool.query(`
        SELECT id, email, username, first_name, last_name, role, created_at
        FROM consultants 
        WHERE id = ?
        `, [req.params.id]);

        if (consultants.length === 0) {
            return { success: false, message: "Consultant not found" };
        }

        const consultant = consultants[0];
        return {
            success: true,
            message: "Consultant details fetched.",
            consultant: {
                id: consultant.id,
                email: consultant.email,
                username: consultant.username,
                first_name: consultant.first_name,
                last_name: consultant.last_name,
                role: consultant.role,
                created_at: consultant.created_at
            }
        }
    } catch (error) {
        return {
            success: false,
            message: "Failed to fetch consultant data."
        }
    }
}

export const getConsultants = async(req) => {
    try {
        const { page = 1, limit = 10, profession, search, sortBy = 'id', sortOrder = 'DESC' } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT *
            FROM consultants
        `;
        const queryParams = [];
        
        const whereClauses = [];
        if (profession) {
            whereClauses.push('profession = ?');
            queryParams.push(profession);
        }
        if (search) {
            whereClauses.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }
        
        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }
        
        query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
        queryParams.push(Number(limit), Number(offset));
        
        const [consultants] = await pool.query(query, queryParams);
        
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM consultants${whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : ''}`,
            queryParams.slice(0, -2)
        );
        
        const total = countResult[0].total;
        
        return {
            success: true,
            message: "Fetched consultants",
            consultants,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    } catch (error) {
        console.log('Fetch Error: ', error)
        return {
            success: false,
            message: "Failed to fetch consultants data."
        }
    }
}

export const getUsers = async(req) => {
    try {
        const { page = 1, limit = 10, role, search, sortBy = 'id', sortOrder = 'DESC' } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT id, email, username, first_name, last_name, role, created_at, dob, profile_image, gender, updated_at
            FROM users
        `;
        const queryParams = [];
        
        const whereClauses = [];
        if (role) {
            whereClauses.push('role = ?');
            queryParams.push(role);
        }
        if (search) {
            whereClauses.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }
        
        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }
        
        query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
        queryParams.push(Number(limit), Number(offset));
        
        const [users] = await pool.query(query, queryParams);
        
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM users${whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : ''}`,
            queryParams.slice(0, -2)
        );
        
        const total = countResult[0].total;
        
        return {
            success: true,
            message: "Fetched users",
            users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    } catch (error) {
        return {
            success: false,
            message: "Failed to fetch users data."
        }
    }
}

export const deleteUser = async(req) => {
    try {
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return {success: false, message: "User not found"};
        }
        return {
            success: true,
            message: "User deleted."
        };
    } catch (error) {
        return {
            success: false,
            message: "Failed to delete user data."
        }
    }
}

export const deleteConsultant = async(req) => {
    try {
        const [result] = await pool.query('DELETE FROM consultants WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return {success: false, message: "Consultant not found"};
        }
        return {
            success: true,
            message: "Consultant deleted."
        };
    } catch (error) {
        return {
            success: false,
            message: "Failed to delete consultant data."
        }
    }
}

export const updateProfile = async(currentEmail, fieldsToUpdate, req) => {
    try {
        const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [currentEmail]);
        let userTable = null;
        let userId = null;
        console.log(users)

        if (users && users.length > 0) {
            userTable = 'users';
            userId = users[0].id;
            console.log(userTable, userId);
        } else {
            const [consultants] = await pool.query('SELECT id FROM consultants WHERE email = ?', [currentEmail]);
            if (consultants && consultants.length > 0) {
                userTable = 'consultants';
                userId = consultants[0].id;
                console.log(userTable, userId);
            } else {
                const [admins] = await pool.query('SELECT id FROM admin WHERE email = ?', [currentEmail]);
                if (admins && admins.length > 0) {
                    userTable = 'admin';
                    userId = admins[0].id;
                    console.log(userTable, userId);
                }
            }
        }
        console.log(userTable, userId);

        if (!userTable || !userId) {
            return { success: false, message: "User profile not found." };
        }

        // Build dynamic update query
        let updateFields = [];
        let updateValues = [];

        Object.entries(fieldsToUpdate).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                updateFields.push(`${key} = ?`);
                updateValues.push(value);
            }
        });

        updateValues.push(userId);

        const updateQuery = `UPDATE ${userTable} SET ${updateFields.join(', ')} WHERE id = ?`;
        
        const [result] = await pool.query(updateQuery, updateValues);

        if (result.affectedRows === 0) {
            return { success: false, message: "Failed to update profile. No changes made." };
        }

        // Get updated profile data
        const updatedProfile = await getProfile(req);
        
        return {
            success: true,
            message: "Profile updated successfully.",
            user: updatedProfile.success ? updatedProfile.user : null
        };
    } catch (error) {
        return {
            success: false,
            message: "Failed to update profile info."
        }
    }
}

export const saveUserPushToken = async (userId, pushToken) => {
    const query = 'UPDATE users SET push_token = ? WHERE id = ?';
    await pool.query(query, [pushToken, userId]);
};

export const sendPushNotificationToUser = async (userId, title, body, data) => {
    const [rows] = await pool.query('SELECT push_token, push_notifications_enabled FROM users WHERE id = ?', [userId]);
    if (!rows.length || !rows[0].push_token || rows[0].push_notifications_enabled === false) {
        return { success: false, message: 'Push notifications disabled or token not found.' };
    }
    const result = await sendPushNotificationAsync(rows[0].push_token, title, body, data);
    await saveNotification({ userId, title, body, data });
    return result;
};

export const saveConsultantPushToken = async (consultantId, pushToken) => {
    const query = 'UPDATE consultants SET push_token = ? WHERE id = ?';
    await pool.query(query, [pushToken, consultantId]);
};

export const sendPushNotificationToConsultant = async (consultantId, title, body, data) => {
    const [rows] = await pool.query('SELECT push_token, push_notifications_enabled FROM consultants WHERE id = ?', [consultantId]);
    if (!rows.length || !rows[0].push_token || rows[0].push_notifications_enabled === false) {
        return { success: false, message: 'Push notifications disabled or token not found.' };
    }
    const result = await sendPushNotificationAsync(rows[0].push_token, title, body, data);
    await saveNotification({ consultantId, title, body, data });
    return result;
};

// --- Notification Persistence ---
export const saveNotification = async ({ userId, consultantId, title, body, data }) => {
    const query = `
        INSERT INTO notifications (user_id, consultant_id, title, body, data)
        VALUES (?, ?, ?, ?, ?)
    `;
    await pool.query(query, [userId || null, consultantId || null, title, body, JSON.stringify(data || {})]);
};

export const getNotificationsForUser = async (userId) => {
    const [rows] = await pool.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
    );
    return rows;
};

export const getNotificationsForConsultant = async (consultantId) => {
    const [rows] = await pool.query(
        'SELECT * FROM notifications WHERE consultant_id = ? ORDER BY created_at DESC',
        [consultantId]
    );
    return rows;
};

export const markNotificationAsRead = async (notificationId) => {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [notificationId]);
};

export const updateUserNotificationPreference = async (userId, enabled) => {
    const query = 'UPDATE users SET push_notifications_enabled = ? WHERE id = ?';
    await pool.query(query, [enabled, userId]);
    return { success: true, message: 'Notification preference updated.' };
};

export const updateConsultantNotificationPreference = async (consultantId, enabled) => {
    const query = 'UPDATE consultants SET push_notifications_enabled = ? WHERE id = ?';
    await pool.query(query, [enabled, consultantId]);
    return { success: true, message: 'Notification preference updated.' };
};
import { pool } from "../config/db.js";

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

        if(!profile || profile === 0){
            return {success: false, message: "User profile not found."}
        }

        return {
            success: true,
            message: "User profile retrived.",
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
        SELECT *
        FROM users 
        WHERE id = ?
        `, [req.params.id]);

        if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        return {
            success: true,
            message: "User details fetched.",
            user: {
                id: user.id,
                email: user.email,
                username: user.username
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
        SELECT *
        FROM consultants 
        WHERE id = ?
        `, [req.params.id]);

        if (consultants.length === 0) {
        return res.status(404).json({ error: 'Consultant not found' });
        }

        const user = consultants[0];
        return {
            success: true,
            message: "User details fetched.",
            consultant: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        }
    } catch (error) {
        return {
            success: false,
            message: "Failed to fetch user data."
        }
    }
}

export const getConsultants = async() => {
    try {
        const [consultants] = await pool.query(`
        SELECT *
        FROM consultants 
        ORDER BY id DESC
        `);

        if (consultants.length === 0) {
        return res.status(404).json({ error: 'Consultant not found' });
        }

        return {
            success: true,
            message: "Fetched consultants",
            consultants
        }
    } catch (error) {
        return {
            success: false,
            message: "Failed to fetch consultants data."
        }
    }
}

export const getUsers = async() => {
    try {
        const [users] = await pool.query(`
        SELECT *
        FROM users 
        ORDER BY id DESC
        `);

        if (users.length === 0) {
        return res.status(404).json({ error: 'Users not found' });
        }

        return {
            success: true,
            message: "Fetched users",
            users
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
            success: "User deleted."
        };
    } catch (error) {
        return {
            success: false,
            message: "Failed to delete users data."
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
            success: "Consultant deleted."
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

        if (users && users.length > 0) {
            userTable = 'users';
            userId = users[0].id;
        } else {
            const [consultants] = await pool.query('SELECT id FROM consultants WHERE email = ?', [currentEmail]);
            if (consultants && consultants.length > 0) {
                userTable = 'consultants';
                userId = consultants[0].id;
            } else {
                const [admins] = await pool.query('SELECT id FROM admin WHERE email = ?', [currentEmail]);
                if (admins && admins.length > 0) {
                    userTable = 'admin';
                    userId = admins[0].id;
                }
            }
        }

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
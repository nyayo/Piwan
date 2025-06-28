import { pool } from "../config/db.js"
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUser = async(user) => {
    try {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        const query = `INSERT INTO users (username, email, password) VALUES (?,?,?)`;
        const values = [user.username, user.email, hashedPassword];

        const [result] = await pool.query(query, values);
        const userId = result.insertId;
        const role = 'user';
        
        const response = {
            success: true, 
            message: 'User Registered Successfully.',
            user: {
                id: userId,
                email: user.email,
                username: user.username,
                role
            }
        };
        return response;
        
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return { success: false, message: 'Email already exists' };
        }
        
        return { 
            success: false, 
            message: 'Registration failed: ' + error.message 
        };
    }
};

export const registerConsultant = async(user) => {
    try {
        const hashedPassword = await bcrypt.hash(user.password, 10)
        const query = `INSERT INTO consultants (username, first_name, last_name, email, password) VALUES (?,?,?,?,?)`
        const values = [user.username, user.first_name, user.last_name, user.email, hashedPassword];

        await pool.query(query, values);
        return {success: true, message: 'Consultant Registered Successfully.'}
    } catch (error) {
        return {success: false, message: 'Registration failed.'}
    }
}

export const loginUser = async(email, password) => { 
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        let user = null;
        let role = null;

        if(users && users.length > 0) {
            user = users[0];
            role = user.role;
        }else {
            const [admins] = await pool.query('SELECT * FROM admin WHERE email = ?', [email]);

            if(admins && admins.length > 0) {
                user = admins[0];
                role = user.role;
            } else{
                const [consultants] = await pool.query('SELECT * FROM consultants WHERE email = ?', [email]);

                if(consultants && consultants.length > 0){
                    user = consultants[0];
                    role = user.role;
                }
            }
        }

        if (!user || user.length === 0) {
            return {success: false, message: "User or admin does not exists."};
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return {success: false, message: "Invalid credentials."};
        }

        return {
            success: true,
            message: 'Login Successful',  
            user
        };
    } catch (error) {
        return {success: false, message: "Login failed. Please try again later."};
    }
}

// Store refresh token in DB
export const storeRefreshToken = async (userId, refreshToken) => {
    // Create table if not exists: CREATE TABLE refresh_tokens (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, token VARCHAR(512), created_at DATETIME DEFAULT CURRENT_TIMESTAMP)
    await pool.query('INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)', [userId, refreshToken]);
};

// Remove refresh token from DB (logout/revoke)
export const revokeRefreshToken = async (refreshToken) => {
    await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
};

// Find refresh token in DB
export const findRefreshToken = async (refreshToken) => {
    const [rows] = await pool.query('SELECT * FROM refresh_tokens WHERE token = ?', [refreshToken]);
    return rows.length > 0;
};

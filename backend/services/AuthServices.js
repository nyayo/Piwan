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
        
        const token = jwt.sign(
            { id: userId, email: user.email, role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );
        const response = {
            success: true, 
            message: 'User Registered Successfully.',
            token,
            user: {
                id: userId,
                email: user.email,
                username: user.username,
                role
            }
        };
        return response;
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return { success: false, message: 'Token creation failed' };
        }
        
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


        const token = jwt.sign({ id: user.id, email: user.email, role }, process.env.JWT_SECRET, {expiresIn: '1h'});

        return {
            success: true,
            message: 'Login Successful',  
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role
            }
        };
    } catch (error) {
        return {success: false, message: "Login failed. Please try again later."};
    }
}

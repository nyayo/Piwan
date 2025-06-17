import {registerUser, loginUser, registerConsultant} from '../services/AuthServices.js';
import { pool } from "../config/db.js";

export const register = async(req, res) => {
    const {username, email, password} = req.body;  

        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username, email, and password are required' 
            });
        }

    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

    const user = {username, email, password};

    try {
        const response = await registerUser(user);
        if(response.success){
            return res.status(201).json(response); 
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        return {success: false, message: 'Registration failed. Please try again later.'}
    }
}

export const consultant = async(req, res) => {
    const {username, first_name, last_name, email, password} = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ errors: errors.array() });
    }

    const [existingUsers] = await pool.query('SELECT * FROM consultants WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

    const user = {username, first_name, last_name, email, password};

    try {
        const response = await registerConsultant(user);
        if(response.success){
            return res.status(200).json(response); 
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        return {success: false, message: 'Registration failed. Please try again later.'}
    }
}

export const login = async(req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const response = await loginUser(email, password);
        if(response.success){
            return res.status(200).json(response); 
        }else {
            return res.status(400).json(response);
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Login failed. Please try again later.' });
    }
} 


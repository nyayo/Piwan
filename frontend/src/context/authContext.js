import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginUser, registerUser, logoutUser, getStoredToken, getStoredUserData } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check if user is already logged in on app start
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = await getStoredToken();
            const userData = await getStoredUserData();
            if (token && userData) {
                setUser(userData);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.log('Auth check failed:', error);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await loginUser(email, password);
            if (response.success) {
                setUser(response.user);
                setIsAuthenticated(true);
                return { success: true };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const register = async(username, email, password) => {
        try {
            const response = await registerUser(username, email, password);
            if (response.success) {
                setUser(response.user);
                setIsAuthenticated(true);
                return { success: true, message: response.message };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const logout = async () => {
        await logoutUser();
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        setLoading,
        login,
        register,
        logout,
        setUser
    };
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
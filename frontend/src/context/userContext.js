import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoredToken, getStoredUserData, getUserProfile } from '../services/api';

const UserContext = createContext({});

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within an UserProvider');
    }
    return context;
};

export const UserProvider = ({ children }) => {
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
        }
        } catch (error) {
            console.log('Auth check failed:', error);
        } finally {
            setLoading(false);
        }
    };
    const profile = async() => {
        try {
            const response = await getUserProfile()

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
    }

    const value = {
        user,
        isAuthenticated,
        loading,
        setLoading,
        profile
    };
    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}
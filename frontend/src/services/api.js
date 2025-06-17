import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure base URL (update with your backend URL)
const API_BASE_URL = ' https://876a-154-227-129-150.ngrok-free.app/api'; // Use your local IP
// For development on physical device, use your computer's IP address
// For iOS simulator: http://localhost:3000/api
// For Android emulator: http://10.0.2.2:3000/api

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

// Utility functions
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data.message || 'Server error',
      status: error.response.status
    };
  } else if (error.request) {
    // Network error
    return {
      message: 'Network error. Please check your connection.',
      status: 0
    };
  } else {
    // Other error
    return {
      message: error.message || 'An unexpected error occurred',
      status: -1
    };
  }
};

// Storage functions
export const storeAuthData = async (token, userData) => {
  await AsyncStorage.setItem('authToken', token);
  await AsyncStorage.setItem('userData', JSON.stringify(userData));
};

export const clearAuthData = async () => {
  await AsyncStorage.removeItem('authToken');
  await AsyncStorage.removeItem('userData');
};

export const getStoredToken = async () => {
  return await AsyncStorage.getItem('authToken');
};

export const getStoredUserData = async () => {
  const userData = await AsyncStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};

// API functions
export const loginUser = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login-user', { email, password });
    
    if (response.data.success) {
      await storeAuthData(response.data.token, response.data.user);
    }
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const registerUser = async (username, email, password) => {
  try {
    const response = await apiClient.post('/auth/register-user', { username, email, password });
    
    if (response.data.success) {
      await storeAuthData(response.data.token, response.data.user);
    }
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getUserProfile = async () => {
  try {
    const response = await apiClient.get('/users/profile');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const logoutUser = async () => {
  await clearAuthData();
};

// Default export with all functions for backward compatibility
const apiService = {
  login: loginUser,
  register: registerUser,
  getProfile: getUserProfile,
  logout: logoutUser,
  getStoredToken,
  getStoredUserData,
  handleError: handleApiError,
};

export default apiService;
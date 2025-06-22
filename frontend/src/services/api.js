import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure base URL (update with your backend URL)
const API_BASE_URL = 'https://78a8-41-75-182-187.ngrok-free.app/api'; // Use your local IP
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

export const getAuthData = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const user = await AsyncStorage.getItem('userData');
    return {
      token,
      user: user ? JSON.parse(user) : null
    };
  } catch (error) {
    console.error('Error getting auth data:', error);
    return { token: null, user: null };
  }
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

export const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
};

// Helper function to get date range for next N days
export const getDateRange = (days = 7) => {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + days);
    
    return {
        from: formatDateForAPI(today),
        to: formatDateForAPI(endDate)
    };
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

export const updateUserProfile = async (profileData) => {
  try {
    const updateData = {};
    
    if (profileData.firstName?.trim()) updateData.first_name = profileData.firstName.trim();
    if (profileData.lastName?.trim()) updateData.last_name = profileData.lastName.trim();
    if (profileData.username?.trim()) updateData.username = profileData.username.trim();
    if (profileData.email?.trim()) updateData.email = profileData.email.trim();
    if (profileData.phone?.trim()) updateData.phone = profileData.phone.trim();
    if (profileData.dob?.trim()) updateData.dob = profileData.dob.trim();
    if (profileData.gender) updateData.gender = profileData.gender;
    if (profileData.profileImage) updateData.profile_image = profileData.profileImage;

    const response = await apiClient.patch('/users/update-profile', updateData);
    
    if (response.data.success) {
      const currentAuthData = await getAuthData();
      const updatedUser = { ...currentAuthData.user, ...response.data.user };
      await storeAuthData(currentAuthData.token, updatedUser);
    }
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const fetchConsultants = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add optional query parameters
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.specialty) queryParams.append('specialty', params.specialty);
    if (params.location) queryParams.append('location', params.location);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/users/consultants?${queryString}` : '/users/consultants';
    
    const response = await apiClient.get(endpoint);
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const fetchConsultantById = async (consultantId) => {
  try {
    if (!consultantId) {
      throw new Error('Consultant ID is required');
    }
    
    const response = await apiClient.get(`/users/consultants/${consultantId}`);
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getConsultantAppointments = async (consultantId, filters = {}) => {
  try {
    if (!consultantId) {
      throw new Error('Consultant ID is required');
    }
    
    // Use GET method and include filters as query parameters if needed
    const queryParams = new URLSearchParams(filters).toString();
    const url = `/appointments/consultant/${consultantId}${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await apiClient.get(url);
    console.log(response)
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getUserAppointments = async (userId, filters = {}) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Use GET method and include filters as query parameters if needed
    const queryParams = new URLSearchParams(filters).toString();
    const url = `/appointments/user/${userId}${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await apiClient.get(url);
    
    return response.data;
  } catch (error) {
    throw handleApiError(error); 
  }
};

export const createAppointment = async (appointmentData) => {
    try {
        if (!appointmentData) {
            throw new Error('Appointment data is required');
        }
        
        // Validate required fields
        if (!appointmentData.consultant_id) {
            throw new Error('Consultant ID is required');
        }
        
        if (!appointmentData.appointment_date || !appointmentData.appointment_time) {
            throw new Error('Appointment date and time are required');
        }
        
        const response = await apiClient.post('/appointments/create', appointmentData);
        
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

// Add these to your services/api.js file
export const getConsultantReviewsPaginated = async (
  consultantId, 
  page = 1, 
  limit = 10, 
  sortBy = 'created_at', 
  sortOrder = 'DESC'
) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });
    
    const response = await apiClient.get(`/appointments/consultants/${consultantId}/reviews?${params}`);
    return response.data;
    
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getConsultantReviews = async (consultantId) => {
  try {
    if (!consultantId) {
      throw new Error('Consultant ID is required');
    }
    
    const response = await apiClient.get(`/users/consultants/${consultantId}`);
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const submitReview = async (consultantId, reviewData) => {
  try {
        if (!reviewData) {
            throw new Error('Review data is required');
        }
        
        // Validate required fields
        if (!consultantId) {
            throw new Error('Consultant ID is required');
        }
        
        const response = await apiClient.post(`/appointments/${consultantId}/review`, reviewData);
        
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

export const cancelAppointment = async (appointment, cancelData) => {
    try {
        if (!cancelData) {
            throw new Error('Cancellation data is required');
        }

        if (!appointment) {
            throw new Error('Appointment data is required');
        }

        const response = await apiClient.patch(`/appointments/${appointment.id}/status`, cancelData);
        
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
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
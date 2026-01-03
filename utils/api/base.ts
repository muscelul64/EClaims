import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ENV_CONFIG } from '../environment';

// Get current auth token from storage
const getCurrentAuthToken = async (): Promise<string | null> => {
  try {
    const userData = await AsyncStorage.getItem('@user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.authToken && user.tokenExpiresAt) {
        // Check if token is still valid (with 5-minute buffer)
        const fiveMinutes = 5 * 60 * 1000;
        if (Date.now() < (user.tokenExpiresAt - fiveMinutes)) {
          return user.authToken;
        }
      }
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return null;
};

// Base configuration for API calls
export const API_CONFIG = {
  BASE_URL: ENV_CONFIG.API_BASE_URL,
  TIMEOUT: ENV_CONFIG.NETWORK_TIMEOUT,
  RETRY_ATTEMPTS: 3,
};

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const createApiHeaders = async (customToken?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': `deactech-eclaims-mobile/${Platform.OS}`,
  };

  // Use custom token or get from storage
  const token = customToken || await getCurrentAuthToken();
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers['X-Master-App-Auth'] = 'true'; // Indicate this comes from master app
  }

  return headers;
};

// Synchronous version for cases where async isn't possible
export const createApiHeadersSync = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': `deactech-eclaims-mobile/${Platform.OS}`,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers['X-Master-App-Auth'] = 'true';
  }

  return headers;
};

export const handleApiError = (error: any): ApiError => {
  if (error.name === 'ApiError') {
    return error;
  }

  if (error.response) {
    return new ApiError(
      error.response.data?.message || 'API Error',
      error.response.status,
      error.response.data
    );
  }

  if (error.request) {
    return new ApiError('Network error - please check your connection');
  }

  return new ApiError(error.message || 'Unknown error occurred');
};

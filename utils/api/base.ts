import { Platform } from 'react-native';

// Base configuration for API calls
export const API_CONFIG = {
  BASE_URL: 'https://api.porsche-eclaims.com', // Replace with actual API URL
  TIMEOUT: 30000,
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

export const createApiHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': `porsche-eclaims-mobile/${Platform.OS}`,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
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

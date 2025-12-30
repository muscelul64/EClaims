import { API_CONFIG, ApiResponse, createApiHeaders, handleApiError } from './base';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    profile?: any;
  };
}

export interface ResetPasswordRequest {
  email: string;
}

class AuthApi {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...createApiHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      const apiError = handleApiError(error);
      return {
        success: false,
        error: apiError.message,
      };
    }
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.makeRequest<LoginResponse>('/Auth/Login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async resetPassword(request: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/Auth/ResetPassword', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/Auth/Logout', {
      method: 'POST',
    });
  }
}

export const authApi = new AuthApi();

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

export interface TokenValidationRequest {
  token: string;
  masterAppUserId?: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    profile?: any;
  };
  expiresAt?: number;
  permissions?: string[];
}

class AuthApi {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await createApiHeaders();
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
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

  async validateExternalToken(request: TokenValidationRequest): Promise<ApiResponse<TokenValidationResponse>> {
    return this.makeRequest<TokenValidationResponse>('/Auth/ValidateExternalToken', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async refreshExternalToken(currentToken: string): Promise<ApiResponse<{ token: string; expiresAt: number }>> {
    return this.makeRequest<{ token: string; expiresAt: number }>('/Auth/RefreshExternalToken', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'X-Master-App-Auth': 'true'
      },
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

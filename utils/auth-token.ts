import { useUserStore, type User } from '@/stores/use-user-store';
import { universalLinkManager as deepLinkManager, UniversalLinkManager as DeepLinkManager, type AuthToken } from './deeplink';

/**
 * Authentication Token Utility
 * Handles token-based authentication for deeplinks
 */
export class AuthTokenManager {
  private static instance: AuthTokenManager;
  
  static getInstance(): AuthTokenManager {
    if (!AuthTokenManager.instance) {
      AuthTokenManager.instance = new AuthTokenManager();
    }
    return AuthTokenManager.instance;
  }
  
  // Initialize token authentication
  initialize() {
    deepLinkManager.setTokenAuthenticator(this.authenticateWithToken.bind(this));
  }
  
  // Authenticate user with token
  private async authenticateWithToken(token: AuthToken): Promise<boolean> {
    try {
      console.log('Authenticating with token for user:', token.userId);
      
      // Validate token format and expiration
      if (!this.isValidToken(token)) {
        console.warn('Invalid token format or expired');
        return false;
      }
      
      // TODO: Replace with actual API call to your backend
      const validationResult = await this.validateTokenWithBackend(token);
      
      if (validationResult.valid) {
        // Update user store with authenticated user
        const { setUser } = useUserStore.getState();
        
        const userData: User = {
          authenticated: true,
          username: token.userId,
          profile: {
            name: validationResult.userData?.name || token.userId,
            email: validationResult.userData?.email || `${token.userId}@deactech-eclaims.com`,
          }
        };
        
        await setUser(userData);
        
        console.log('Token authentication successful');
        return true;
      }
      
      console.warn('Token validation failed');
      return false;
      
    } catch (error) {
      console.error('Token authentication error:', error);
      return false;
    }
  }
  
  // Validate token format and expiration
  private isValidToken(token: AuthToken): boolean {
    // Check if token exists
    if (!token.token || token.token.length < 10) {
      return false;
    }
    
    // Check if token is expired
    if (token.expiresAt && Date.now() > token.expiresAt) {
      return false;
    }
    
    // Check if user ID exists
    if (!token.userId) {
      return false;
    }
    
    return true;
  }
  
  // Validate token with backend (mock implementation)
  private async validateTokenWithBackend(token: AuthToken): Promise<{
    valid: boolean;
    userData?: { name: string; email: string; [key: string]: any };
  }> {
    try {
      // TODO: Replace with actual API call
      // Example: POST /api/auth/validate-token
      
      // Mock implementation for testing
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      // Simulate successful validation
      if (token.token.startsWith('valid_')) {
        return {
          valid: true,
          userData: {
            name: `User ${token.userId}`,
            email: `${token.userId}@deactech-eclaims.com`
          }
        };
      }
      
      // Simulate validation failure
      return { valid: false };
      
    } catch (error) {
      console.error('Backend validation error:', error);
      return { valid: false };
    }
  }
  
  // Generate secure token for sharing (to be called from backend)
  static generateSecureToken(userId: string, options?: {
    expiresInMinutes?: number;
    scope?: string[];
    additionalData?: Record<string, any>;
  }): string {
    const expiresAt = Date.now() + (options?.expiresInMinutes || 60) * 60 * 1000;
    
    const tokenPayload = {
      userId,
      expiresAt,
      scope: options?.scope || [],
      iat: Date.now(),
      ...options?.additionalData
    };
    
    // In production, use proper JWT signing with secret key
    // For demo purposes, using simple base64 encoding
    return `valid_${btoa(JSON.stringify(tokenPayload))}`;
  }
  
  // Create secure deeplink with token
  static createSecureDeepLink(
    action: string,
    userId: string,
    params?: Record<string, string>,
    options?: {
      expiresInMinutes?: number;
      scope?: string[];
    }
  ): string {
    const token = this.generateSecureToken(userId, options);
    return DeepLinkManager.generateDeepLink(action, params, token);
  }
  
  // Create secure universal link with token
  static createSecureUniversalLink(
    action: string,
    userId: string,
    params?: Record<string, string>,
    options?: {
      expiresInMinutes?: number;
      scope?: string[];
    }
  ): string {
    const token = this.generateSecureToken(userId, options);
    return DeepLinkManager.generateUniversalLink(action, params, token);
  }
  
  // Parse token from URL
  static parseTokenFromUrl(url: string): AuthToken | null {
    try {
      const urlObj = new URL(url);
      const tokenString = urlObj.searchParams.get('token');
      
      if (!tokenString) {
        return null;
      }
      
      // Parse token based on format
      if (tokenString.startsWith('valid_')) {
        const payloadString = tokenString.substring(6); // Remove 'valid_' prefix
        const payload = JSON.parse(atob(payloadString));
        
        return {
          token: tokenString,
          userId: payload.userId,
          expiresAt: payload.expiresAt,
          scope: payload.scope
        };
      }
      
      // Handle other token formats
      return {
        token: tokenString,
        userId: '',
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // Default 24h
      };
      
    } catch (error) {
      console.error('Error parsing token from URL:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authTokenManager = AuthTokenManager.getInstance();

// Export utility functions
export const createSecureDeepLink = AuthTokenManager.createSecureDeepLink;
export const createSecureUniversalLink = AuthTokenManager.createSecureUniversalLink;
export const generateSecureToken = AuthTokenManager.generateSecureToken;
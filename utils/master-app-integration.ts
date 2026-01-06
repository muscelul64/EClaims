import { useUserStore } from '@/stores/use-user-store';
import { Alert, Linking } from 'react-native';
import { authApi } from './api/auth';
import { universalLinkManager } from './deeplink';
import { ENV_CONFIG } from './environment';

export interface MasterAppAuthData {
  token: string;
  userInfo?: {
    id: string;
    name?: string;
    email?: string;
    username?: string;
    profile?: any;
  };
  sessionId?: string;
  masterAppVersion?: string;
}

export interface MasterAppConfig {
  masterAppScheme: string;
  callbackAction?: string;
  requiresTokenValidation?: boolean;
}

class MasterAppIntegration {
  private static instance: MasterAppIntegration;
  private config: MasterAppConfig = {
    masterAppScheme: ENV_CONFIG.MASTER_APP_SCHEME,
    callbackAction: 'auth-callback',
    requiresTokenValidation: true,
  };

  static getInstance(): MasterAppIntegration {
    if (!MasterAppIntegration.instance) {
      MasterAppIntegration.instance = new MasterAppIntegration();
    }
    return MasterAppIntegration.instance;
  }

  // Configure master app integration
  configure(config: Partial<MasterAppConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Initialize and set up deeplink handlers for master app communication
  initialize() {
    this.setupDeepLinkHandlers();
  }

  private setupDeepLinkHandlers() {
    // Register handler for master app authentication callback
    universalLinkManager.registerHandler('master-auth', {
pattern: 'https://*/master-auth',
      handler: this.handleMasterAppAuth.bind(this),
      requiresAuth: false,
      allowsTokenAuth: true,
      description: 'Handle authentication from master app'
    });

    // Register handler for master app token refresh
    universalLinkManager.registerHandler('token-refresh', {
pattern: 'https://*/token-refresh',
      handler: this.handleTokenRefresh.bind(this),
      requiresAuth: false,
      allowsTokenAuth: true,
      description: 'Handle token refresh from master app'
    });

    // Register handler for session sync
    universalLinkManager.registerHandler('session-sync', {
pattern: 'https://*/session-sync',
      handler: this.handleSessionSync.bind(this),
      requiresAuth: false,
      allowsTokenAuth: true,
      description: 'Synchronize session with master app'
    });
  }

  // Handle authentication data from master app
  private async handleMasterAppAuth(params: any) {
    try {
      const authData = this.parseAuthParams(params);
      if (!authData) {
        throw new Error('Invalid authentication data');
      }

      console.log('Received authentication from master app for user:', authData.userInfo?.id);

      // Validate token with backend if required
      if (this.config.requiresTokenValidation) {
        const validation = await authApi.validateExternalToken({
          token: authData.token,
          masterAppUserId: authData.userInfo?.id,
        });

        if (!validation.success || !validation.data?.valid) {
          throw new Error('Token validation failed');
        }

        // Update user info with validated data
        if (validation.data.user) {
          authData.userInfo = {
            ...authData.userInfo,
            ...validation.data.user,
          };
        }
      }

      // Set authentication in user store
      const { setExternalAuth } = useUserStore.getState();
      const success = await setExternalAuth(authData.token, authData.userInfo);

      if (success) {
        console.log('Master app authentication successful');
        this.notifyMasterApp('auth-success', { sessionId: authData.sessionId });
      } else {
        throw new Error('Failed to set authentication');
      }

    } catch (error) {
      console.error('Master app authentication error:', error);
      this.handleAuthError(error as Error);
    }
  }

  // Handle token refresh from master app
  private async handleTokenRefresh(params: any) {
    try {
      const newToken = params.token;
      const userInfo = params.userInfo;

      if (!newToken) {
        throw new Error('No token provided for refresh');
      }

      const { setExternalAuth } = useUserStore.getState();
      const success = await setExternalAuth(newToken, userInfo);

      if (success) {
        console.log('Token refresh successful');
        this.notifyMasterApp('token-refresh-success');
      } else {
        throw new Error('Failed to refresh token');
      }

    } catch (error) {
      console.error('Token refresh error:', error);
      this.notifyMasterApp('token-refresh-failed', { error: (error as Error).message });
    }
  }

  // Handle session synchronization
  private async handleSessionSync(params: any) {
    try {
      const { user } = useUserStore.getState();
      
      const sessionData = {
        authenticated: user.authenticated,
        sessionId: user.masterAppSession?.sessionId,
        masterAppUserId: user.masterAppSession?.masterAppUserId,
        lastActivity: Date.now(),
      };

      this.notifyMasterApp('session-sync-response', sessionData);

    } catch (error) {
      console.error('Session sync error:', error);
      this.notifyMasterApp('session-sync-failed', { error: (error as Error).message });
    }
  }

  // Parse authentication parameters from deeplink
  private parseAuthParams(params: any): MasterAppAuthData | null {
    try {
      // Handle both direct params and encoded data
      if (params.data) {
        const decoded = JSON.parse(atob(params.data));
        return decoded as MasterAppAuthData;
      }

      if (params.token) {
        return {
          token: params.token,
          userInfo: params.userInfo ? JSON.parse(params.userInfo) : undefined,
          sessionId: params.sessionId,
          masterAppVersion: params.masterAppVersion,
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing auth params:', error);
      return null;
    }
  }

  // Notify master app about events
  private async notifyMasterApp(action: string, data?: any) {
    try {
      const url = `${this.config.masterAppScheme}://${this.config.callbackAction}`;
      const params = new URLSearchParams({
        action,
        source: 'deactech-eclaims',
        timestamp: Date.now().toString(),
      });

      if (data) {
        params.append('data', btoa(JSON.stringify(data)));
      }

      const fullUrl = `${url}?${params.toString()}`;
      
      const canOpen = await Linking.canOpenURL(fullUrl);
      if (canOpen) {
        await Linking.openURL(fullUrl);
        console.log('Notified master app:', action);
      } else {
        console.warn('Cannot communicate with master app - URL scheme not available');
      }
    } catch (error) {
      console.error('Error notifying master app:', error);
    }
  }

  // Handle authentication errors
  private handleAuthError(error: Error) {
    Alert.alert(
      'Authentication Error',
      `Failed to authenticate with master app: ${error.message}`,
      [
        {
          text: 'Retry',
          onPress: () => this.requestAuthFromMasterApp()
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );

    this.notifyMasterApp('auth-failed', { error: error.message });
  }

  // Request authentication from master app
  async requestAuthFromMasterApp(context?: string) {
    try {
      const url = `${this.config.masterAppScheme}://request-auth`;
      const params = new URLSearchParams({
        requestingApp: 'deactech-eclaims',
        context: context || 'login',
        timestamp: Date.now().toString(),
      });

      const fullUrl = `${url}?${params.toString()}`;
      
      const canOpen = await Linking.canOpenURL(fullUrl);
      if (canOpen) {
        await Linking.openURL(fullUrl);
        console.log('Requested authentication from master app');
      } else {
        throw new Error('Master app not available');
      }
    } catch (error) {
      console.error('Error requesting auth from master app:', error);
      Alert.alert(
        'Master App Not Available',
        'Cannot communicate with the master app. Please ensure it is installed and updated.',
        [{ text: 'OK' }]
      );
    }
  }

  // Request token refresh from master app
  async requestTokenRefresh() {
    try {
      const { user } = useUserStore.getState();
      
      const url = `${this.config.masterAppScheme}://refresh-token`;
      const params = new URLSearchParams({
        requestingApp: 'deactech-eclaims',
        sessionId: user.masterAppSession?.sessionId || '',
        currentToken: user.authToken || '',
        timestamp: Date.now().toString(),
      });

      const fullUrl = `${url}?${params.toString()}`;
      
      const canOpen = await Linking.canOpenURL(fullUrl);
      if (canOpen) {
        await Linking.openURL(fullUrl);
        console.log('Requested token refresh from master app');
        return true;
      } else {
        throw new Error('Master app not available for token refresh');
      }
    } catch (error) {
      console.error('Error requesting token refresh:', error);
      return false;
    }
  }

  // Check if master app is available
  async isMasterAppAvailable(): Promise<boolean> {
    try {
      const testUrl = `${this.config.masterAppScheme}://ping`;
      return await Linking.canOpenURL(testUrl);
    } catch {
      return false;
    }
  }

  // Get current master app configuration
  getConfig(): MasterAppConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const masterAppIntegration = MasterAppIntegration.getInstance();

// Export helper functions
export const requestMasterAppAuth = (context?: string) => 
  masterAppIntegration.requestAuthFromMasterApp(context);

export const requestMasterAppTokenRefresh = () => 
  masterAppIntegration.requestTokenRefresh();

export const isMasterAppAvailable = () => 
  masterAppIntegration.isMasterAppAvailable();
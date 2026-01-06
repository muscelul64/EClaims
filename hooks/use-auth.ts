import { useUserStore, type User } from '@/stores/use-user-store';
import { universalLinkManager as deepLinkManager, type AuthToken } from '@/utils/deeplink';
import { useEffect } from 'react';

export function useAuth() {
  const { 
    user, 
    isLoading, 
    setUser, 
    setExternalAuth,
    validateToken,
    refreshTokenIfNeeded,
    logout: storeLogout, 
    loadUserFromStorage 
  } = useUserStore();

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Update deeplink manager when authentication status changes
  useEffect(() => {
    deepLinkManager.setAuthenticationStatus(user.authenticated);
    
    // Set up token authenticator for deeplink manager
    deepLinkManager.setTokenAuthenticator(async (authToken: AuthToken, params?: any) => {
      try {
        console.log('Authenticating via deeplink token for user:', authToken.userId);
        
        // Create deeplink context with vehicle restrictions if present
        const deeplinkContext = {
          allowedVehicleId: params?.vehicleId || undefined,
          originalUrl: params?.originalUrl || '',
        };
        
        return await setExternalAuth(authToken.token, {
          username: authToken.userId,
          userId: authToken.userId
        }, deeplinkContext);
      } catch (error) {
        console.error('Deeplink token authentication failed:', error);
        return false;
      }
    });
    
    // Handle pending deeplinks after successful authentication
    if (user.authenticated) {
      deepLinkManager.handlePendingDeepLink();
    }
  }, [user.authenticated, setExternalAuth]);

  // Periodically check token validity
  useEffect(() => {
    if (!user.authenticated || !user.authToken) return;

    const interval = setInterval(async () => {
      const isValid = await refreshTokenIfNeeded();
      if (!isValid) {
        console.log('Token refresh failed, user will be logged out');
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user.authenticated, user.authToken, refreshTokenIfNeeded]);

  const login = async (username: string, password: string) => {
    try {
      // TODO: Implement actual login API call
      // For now, just simulate authentication
      const userData: User = {
        authenticated: true,
        username,
        profile: {
          name: username,
          email: `${username}@deactech-eclaims.com`,
        }
      };
      
      await setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const loginWithExternalToken = async (token: string, userInfo?: any) => {
    try {
      const success = await setExternalAuth(token, userInfo);
      if (success) {
        return { success: true };
      } else {
        return { success: false, error: 'Invalid or expired token' };
      }
    } catch (error) {
      console.error('External authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  };

  const logout = async () => {
    try {
      await storeLogout();
      // Update deeplink manager about logout
      deepLinkManager.setAuthenticationStatus(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    isAuthenticated: user.authenticated,
    user,
    isLoading,
    authToken: user.authToken,
    tokenValid: validateToken(),
    login,
    loginWithExternalToken,
    logout,
    refreshTokenIfNeeded,
  };
}
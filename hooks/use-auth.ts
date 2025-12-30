import { useUserStore, type User } from '@/stores/use-user-store';
import { useEffect } from 'react';

export function useAuth() {
  const { user, isLoading, setUser, logout: storeLogout, loadUserFromStorage } = useUserStore();

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const login = async (username: string, password: string) => {
    try {
      // TODO: Implement actual login API call
      // For now, just simulate authentication
      const userData: User = {
        authenticated: true,
        username,
        profile: {
          name: username,
          email: `${username}@porsche-eclaims.com`,
        }
      };
      
      await setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await storeLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    isAuthenticated: user.authenticated,
    user,
    isLoading,
    login,
    logout,
  };
}
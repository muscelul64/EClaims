import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

// Helper function to parse authentication tokens
const parseAuthToken = (token: string) => {
  try {
    // Handle JWT-like tokens
    if (token.includes('.')) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        return {
          userId: payload.sub || payload.userId || payload.id || '',
          expiresAt: (payload.exp || 0) * 1000, // Convert to milliseconds
          issuedAt: (payload.iat || 0) * 1000,
          sessionId: payload.sessionId || payload.jti,
          scope: payload.scope ? payload.scope.split(' ') : undefined
        };
      }
    }
    
    // Try to parse as JSON
    const parsed = JSON.parse(atob(token));
    return {
      userId: parsed.userId || parsed.id || '',
      expiresAt: parsed.expiresAt || Date.now() + 24 * 60 * 60 * 1000,
      issuedAt: parsed.issuedAt || Date.now(),
      sessionId: parsed.sessionId,
      scope: parsed.scope
    };
  } catch (error) {
    console.warn('Could not parse token:', error);
    return null;
  }
};

// Generate a session ID for tracking
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export interface User {
  authenticated: boolean;
  username?: string;
  authToken?: string;
  tokenExpiresAt?: number;
  deeplinkContext?: {
    hasVehicleRestriction: boolean;
    allowedVehicleId?: string;
    originalUrl: string;
    timestamp: number;
    vehicleData?: any;
  };
  masterAppSession?: {
    sessionId: string;
    masterAppUserId: string;
    issuedAt: number;
  };
  profile?: {
    name?: string;
    email?: string;
    userId?: string;
  };
}

interface UserState {
  user: User;
  isLoading: boolean;
  setUser: (user: User) => void;
  setUserWithoutPersist: (user: User) => void;
  setExternalAuth: (token: string, userInfo?: any, deeplinkContext?: any) => Promise<boolean>;
  setDeeplinkContext: (context: any) => void;
  clearDeeplinkContext: () => void;
  validateToken: () => boolean;
  refreshTokenIfNeeded: () => Promise<boolean>;
  logout: () => void;
  loadUserFromStorage: () => Promise<void>;
}

const getInitialUserState = (): User => ({
  authenticated: false,
});

export const useUserStore = create<UserState>((set, get) => ({
  user: getInitialUserState(),
  isLoading: true,
  
  setUser: async (user: User) => {
    set({ user });
    try {
      await AsyncStorage.setItem('@user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user to storage:', error);
    }
  },
  
  setUserWithoutPersist: (user: User) => {
    set({ user });
  },
  
  logout: async () => {
    const emptyUser = getInitialUserState();
    set({ user: emptyUser });
    try {
      await AsyncStorage.removeItem('@user');
    } catch (error) {
      console.error('Failed to remove user from storage:', error);
    }
  },
  
  loadUserFromStorage: async () => {
    try {
      set({ isLoading: true });
      const userData = await AsyncStorage.getItem('@user');
      if (userData) {
        const user = JSON.parse(userData);
        // Validate token on load
        if (user.authToken && get().validateToken()) {
          set({ user });
        } else if (user.authToken) {
          // Token expired, clear authentication
          console.log('Stored token expired, clearing authentication');
          await get().logout();
        } else {
          set({ user });
        }
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setExternalAuth: async (token: string, userInfo?: any, deeplinkContext?: any) => {
    try {
      // Parse token to extract user information and expiration
      const tokenData = parseAuthToken(token);
      if (!tokenData) {
        console.error('Invalid token format');
        return false;
      }

      const user: User = {
        authenticated: true,
        authToken: token,
        tokenExpiresAt: tokenData.expiresAt,
        username: userInfo?.username || tokenData.userId,
        deeplinkContext: deeplinkContext ? {
          hasVehicleRestriction: !!deeplinkContext.allowedVehicleId,
          allowedVehicleId: deeplinkContext.allowedVehicleId,
          originalUrl: deeplinkContext.originalUrl || '',
          timestamp: Date.now(),
        } : undefined,
        masterAppSession: {
          sessionId: tokenData.sessionId || generateSessionId(),
          masterAppUserId: tokenData.userId,
          issuedAt: tokenData.issuedAt || Date.now(),
        },
        profile: {
          name: userInfo?.name || userInfo?.displayName,
          email: userInfo?.email,
          userId: tokenData.userId,
        },
      };

      await get().setUser(user);
      console.log('External authentication successful for user:', tokenData.userId);
      if (deeplinkContext?.allowedVehicleId) {
        console.log('Vehicle restriction applied:', deeplinkContext.allowedVehicleId);
      }
      return true;
    } catch (error) {
      console.error('Failed to set external authentication:', error);
      return false;
    }
  },

  setDeeplinkContext: (context: any) => {
    set((state) => ({
      user: {
        ...state.user,
        deeplinkContext: {
          hasVehicleRestriction: !!context.allowedVehicleId || !!context.vehicleData,
          allowedVehicleId: context.allowedVehicleId,
          originalUrl: context.originalUrl || '',
          timestamp: Date.now(),
          vehicleData: context.vehicleData
        }
      }
    }));
  },

  clearDeeplinkContext: () => {
    set((state) => ({
      user: {
        ...state.user,
        deeplinkContext: undefined
      }
    }));
  },

  validateToken: () => {
    const { user } = get();
    if (!user.authToken || !user.tokenExpiresAt) {
      return false;
    }
    
    // Check if token is expired (with 5-minute buffer)
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() < (user.tokenExpiresAt - fiveMinutes);
  },

  refreshTokenIfNeeded: async () => {
    const { user } = get();
    if (!user.authToken || get().validateToken()) {
      return true; // Token is still valid
    }

    // In a master app scenario, we would need to communicate back
    // to the master app to refresh the token. For now, we'll logout.
    console.log('Token expired and refresh not available, logging out');
    await get().logout();
    return false;
  },
}));
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export interface User {
  authenticated: boolean;
  username?: string;
  profile?: {
    name?: string;
    email?: string;
  };
}

interface UserState {
  user: User;
  isLoading: boolean;
  setUser: (user: User) => void;
  setUserWithoutPersist: (user: User) => void;
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
        set({ user });
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
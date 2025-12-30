import { Redirect, Slot } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';

export default function MainLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Slot />;
}
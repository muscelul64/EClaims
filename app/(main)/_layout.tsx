import { Redirect, Slot } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';
import { useUserStore } from '@/stores/use-user-store';

export default function MainLayout() {
  const { isAuthenticated } = useAuth();
  const { user } = useUserStore();

  // If user came via deeplink with auth token, allow access even without traditional login
  const hasDeeplinkAuth = user.universalLinkContext && user.authToken;
  
  if (!isAuthenticated && !hasDeeplinkAuth) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Slot />;
}
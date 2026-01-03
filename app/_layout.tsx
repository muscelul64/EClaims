import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { authTokenManager } from '@/utils/auth-token';
import { deepLinkManager } from '@/utils/deeplink';
import { masterAppIntegration } from '@/utils/master-app-integration';
import I18nProvider from './i18n-provider';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Initialize deeplink system and master app integration
  useEffect(() => {
    // Initialize core systems
    deepLinkManager.initialize();
    authTokenManager.initialize();
    
    // Initialize master app integration
    masterAppIntegration.configure({
      masterAppScheme: 'porsche-master-app',
      callbackAction: 'eclaims-callback',
      requiresTokenValidation: true,
    });
    masterAppIntegration.initialize();

    console.log('Porsche E-Claims initialized with master app integration');
  }, []);

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(main)" />
            <Stack.Screen name="camera" options={{ presentation: 'modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

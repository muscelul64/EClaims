import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet } from 'react-native';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColor } from '@/hooks/use-theme-color';
import { isMasterAppAvailable, requestMasterAppAuth } from '@/utils/master-app-integration';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [masterAppAvailable, setMasterAppAvailable] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  
  // Theme colors for master app section
  const masterAppBgColor = useThemeColor(
    { light: 'rgba(0, 122, 255, 0.1)', dark: 'rgba(0, 122, 255, 0.2)' },
    'background'
  );
  const masterAppBorderColor = useThemeColor(
    { light: 'rgba(0, 122, 255, 0.2)', dark: 'rgba(0, 122, 255, 0.4)' },
    'tint'
  );
  const masterAppTextColor = useThemeColor(
    { light: '#007AFF', dark: '#409CFF' },
    'tint'
  );

  // Check if master app is available
  useEffect(() => {
    const checkMasterApp = async () => {
      const available = await isMasterAppAvailable();
      setMasterAppAvailable(available);
      
      if (available) {
        console.log('Master app detected - authentication will be handled by master app');
      }
    };
    
    checkMasterApp();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert(t('common.error') || 'Error', t('auth.fillAllFields') || 'Please enter both username and password');
      return;
    }

    setIsLoading(true);
    const result = await login(username, password);
    
    if (result.success) {
      router.replace('/(main)');
    } else {
      Alert.alert(t('auth.loginError') || 'Login Failed', result.error || t('auth.checkCredentials') || 'Please check your credentials');
    }
    setIsLoading(false);
  };

  const handleMasterAppLogin = async () => {
    setIsLoading(true);
    try {
      await requestMasterAppAuth('login');
      // The master app will handle the authentication and callback
    } catch (err) {
      console.error('Master app error:', err);
      Alert.alert(
        t('auth.masterAppError') || 'Master App Error',
        t('auth.masterAppNotAvailable') || 'Cannot connect to master app. Please try manual login.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.formContainer}>
        <ThemedText type="title" style={styles.title}>
          {t('auth.welcome') || 'Porsche E-Claims'}
        </ThemedText>
        
        {masterAppAvailable && (
          <ThemedView style={[
            styles.masterAppSection,
            {
              backgroundColor: masterAppBgColor,
              borderColor: masterAppBorderColor,
            }
          ]}>
            <ThemedText style={[
              styles.masterAppText,
              { color: masterAppTextColor }
            ]}>
              {t('auth.masterAppAvailable') || 'Authenticated via Porsche Master App'}
            </ThemedText>
            <ThemedButton
              title={isLoading ? (t('auth.connecting') || 'Connecting...') : (t('auth.useMasterApp') || 'Login with Master App')}
              onPress={isLoading ? undefined : handleMasterAppLogin}
              style={[styles.loginButton, styles.masterAppButton]}
              disabled={isLoading}
            />
            <ThemedText style={styles.orText}>
              {t('auth.orLoginManually') || 'Or login manually:'}
            </ThemedText>
          </ThemedView>
        )}
        
        <ThemedTextInput
          style={styles.input}
          placeholder={t('auth.username') || 'Username'}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <ThemedTextInput
          style={styles.input}
          placeholder={t('auth.password') || 'Password'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <ThemedButton
          title={isLoading ? (t('auth.loggingIn') || 'Logging in...') : (t('auth.loginButton') || 'Login')}
          onPress={isLoading ? undefined : handleLogin}
          style={styles.loginButton}
          disabled={isLoading}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    padding: 20,
    borderRadius: 10,
  },
  title: {
    textAlign: 'center',
    marginBottom: 40,
  },
  masterAppSection: {
    marginBottom: 30,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
  },
  masterAppText: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16,
  },
  masterAppButton: {
    backgroundColor: '#007AFF',
  },
  orText: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
    opacity: 0.7,
  },
  input: {
    marginBottom: 15,
  },
  loginButton: {
    marginTop: 10,
  },
});
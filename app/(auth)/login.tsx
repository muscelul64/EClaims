import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

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

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.formContainer}>
        <ThemedText type="title" style={styles.title}>
          {t('auth.welcome') || 'Porsche E-Claims'}
        </ThemedText>
        
        <TextInput
          style={styles.input}
          placeholder={t('auth.username') || 'Username'}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
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
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loginButton: {
    marginTop: 10,
  },
});
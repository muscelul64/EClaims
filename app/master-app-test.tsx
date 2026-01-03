import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import {
    isMasterAppAvailable,
    requestMasterAppAuth,
    requestMasterAppTokenRefresh
} from '@/utils/master-app-integration';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

export default function MasterAppTestScreen() {
  const [masterAppAvailable, setMasterAppAvailable] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const { user, isAuthenticated, tokenValid, loginWithExternalToken, authToken } = useAuth();

  useEffect(() => {
    checkMasterApp();
  }, []);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const checkMasterApp = async () => {
    try {
      const available = await isMasterAppAvailable();
      setMasterAppAvailable(available);
      addTestResult(`Master app available: ${available}`);
    } catch (error) {
      addTestResult(`Error checking master app: ${(error as Error).message || error}`);
    }
  };

  const testAuthentication = async () => {
    try {
      if (!masterAppAvailable) {
        Alert.alert('Error', 'Master app not available');
        return;
      }

      await requestMasterAppAuth('test');
      addTestResult('Authentication request sent to master app');
    } catch (error) {
      addTestResult(`Auth test error: ${(error as Error).message || error}`);
    }
  };

  const testTokenRefresh = async () => {
    try {
      if (!isAuthenticated) {
        Alert.alert('Error', 'Not authenticated - cannot test token refresh');
        return;
      }

      const success = await requestMasterAppTokenRefresh();
      addTestResult(`Token refresh request: ${success ? 'sent' : 'failed'}`);
    } catch (error) {
      addTestResult(`Token refresh error: ${(error as Error).message || error}`);
    }
  };

  const testManualTokenAuth = async () => {
    try {
      // Create a test token (in production this would come from master app)
      const testToken = btoa(JSON.stringify({
        userId: 'test-user',
        expiresAt: Date.now() + 3600000, // 1 hour
        issuedAt: Date.now(),
        sessionId: 'test-session-123'
      }));

      const result = await loginWithExternalToken(testToken, {
        id: 'test-user',
        name: 'Test User',
        email: 'test@porsche.com'
      });

      addTestResult(`Manual token auth: ${result.success ? 'success' : result.error}`);
    } catch (error) {
      addTestResult(`Manual auth error: ${(error as Error).message || error}`);
    }
  };

  const testApiWithToken = async () => {
    try {
      if (!authToken) {
        Alert.alert('Error', 'No auth token available');
        return;
      }

      addTestResult('Testing API call with current token...');
      
      // Test a simple API endpoint that requires authentication
      const response = await fetch('https://api.deactech-eclaims.com/health', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        addTestResult('API call successful - token is valid');
      } else {
        addTestResult(`API call failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      addTestResult(`API test error: ${(error as Error).message || error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const formatTokenInfo = (token: string | undefined) => {
    if (!token) return 'No token';
    
    try {
      // Try to parse JWT
      if (token.includes('.')) {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          return `JWT - User: ${payload.sub || payload.userId}, Expires: ${new Date(payload.exp * 1000).toLocaleString()}`;
        }
      }
      
      // Try to parse custom token
      const parsed = JSON.parse(atob(token));
      return `Custom - User: ${parsed.userId}, Expires: ${new Date(parsed.expiresAt).toLocaleString()}`;
    } catch {
      return `Token length: ${token.length} chars`;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Master App Integration Test
      </ThemedText>

      <ThemedView style={styles.statusSection}>
        <ThemedText style={styles.statusLabel}>Status:</ThemedText>
        <ThemedText>Master App Available: {masterAppAvailable ? '✅' : '❌'}</ThemedText>
        <ThemedText>Authenticated: {isAuthenticated ? '✅' : '❌'}</ThemedText>
        <ThemedText>Token Valid: {tokenValid ? '✅' : '❌'}</ThemedText>
        
        {authToken && (
          <ThemedText style={styles.tokenInfo}>
            Token: {formatTokenInfo(authToken)}
          </ThemedText>
        )}
        
        {user.masterAppSession && (
          <>
            <ThemedText>Session ID: {user.masterAppSession.sessionId}</ThemedText>
            <ThemedText>Master App User: {user.masterAppSession.masterAppUserId}</ThemedText>
          </>
        )}
      </ThemedView>

      <ThemedView style={styles.buttonSection}>
        <ThemedButton
          title="Check Master App"
          onPress={checkMasterApp}
          style={styles.button}
        />
        <ThemedButton
          title="Test Authentication"
          onPress={testAuthentication}
          style={styles.button}
        />
        <ThemedButton
          title="Test Token Refresh"
          onPress={testTokenRefresh}
          style={styles.button}
        />
        <ThemedButton
          title="Test Manual Token Auth"
          onPress={testManualTokenAuth}
          style={styles.button}
        />
        <ThemedButton
          title="Test API with Token"
          onPress={testApiWithToken}
          style={styles.button}
        />
        <ThemedButton
          title="Clear Results"
          onPress={clearResults}
          style={[styles.button, styles.clearButton]}
        />
      </ThemedView>

      <ThemedView style={styles.resultsSection}>
        <ThemedText type="subtitle" style={styles.resultsTitle}>Test Results:</ThemedText>
        <ScrollView style={styles.results} showsVerticalScrollIndicator={true}>
          {testResults.length === 0 ? (
            <ThemedText style={styles.noResultsText}>No test results yet...</ThemedText>
          ) : (
            testResults.map((result, index) => (
              <ThemedText key={index} style={styles.resultText}>
                {result}
              </ThemedText>
            ))
          )}
        </ScrollView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  statusSection: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tokenInfo: {
    fontSize: 11,
    marginTop: 5,
    opacity: 0.8,
    fontFamily: 'monospace',
  },
  buttonSection: {
    marginBottom: 20,
  },
  button: {
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
  },
  resultsSection: {
    flex: 1,
  },
  resultsTitle: {
    marginBottom: 10,
  },
  results: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 10,
    maxHeight: 300,
  },
  resultText: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  noResultsText: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});
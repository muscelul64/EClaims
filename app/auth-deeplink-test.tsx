import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDeepLink } from '@/hooks/use-deeplink';
import { useUserStore } from '@/stores/use-user-store';
import { createSecureUniversalLink, generateSecureToken } from '@/utils/auth-token';
import { secureShareManager } from '@/utils/secure-share';

/**
 * Enhanced DeepLink Testing Screen with Authentication Tokens
 * This screen demonstrates all available deeplink functionality including secure token-based sharing
 * Access via: porscheeclaims://auth-deeplink-test
 */
export default function DeepLinkTestScreen() {
  const { quickNavigation, quickShare, generateLinks } = useDeepLink();
  const { user } = useUserStore();
  const [targetUserId, setTargetUserId] = useState('user123');
  const [tokenExpiry, setTokenExpiry] = useState('60');
  
  // Regular deeplink tests
  const testDeepLinks = [
    {
      title: 'Home',
      action: () => quickNavigation.toHome(),
      shareAction: () => quickShare.app()
    },
    {
      title: 'New Statement',
      action: () => quickNavigation.toNewStatement(),
      shareAction: () => Alert.alert('Link', generateLinks.universalLink('new-statement'))
    },
    {
      title: 'Vehicles',
      action: () => quickNavigation.toVehicles(),
      shareAction: () => Alert.alert('Link', generateLinks.universalLink('vehicles'))
    },
    {
      title: 'Add Vehicle',
      action: () => quickNavigation.toAddVehicle(),
      shareAction: () => Alert.alert('Link', generateLinks.universalLink('add-vehicle'))
    },
    {
      title: 'Damage Assessment',
      action: () => quickNavigation.toDamage(),
      shareAction: () => quickShare.damageAssessment()
    },
    {
      title: 'Emergency Contacts',
      action: () => quickNavigation.toEmergency(),
      shareAction: () => quickShare.emergency()
    },
    {
      title: 'Settings',
      action: () => quickNavigation.toSettings(),
      shareAction: () => Alert.alert('Link', generateLinks.universalLink('settings'))
    }
  ];
  
  // Secure token-based deeplink tests
  const testSecureDeepLinks = [
    {
      title: 'Secure Statement Share',
      action: () => {
        const link = createSecureUniversalLink('statement', targetUserId, 
          { statementId: 'test-123', mode: 'view' }, 
          { expiresInMinutes: parseInt(tokenExpiry) }
        );
        Alert.alert('Secure Statement Link', link);
      }
    },
    {
      title: 'Secure Vehicle Share',
      action: () => {
        const link = createSecureUniversalLink('vehicle', targetUserId,
          { vehicleId: 'test-456', action: 'view' },
          { expiresInMinutes: parseInt(tokenExpiry) }
        );
        Alert.alert('Secure Vehicle Link', link);
      }
    },
    {
      title: 'Secure Login Invitation',
      action: () => secureShareManager.shareSecureLogin(targetUserId, {
        expiresInMinutes: parseInt(tokenExpiry),
        scope: ['login', 'profile:read']
      })
    },
    {
      title: 'Secure Damage Assessment',
      action: () => secureShareManager.shareDamageAssessmentSecure(
        targetUserId, 
        'test-vehicle-789',
        { 
          expiresInMinutes: parseInt(tokenExpiry),
          scope: ['damage:read', 'damage:write'] 
        }
      )
    },
    {
      title: 'Secure Emergency Info',
      action: () => secureShareManager.shareEmergencyInfoSecure(targetUserId, {
        expiresInMinutes: parseInt(tokenExpiry),
        scope: ['emergency:read']
      })
    }
  ];
  
  const handleGenerateQR = (action: string, params?: Record<string, string>) => {
    const qrData = generateLinks.qrData(action, params);
    Alert.alert('QR Code Data', qrData);
  };
  
  const handleGenerateSecureQR = (action: string, params?: Record<string, string>) => {
    if (!user?.authenticated) {
      Alert.alert('Authentication Required', 'Please sign in to generate secure QR codes.');
      return;
    }
    
    const secureLink = createSecureUniversalLink(action, targetUserId, params, {
      expiresInMinutes: parseInt(tokenExpiry)
    });
    Alert.alert('Secure QR Code Data', secureLink);
  };
  
  const handleTestTokenGeneration = () => {
    if (!user?.authenticated) {
      Alert.alert('Authentication Required', 'Please sign in to test token generation.');
      return;
    }
    
    const token = generateSecureToken(targetUserId, {
      expiresInMinutes: parseInt(tokenExpiry),
      scope: ['test:read', 'test:write']
    });
    
    Alert.alert('Generated Token', token);
  };
  
  const handleTestTokenParsing = () => {
    const testUrl = createSecureUniversalLink('test', targetUserId, 
      { action: 'parse' },
      { expiresInMinutes: parseInt(tokenExpiry) }
    );
    
    Alert.alert('Test URL for Parsing', testUrl, [
      { text: 'Copy', onPress: () => console.log('URL:', testUrl) },
      { text: 'OK' }
    ]);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">DeepLink Testing</ThemedText>
        <ThemedText style={styles.subtitle}>
          Test all deeplink functionality including secure authentication tokens
        </ThemedText>
        
        {user?.authenticated && (
          <ThemedText style={styles.userInfo}>
            Logged in as: {user.username}
          </ThemedText>
        )}
      </ThemedView>
      
      <ScrollView style={styles.content}>
        {/* Secure Token Configuration */}
        <ThemedView style={styles.configSection}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Secure Token Configuration
          </ThemedText>
          
          <View style={styles.inputRow}>
            <ThemedText style={styles.inputLabel}>Target User ID:</ThemedText>
            <TextInput
              style={styles.textInput}
              value={targetUserId}
              onChangeText={setTargetUserId}
              placeholder="Enter user ID"
            />
          </View>
          
          <View style={styles.inputRow}>
            <ThemedText style={styles.inputLabel}>Expiry (minutes):</ThemedText>
            <TextInput
              style={styles.textInput}
              value={tokenExpiry}
              onChangeText={setTokenExpiry}
              placeholder="60"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.buttonRow}>
            <ThemedButton
              title="Generate Token"
              onPress={handleTestTokenGeneration}
              variant="primary"
              style={styles.button}
            />
            <ThemedButton
              title="Test Parsing"
              onPress={handleTestTokenParsing}
              variant="outline"
              style={styles.button}
            />
          </View>
        </ThemedView>
        
        {/* Secure DeepLinks */}
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Secure Token-Based DeepLinks
          </ThemedText>
          
          {testSecureDeepLinks.map((item, index) => (
            <ThemedView key={index} style={styles.testItem}>
              <ThemedText type="defaultSemiBold" style={styles.itemTitle}>
                {item.title}
              </ThemedText>
              
              <View style={styles.buttonRow}>
                <ThemedButton
                  title="Generate & Share"
                  onPress={item.action}
                  variant="primary"
                  style={styles.button}
                />
                <ThemedButton
                  title="QR"
                  onPress={() => handleGenerateSecureQR(item.title.toLowerCase().replace(/ /g, '-'))}
                  variant="secondary"
                  style={styles.smallButton}
                />
              </View>
            </ThemedView>
          ))}
        </ThemedView>
        
        {/* Regular DeepLinks */}
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Regular DeepLinks
          </ThemedText>
          
          {testDeepLinks.map((item, index) => (
            <ThemedView key={index} style={styles.testItem}>
              <ThemedText type="defaultSemiBold" style={styles.itemTitle}>
                {item.title}
              </ThemedText>
              
              <View style={styles.buttonRow}>
                <ThemedButton
                  title="Navigate"
                  onPress={item.action}
                  variant="primary"
                  style={styles.button}
                />
                <ThemedButton
                  title="Share"
                  onPress={item.shareAction}
                  variant="outline"
                  style={styles.button}
                />
                <ThemedButton
                  title="QR"
                  onPress={() => handleGenerateQR(item.title.toLowerCase().replace(/ /g, '-'))}
                  variant="secondary"
                  style={styles.smallButton}
                />
              </View>
            </ThemedView>
          ))}
        </ThemedView>
        
        {/* Example URLs */}
        <ThemedView style={styles.examplesSection}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Example URLs
          </ThemedText>
          
          <ThemedView style={styles.exampleItem}>
            <ThemedText style={styles.exampleLabel}>Custom Scheme:</ThemedText>
            <ThemedText style={styles.exampleUrl} selectable>
              porscheeclaims://new-statement
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.exampleItem}>
            <ThemedText style={styles.exampleLabel}>Universal Link:</ThemedText>
            <ThemedText style={styles.exampleUrl} selectable>
              https://eclaims.porsche.com/new-statement
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.exampleItem}>
            <ThemedText style={styles.exampleLabel}>With Token:</ThemedText>
            <ThemedText style={styles.exampleUrl} selectable>
              https://eclaims.porsche.com/statement/statementId/123?token=valid_eyJ1c2VySWQ...
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.exampleItem}>
            <ThemedText style={styles.exampleLabel}>Secure Login:</ThemedText>
            <ThemedText style={styles.exampleUrl} selectable>
              porscheeclaims://login/userId/user123/invitedBy/admin?token=valid_eyJleH...
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 8,
  },
  userInfo: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  configSection: {
    padding: 16,
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    width: 120,
    fontSize: 14,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    backgroundColor: 'white',
  },
  testItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemTitle: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
  },
  smallButton: {
    width: 50,
  },
  examplesSection: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  exampleItem: {
    marginBottom: 12,
  },
  exampleLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  exampleUrl: {
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 8,
    borderRadius: 4,
  },
});
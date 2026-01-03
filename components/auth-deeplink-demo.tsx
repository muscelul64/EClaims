import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { secureShareManager } from '@/utils/secure-share';
import { createSecureUniversalLink } from '@/utils/auth-token';
import { useUserStore } from '@/stores/use-user-store';

interface AuthDeepLinkDemoProps {
  title?: string;
}

/**
 * Authentication-enabled DeepLink Demo Component
 * Shows how to integrate secure deeplinks with authentication tokens
 */
export function AuthDeepLinkDemo({ title = "Secure Sharing Demo" }: AuthDeepLinkDemoProps) {
  const { user } = useUserStore();
  const [isSharing, setIsSharing] = useState(false);
  
  // Example: Share a statement with authentication required
  const handleShareStatement = async () => {
    setIsSharing(true);
    try {
      await secureShareManager.shareStatement(
        'demo-statement-123',
        'view',
        {
          requireAuth: true,
          expiresInMinutes: 120, // 2 hours
          scope: ['statement:read']
        }
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to share statement');
    } finally {
      setIsSharing(false);
    }
  };
  
  // Example: Share a vehicle with time-limited access
  const handleShareVehicle = async () => {
    setIsSharing(true);
    try {
      await secureShareManager.shareVehicle(
        'demo-vehicle-456', 
        'edit',
        {
          requireAuth: true,
          expiresInMinutes: 60, // 1 hour
          scope: ['vehicle:read', 'vehicle:write']
        }
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to share vehicle');
    } finally {
      setIsSharing(false);
    }
  };
  
  // Example: Send secure login invitation
  const handleInviteUser = async () => {
    setIsSharing(true);
    try {
      await secureShareManager.shareSecureLogin(
        'invited-user@example.com',
        {
          expiresInMinutes: 24 * 60, // 24 hours
          scope: ['login', 'profile:read']
        }
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation');
    } finally {
      setIsSharing(false);
    }
  };
  
  // Example: Share emergency info with secure access
  const handleShareEmergency = async () => {
    setIsSharing(true);
    try {
      await secureShareManager.shareEmergencyInfoSecure(
        'emergency-contact@example.com',
        {
          expiresInMinutes: 7 * 24 * 60, // 1 week
          scope: ['emergency:read']
        }
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to share emergency info');
    } finally {
      setIsSharing(false);
    }
  };
  
  // Example: Generate secure link manually
  const handleGenerateSecureLink = () => {
    if (!user?.authenticated) {
      Alert.alert('Authentication Required', 'Please sign in to generate secure links.');
      return;
    }
    
    const secureLink = createSecureUniversalLink(
      'damage-assessment',
      'target-user@example.com',
      {
        vehicleId: 'demo-789',
        type: 'full-assessment'
      },
      {
        expiresInMinutes: 180, // 3 hours
        scope: ['damage:read', 'damage:write', 'photos:upload']
      }
    );
    
    Alert.alert('Secure Link Generated', secureLink, [
      { text: 'Copy', onPress: () => console.log('Copied:', secureLink) },
      { text: 'OK' }
    ]);
  };
  
  if (!user?.authenticated) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        <ThemedText style={styles.description}>
          Please sign in to test secure authentication features.
        </ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="defaultSemiBold">{title}</ThemedText>
      <ThemedText style={styles.description}>
        Test secure deeplink sharing with authentication tokens. All links will include authentication tokens and expire after the specified time.
      </ThemedText>
      
      <View style={styles.buttonContainer}>
        <ThemedButton
          title="Share Statement (Secure)"
          onPress={handleShareStatement}
          variant="primary"
          disabled={isSharing}
          style={styles.button}
        />
        
        <ThemedButton
          title="Share Vehicle (Editable)"
          onPress={handleShareVehicle}
          variant="primary"
          disabled={isSharing}
          style={styles.button}
        />
        
        <ThemedButton
          title="Invite User (Login)"
          onPress={handleInviteUser}
          variant="outline"
          disabled={isSharing}
          style={styles.button}
        />
        
        <ThemedButton
          title="Share Emergency Info"
          onPress={handleShareEmergency}
          variant="outline"
          disabled={isSharing}
          style={styles.button}
        />
        
        <ThemedButton
          title="Generate Custom Link"
          onPress={handleGenerateSecureLink}
          variant="secondary"
          disabled={isSharing}
          style={styles.button}
        />
      </View>
      
      <ThemedView style={styles.infoBox}>
        <ThemedText style={styles.infoTitle}>Token Features:</ThemedText>
        <ThemedText style={styles.infoText}>• Time-limited access (customizable expiry)</ThemedText>
        <ThemedText style={styles.infoText}>• Scoped permissions (read/write controls)</ThemedText>
        <ThemedText style={styles.infoText}>• User-specific tokens (target user validation)</ThemedText>
        <ThemedText style={styles.infoText}>• Automatic authentication (seamless login)</ThemedText>
        <ThemedText style={styles.infoText}>• Secure token validation (backend verification)</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  description: {
    marginVertical: 12,
    opacity: 0.7,
  },
  buttonContainer: {
    gap: 12,
    marginVertical: 16,
  },
  button: {
    // Button styles will come from ThemedButton
  },
  infoBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.8,
  },
});
import { useUserStore } from '@/stores/use-user-store';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { createSecureDeepLink, createSecureUniversalLink } from './auth-token';
import { generateDeepLink, generateUniversalLink } from './deeplink';

export interface ShareableContent {
  title: string;
  message: string;
  url: string;
}

export interface SecureShareOptions {
  expiresInMinutes?: number;
  scope?: string[];
  requireAuth?: boolean;
}

export class SecureShareManager {
  // Get current user ID for secure sharing
  private static getCurrentUserId(): string | null {
    const { user } = useUserStore.getState();
    return user?.authenticated ? user.username ?? null : null;
  }
  
  // Share a statement with others (with optional authentication)
  static async shareStatement(
    statementId: string, 
    mode: 'view' | 'edit' = 'view',
    options?: SecureShareOptions
  ) {
    const params = { statementId, mode };
    
    let deepLink: string;
    let universalLink: string;
    
    if (options?.requireAuth) {
      const userId = this.getCurrentUserId();
      if (!userId) {
        Alert.alert('Authentication Required', 'Please sign in to share secure links.');
        return false;
      }
      
      deepLink = createSecureDeepLink('statement', userId, params, options);
      universalLink = createSecureUniversalLink('statement', userId, params, options);
    } else {
      deepLink = generateDeepLink('statement', params);
      universalLink = generateUniversalLink('statement', params);
    }
    
    const content: ShareableContent = {
      title: 'Insurance Statement',
      message: options?.requireAuth 
        ? `Please review this secure insurance statement: ${universalLink}` 
        : `Please review this insurance statement: ${universalLink}`,
      url: universalLink
    };
    
    return this.share(content);
  }
  
  // Share a vehicle for review/editing (with optional authentication)
  static async shareVehicle(
    vehicleId: string, 
    action: 'view' | 'edit' = 'view',
    options?: SecureShareOptions
  ) {
    const params = { vehicleId, action };
    
    let deepLink: string;
    let universalLink: string;
    
    if (options?.requireAuth) {
      const userId = this.getCurrentUserId();
      if (!userId) {
        Alert.alert('Authentication Required', 'Please sign in to share secure links.');
        return false;
      }
      
      deepLink = createSecureDeepLink('vehicle', userId, params, options);
      universalLink = createSecureUniversalLink('vehicle', userId, params, options);
    } else {
      deepLink = generateDeepLink('vehicle', params);
      universalLink = generateUniversalLink('vehicle', params);
    }
    
    const content: ShareableContent = {
      title: 'Vehicle Information',
      message: options?.requireAuth
        ? `Please review this secure vehicle information: ${universalLink}`
        : `Please review this vehicle information: ${universalLink}`,
      url: universalLink
    };
    
    return this.share(content);
  }
  
  // Share secure login invitation
  static async shareSecureLogin(
    invitedUserId: string,
    options: SecureShareOptions = { expiresInMinutes: 60 }
  ) {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      Alert.alert('Authentication Required', 'Please sign in to send login invitations.');
      return false;
    }
    
    const universalLink = createSecureUniversalLink(
      'login', 
      invitedUserId, 
      { invitedBy: currentUserId },
      options
    );
    
    const content: ShareableContent = {
      title: 'Porsche E-Claims Login',
      message: `You have been invited to access Porsche E-Claims. Click here to sign in: ${universalLink}`,
      url: universalLink
    };
    
    return this.share(content);
  }
  
  // Share damage assessment with token for specific user
  static async shareDamageAssessmentSecure(
    targetUserId: string,
    vehicleId?: string, 
    options: SecureShareOptions = { expiresInMinutes: 120, scope: ['damage:read', 'damage:write'] }
  ) {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      Alert.alert('Authentication Required', 'Please sign in to share secure assessments.');
      return false;
    }
    
    const params = { 
      vehicleId: vehicleId || '',
      type: 'assess',
      sharedBy: currentUserId 
    };
    
    const universalLink = createSecureUniversalLink('damage', targetUserId, params, options);
    
    const content: ShareableContent = {
      title: 'Secure Damage Assessment',
      message: `You have been granted access to a damage assessment. This link expires in ${options.expiresInMinutes} minutes: ${universalLink}`,
      url: universalLink
    };
    
    return this.share(content);
  }
  
  // Share emergency contact information with token
  static async shareEmergencyInfoSecure(
    targetUserId: string,
    options: SecureShareOptions = { expiresInMinutes: 1440, scope: ['emergency:read'] } // 24 hours
  ) {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      Alert.alert('Authentication Required', 'Please sign in to share secure emergency information.');
      return false;
    }
    
    const universalLink = createSecureUniversalLink(
      'emergency', 
      targetUserId, 
      { sharedBy: currentUserId },
      options
    );
    
    const content: ShareableContent = {
      title: 'Emergency Contacts',
      message: `Emergency contact information has been shared with you: ${universalLink}`,
      url: universalLink
    };
    
    return this.share(content);
  }
  
  // Generic share method
  private static async share(content: ShareableContent): Promise<boolean> {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        // Fallback to clipboard or show alert
        Alert.alert(
          'Share',
          `${content.message}\n\nLink copied to share manually:`,
          [
            { text: 'Copy Link', onPress: () => this.copyToClipboard(content.url) },
            { text: 'OK', style: 'cancel' }
          ]
        );
        return false;
      }
      
      await Sharing.shareAsync(content.url, {
        mimeType: 'text/plain',
        dialogTitle: content.title
      });
      
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      
      // Fallback alert
      Alert.alert(
        'Share Link',
        content.message,
        [
          { text: 'Copy Link', onPress: () => this.copyToClipboard(content.url) },
          { text: 'OK', style: 'cancel' }
        ]
      );
      
      return false;
    }
  }
  
  // Copy to clipboard as fallback
  private static async copyToClipboard(text: string) {
    try {
      // You could use @react-native-clipboard/clipboard here
      // For now, just show the link
      Alert.alert('Copy Link', text);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }
  
  // Generate QR code data for a secure deeplink
  static generateSecureQRData(
    action: string,
    targetUserId: string,
    params?: Record<string, string>,
    options?: SecureShareOptions
  ): string {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      console.warn('Cannot generate secure QR code - user not authenticated');
      return generateUniversalLink(action, params);
    }
    
    return createSecureUniversalLink(action, targetUserId, params, options);
  }
}

// Convenience export
export const secureShareManager = SecureShareManager;
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { generateDeepLink, generateUniversalLink } from './deeplink';

export interface ShareableContent {
  title: string;
  message: string;
  url: string;
}

export class ShareManager {
  // Share a statement with others
  static async shareStatement(statementId: string, mode: 'view' | 'edit' = 'view') {
    const deepLink = generateDeepLink('statement', { statementId, mode });
    const universalLink = generateUniversalLink('statement', { statementId, mode });
    
    const content: ShareableContent = {
      title: 'Insurance Statement',
      message: `Please review this insurance statement: ${universalLink}`,
      url: universalLink
    };
    
    return this.share(content);
  }
  
  // Share a vehicle for review/editing
  static async shareVehicle(vehicleId: string, action: 'view' | 'edit' = 'view') {
    const deepLink = generateDeepLink('vehicle', { vehicleId, action });
    const universalLink = generateUniversalLink('vehicle', { vehicleId, action });
    
    const content: ShareableContent = {
      title: 'Vehicle Information',
      message: `Please review this vehicle information: ${universalLink}`,
      url: universalLink
    };
    
    return this.share(content);
  }
  
  // Share app download link
  static async shareAppDownload() {
    const appStoreUrl = Platform.select({
      ios: 'https://apps.apple.com/app/deactech-eclaims/id123456789',
      android: 'https://play.google.com/store/apps/details?id=com.deactech.deactecheclaims',
      default: 'https://eclaims.deactech.com/download'
    });
    
    const content: ShareableContent = {
      title: 'Deactech E-Claims App',
      message: `Download the Deactech  E-Claims app: ${appStoreUrl}`,
      url: appStoreUrl!
    };
    
    return this.share(content);
  }
  
  // Share emergency contact information
  static async shareEmergencyInfo() {
    const deepLink = generateDeepLink('emergency');
    const universalLink = generateUniversalLink('emergency');
    
    const content: ShareableContent = {
      title: 'Emergency Contacts',
      message: `Access emergency contacts here: ${universalLink}`,
      url: universalLink
    };
    
    return this.share(content);
  }
  
  // Share damage assessment link
  static async shareDamageAssessment(vehicleId?: string) {
    const params = vehicleId ? { vehicleId, type: 'assess' } : undefined;
    const deepLink = generateDeepLink('damage', params);
    const universalLink = generateUniversalLink('damage', params);
    
    const content: ShareableContent = {
      title: 'Damage Assessment',
      message: `Start a damage assessment: ${universalLink}`,
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
  
  // Generate QR code data for a deeplink
  static generateQRData(action: string, params?: Record<string, string>): string {
    return generateUniversalLink(action, params);
  }
  
  // Parse incoming share data
  static parseSharedUrl(url: string): { action: string; params: any } | null {
    try {
      // This could integrate with the deeplink parser
      // For now, basic parsing
      if (url.includes('eclaims.deactech.com') || url.includes('porscheeclaims://')) {
        return { action: 'shared_link', params: { url } };
      }
      return null;
    } catch (error) {
      console.error('Error parsing shared URL:', error);
      return null;
    }
  }
}

// Convenience export
export const shareManager = ShareManager;
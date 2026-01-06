import { useCallback } from 'react';
import { Alert } from 'react-native';

import { generateUniversalLink, universalLinkManager } from '@/utils/deeplink';
import { shareManager } from '@/utils/share';

export function useDeepLink() {
  // Navigate using Universal Link action
  const navigateByUniversalLink = useCallback((action: string, params?: Record<string, string>) => {
    const url = generateUniversalLink(action, params);
    universalLinkManager['handleUniversalLink']({ url });
  }, []);
  
  // Share a Universal Link
  const shareUniversalLink = useCallback(async (action: string, params?: Record<string, string>) => {
    try {
      const url = generateUniversalLink(action, params);
      const title = getActionTitle(action);
      
      return await shareManager['share']({
        title,
        message: `${title}: ${url}`,
        url
      });
    } catch (error) {
      console.error('Error sharing Universal Link:', error);
      Alert.alert('Error', 'Could not share link');
      return false;
    }
  }, []);
  
  // Quick navigation helpers
  const quickNavigation = {
    toHome: () => navigateByUniversalLink('home'),
    toNewStatement: () => navigateByUniversalLink('new-statement'),
    toVehicles: () => navigateByUniversalLink('vehicles'),
    toAddVehicle: () => navigateByUniversalLink('add-vehicle'),
    toDamage: () => navigateByUniversalLink('damage'),
    toEmergency: () => navigateByUniversalLink('emergency'),
    toSettings: () => navigateByUniversalLink('settings'),
    toStatement: (id: string, mode: 'view' | 'edit' | 'continue' = 'view') => 
      navigateByUniversalLink('statement', { statementId: id, mode }),
    toVehicle: (id: string, action: 'view' | 'edit' = 'view') => 
      navigateByUniversalLink('vehicle', { vehicleId: id, action }),
    toCamera: (type: 'id' | 'license' | 'registration' | 'damage' | 'general', returnTo?: string) => 
      navigateByUniversalLink('camera', { type, ...(returnTo && { returnTo }) })
  };
  
  // Quick share helpers
  const quickShare = {
    app: () => shareManager.shareAppDownload(),
    statement: (id: string, mode: 'view' | 'edit' = 'view') => 
      shareManager.shareStatement(id, mode),
    vehicle: (id: string, action: 'view' | 'edit' = 'view') => 
      shareManager.shareVehicle(id, action),
    emergency: () => shareManager.shareEmergencyInfo(),
    damageAssessment: (vehicleId?: string) => 
      shareManager.shareDamageAssessment(vehicleId)
  };
  
  // Generate links for display
  const generateLinks = {
    universalLink: generateUniversalLink,
    qrData: (action: string, params?: Record<string, string>) => 
      shareManager.generateQRData(action, params)
  };
  
  return {
    navigateByUniversalLink,
    shareUniversalLink,
    quickNavigation,
    quickShare,
    generateLinks
  };
}

// Helper to get user-friendly titles for actions
function getActionTitle(action: string): string {
  const titles: Record<string, string> = {
    'home': 'Porsche E-Claims Home',
    'new-statement': 'New Insurance Statement',
    'statement': 'Insurance Statement',
    'vehicles': 'My Vehicles',
    'vehicle': 'Vehicle Information',
    'add-vehicle': 'Add Vehicle',
    'damage': 'Damage Assessment',
    'camera': 'Camera',
    'emergency': 'Emergency Contacts',
    'settings': 'Settings',
    'login': 'Login'
  };
  
  return titles[action] || 'Porsche E-Claims';
}

import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from 'react-i18next';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
}

export default function StatementLocationScreen() {
  const router = useRouter();
  const { time } = useLocalSearchParams();
  const { t } = useTranslation();
  
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [useManualLocation, setUseManualLocation] = useState(false);
  
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#e1e1e1', dark: '#333' }, 'icon');

  useEffect(() => {
    checkLocationPermissions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkLocationPermissions = async () => {
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    
    if (existingStatus !== 'granted') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('activateGPS.title') || 'Location Permission',
          t('activateGPS.alertBody') || 'Location access is required for this feature',
          [
            { text: t('common.cancel') || 'Cancel', style: 'cancel' },
            { 
              text: t('activateGPS.activate') || 'Activate', 
              onPress: () => requestLocationPermissions() 
            }
          ]
        );
      }
    }
  };

  const requestLocationPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error requesting location permissions:', error);
    }
  };

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = location.coords;
      
      // Get address from coordinates
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      const address = addressResponse[0];
      const formattedAddress = `${address?.street || ''} ${address?.streetNumber || ''}, ${address?.city || ''}, ${address?.country || ''}`.trim();
      
      setLocation({
        latitude,
        longitude,
        address: formattedAddress,
        accuracy: location.coords.accuracy || undefined,
      });
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        t('activateGPS.alertHeader') || 'Location Required',
        t('activateGPS.alertBody') || 'Please enable location services',
        [{ text: t('common.ok') || 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleManualAddress = () => {
    Alert.prompt(
      t('statementLocation.manualAddress') as string,
      t('statementLocation.enterAddress') as string,
      [
        { text: t('common.cancel') as string, style: 'cancel' },
        {
          text: t('common.ok') as string,
          onPress: (address: string | undefined) => {
            if (address && address.trim()) {
              setManualAddress(address.trim());
              setUseManualLocation(true);
            }
          }
        }
      ],
      'plain-text',
      manualAddress
    );
  };

  const handleContinue = () => {
    const eventLocation = useManualLocation ? manualAddress : location?.address;
    
    if (!eventLocation) {
      Alert.alert(
        t('statementLocation.noLocation') || 'No Location',
        t('statementLocation.locationRequired') || 'Location is required to continue',
        [{ text: t('common.ok') || 'OK' }]
      );
      return;
    }

    // Navigate to vehicle selection
    router.push({
      pathname: '/statements/vehicle-selection',
      params: {
        time: time as string,
        location: JSON.stringify(useManualLocation ? { address: manualAddress } : location)
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedButton
          title={t('common.back')}
          onPress={() => router.back()}
          variant="secondary"
          style={styles.headerButton}
        />
        <ThemedText style={styles.headerTitle}>
          {t('choose_location.location')}
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <ThemedText style={styles.sectionTitle}>
            {t('statementLocation.whereDidItHappen')}
          </ThemedText>
          
          <ThemedText style={styles.description}>
            {t('activateGPS.description')}
          </ThemedText>

          {/* GPS Location Section */}
          <View style={styles.locationSection}>
            <ThemedText style={styles.sectionLabel}>
              {t('statementLocation.automaticLocation')}
            </ThemedText>
            
            {location ? (
              <View style={[styles.locationCard, styles.successCard]}>
                <ThemedText style={styles.locationIcon}>📍</ThemedText>
                <View style={styles.locationInfo}>
                  <ThemedText style={styles.locationAddress}>
                    {location.address}
                  </ThemedText>
                  <ThemedText style={styles.locationCoords}>
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </ThemedText>
                  {location.accuracy && (
                    <ThemedText style={styles.locationAccuracy}>
                      {t('statementLocation.accuracy')}: {Math.round(location.accuracy)}m
                    </ThemedText>
                  )}
                </View>
              </View>
            ) : (
              <ThemedView style={[styles.locationCard, { borderColor }]}>
                <ThemedText style={styles.locationIcon}>📍</ThemedText>
                <View style={styles.locationInfo}>
                  <ThemedText style={styles.noLocationText}>
                    {t('statementLocation.noLocationDetected')}
                  </ThemedText>
                </View>
              </ThemedView>
            )}
            
            <ThemedButton
              title={isLoadingLocation ? t('statementLocation.detecting') : t('statementLocation.detectLocation')}
              onPress={getCurrentLocation}
              variant="secondary"
              style={styles.detectButton}
              disabled={isLoadingLocation}
            />
          </View>

          {/* Manual Location Section */}
          <View style={styles.locationSection}>
            <ThemedText style={styles.sectionLabel}>
              {t('statementLocation.manualLocation')}
            </ThemedText>
            
            {useManualLocation ? (
              <View style={[styles.locationCard, styles.successCard]}>
                <ThemedText style={styles.locationIcon}>✏️</ThemedText>
                <View style={styles.locationInfo}>
                  <ThemedText style={styles.locationAddress}>
                    {manualAddress}
                  </ThemedText>
                  <ThemedText style={styles.manualTag}>
                    {t('statementLocation.manuallyEntered')}
                  </ThemedText>
                </View>
              </View>
            ) : (
              <ThemedView style={[styles.locationCard, { borderColor }]}>
                <ThemedText style={styles.locationIcon}>✏️</ThemedText>
                <View style={styles.locationInfo}>
                  <ThemedText style={styles.noLocationText}>
                    {t('statementLocation.noManualAddress')}
                  </ThemedText>
                </View>
              </ThemedView>
            )}
            
            <ThemedButton
              title={t('statementLocation.enterManually')}
              onPress={handleManualAddress}
              variant="outline"
              style={styles.manualButton}
            />
          </View>

          {/* Location Type Toggle */}
          {location && manualAddress && (
            <View style={styles.toggleSection}>
              <ThemedText style={styles.toggleLabel}>
                {t('statementLocation.useLocation')}
              </ThemedText>
              <View style={styles.toggleButtons}>
                <ThemedButton
                  title={t('statementLocation.gpsLocation')}
                  onPress={() => setUseManualLocation(false)}
                  variant={!useManualLocation ? "primary" : "outline"}
                  style={styles.toggleButton}
                />
                <ThemedButton
                  title={t('statementLocation.manualAddress')}
                  onPress={() => setUseManualLocation(true)}
                  variant={useManualLocation ? "primary" : "outline"}
                  style={styles.toggleButton}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <ThemedButton
          title={t('common.continue')}
          onPress={handleContinue}
          variant="primary"
          style={styles.continueButton}
          disabled={!location && !manualAddress}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
  },
  headerButton: {
    minWidth: 80,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 80,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 30,
  },
  locationSection: {
    marginBottom: 30,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  successCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 2,
  },
  locationAccuracy: {
    fontSize: 12,
    opacity: 0.6,
  },
  manualTag: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  noLocationText: {
    fontSize: 14,
    opacity: 0.6,
  },
  detectButton: {
    backgroundColor: '#2196F3',
  },
  manualButton: {
    borderColor: '#FF9800',
  },
  toggleSection: {
    marginTop: 20,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    flex: 1,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
  },
});
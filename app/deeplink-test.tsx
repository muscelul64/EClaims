import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDeepLink } from '@/hooks/use-deeplink';

/**
 * DeepLink Testing Screen
 * This screen demonstrates all available deeplink functionality
 * Access via: porscheeclaims://deeplink-test
 */
export default function DeepLinkTestScreen() {
  const { quickNavigation, quickShare, generateLinks } = useDeepLink();
  
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
    },
    {
      title: 'Camera (Damage)',
      action: () => quickNavigation.toCamera('damage'),
      shareAction: () => Alert.alert('Link', generateLinks.universalLink('camera', { type: 'damage' }))
    },
    {
      title: 'Test Statement',
      action: () => quickNavigation.toStatement('test-statement-123', 'view'),
      shareAction: () => quickShare.statement('test-statement-123', 'view')
    },
    {
      title: 'Test Vehicle',
      action: () => quickNavigation.toVehicle('test-vehicle-456', 'view'),
      shareAction: () => quickShare.vehicle('test-vehicle-456', 'view')
    }
  ];
  
  const handleGenerateQR = (action: string, params?: Record<string, string>) => {
    const qrData = generateLinks.qrData(action, params);
    Alert.alert('QR Code Data', qrData);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">DeepLink Testing</ThemedText>
        <ThemedText style={styles.subtitle}>
          Test all available deeplink functionality
        </ThemedText>
      </ThemedView>
      
      <ScrollView style={styles.content}>
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
              https://eclaims.deactech.com/new-statement
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.exampleItem}>
            <ThemedText style={styles.exampleLabel}>With Parameters:</ThemedText>
            <ThemedText style={styles.exampleUrl} selectable>
              porscheeclaims://statement/statementId/12345/mode/edit
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.exampleItem}>
            <ThemedText style={styles.exampleLabel}>Camera Link:</ThemedText>
            <ThemedText style={styles.exampleUrl} selectable>
              porscheeclaims://camera/type/damage/returnTo/statements
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
  content: {
    flex: 1,
    padding: 20,
  },
  testItem: {
    padding: 16,
    marginBottom: 16,
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
  sectionTitle: {
    marginBottom: 16,
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
    fontSize: 11,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 8,
    borderRadius: 4,
  },
});
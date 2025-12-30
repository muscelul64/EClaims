import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useCustomThemeColor, useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from 'react-i18next';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  type: 'police' | 'medical' | 'fire' | 'roadside' | 'insurance' | 'towing';
  description: string;
  icon: string;
  available24h: boolean;
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'police',
    name: 'Poliția Română',
    phone: '112',
    type: 'police',
    description: 'emergency.policeDescription',
    icon: '🚔',
    available24h: true,
  },
  {
    id: 'medical',
    name: 'Ambulanța',
    phone: '112',
    type: 'medical',
    description: 'emergency.medicalDescription',
    icon: '🚑',
    available24h: true,
  },
  {
    id: 'fire',
    name: 'Pompierii',
    phone: '112',
    type: 'fire',
    description: 'emergency.fireDescription',
    icon: '🚒',
    available24h: true,
  },
  {
    id: 'roadside',
    name: 'Asistență Rutieră',
    phone: '021.9271',
    type: 'roadside',
    description: 'emergency.roadsideDescription',
    icon: '🔧',
    available24h: true,
  },
  {
    id: 'insurance',
    name: 'Asigurări Auto',
    phone: '*',
    type: 'insurance',
    description: 'emergency.insuranceDescription',
    icon: '🛡️',
    available24h: false,
  },
  {
    id: 'towing',
    name: 'Serviciu Remorcare',
    phone: '021.222.2222',
    type: 'towing',
    description: 'emergency.towingDescription',
    icon: '🚛',
    available24h: false,
  },
];

export default function EmergencyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [callingContact, setCallingContact] = useState<string | null>(null);
  
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useCustomThemeColor({ light: '#ffffff', dark: '#1c1c1c' });

  const makeCall = async (contact: EmergencyContact) => {
    if (contact.phone === '*') {
      Alert.alert(
        t('emergency.customContact') || 'Custom Contact',
        t('emergency.addInsuranceNumber') || 'Please add your insurance number',
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('emergency.addNumber') || 'Add Number',
            onPress: () => {
              // Navigate to settings to add insurance number
              Alert.alert(
                t('emergency.notImplemented') || 'Not Implemented',
                t('emergency.featureComingSoon') || 'Feature coming soon'
              );
            }
          }
        ]
      );
      return;
    }

    Alert.alert(
      t('emergency.confirmCall'),
      `${t('emergency.calling')} ${contact.name} (${contact.phone})?`,
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('emergency.call') || 'Call',
          onPress: async () => {
            try {
              setCallingContact(contact.id);
              const phoneUrl = `tel:${contact.phone}`;
              const supported = await Linking.canOpenURL(phoneUrl);
              
              if (supported) {
                await Linking.openURL(phoneUrl);
              } else {
                Alert.alert(
                  t('emergency.callFailed') || 'Call Failed',
                  t('emergency.cannotMakeCall') || 'Cannot make call',
                  [{ text: t('common.ok') || 'OK' }]
                );
              }
            } catch (error) {
              console.error('Call error:', error);
              Alert.alert(
                t('emergency.callFailed') || 'Call Failed',
                t('emergency.errorMakingCall') || 'Error making call',
                [{ text: t('common.ok') || 'OK' }]
              );
            } finally {
              setCallingContact(null);
            }
          }
        }
      ]
    );
  };

  const getContactColor = (type: EmergencyContact['type']) => {
    switch (type) {
      case 'police': return '#2196F3';
      case 'medical': return '#F44336';
      case 'fire': return '#FF5722';
      case 'roadside': return '#FF9800';
      case 'insurance': return '#4CAF50';
      case 'towing': return '#9C27B0';
      default: return '#757575';
    }
  };

  const renderEmergencyContact = (contact: EmergencyContact) => {
    const contactColor = getContactColor(contact.type);
    const isCalling = callingContact === contact.id;
    
    return (
      <TouchableOpacity
        key={contact.id}
        style={[
          styles.contactCard,
          { 
            backgroundColor: cardBackgroundColor,
            borderColor: contactColor,
            opacity: isCalling ? 0.7 : 1
          }
        ]}
        onPress={() => makeCall(contact)}
        activeOpacity={0.8}
        disabled={isCalling}
      >
        <View style={styles.contactHeader}>
          <View style={styles.contactIcon}>
            <ThemedText style={styles.contactEmoji}>
              {contact.icon}
            </ThemedText>
          </View>
          
          <View style={styles.contactInfo}>
            <ThemedText style={styles.contactName}>
              {contact.name}
            </ThemedText>
            <ThemedText style={styles.contactDescription}>
              {t(contact.description)}
            </ThemedText>
          </View>
          
          {contact.available24h && (
            <View style={styles.available24h}>
              <ThemedText style={styles.available24hText}>
                24/7
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.contactFooter}>
          <View style={[styles.phoneContainer, { backgroundColor: contactColor }]}>
            <ThemedText style={styles.phoneIcon}>📞</ThemedText>
            <ThemedText style={styles.phoneNumber}>
              {contact.phone}
            </ThemedText>
          </View>
          
          <ThemedText style={styles.callAction}>
            {isCalling ? t('emergency.calling') : t('emergency.tapToCall')}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
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
          {t('emergency.emergencyContacts')}
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Emergency Banner */}
        <View style={styles.emergencyBanner}>
          <ThemedText style={styles.emergencyIcon}>🚨</ThemedText>
          <View style={styles.emergencyTextContainer}>
            <ThemedText style={styles.emergencyTitle}>
              {t('emergency.emergencyTitle')}
            </ThemedText>
            <ThemedText style={styles.emergencyDescription}>
              {t('emergency.emergencyDescription')}
            </ThemedText>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <ThemedText style={styles.sectionTitle}>
            {t('emergency.quickActions')}
          </ThemedText>
          
          <View style={styles.quickActionButtons}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#F44336' }]}
              onPress={() => makeCall(EMERGENCY_CONTACTS.find(c => c.type === 'medical')!)}
            >
              <ThemedText style={styles.quickActionIcon}>🚑</ThemedText>
              <ThemedText style={styles.quickActionText}>112</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#2196F3' }]}
              onPress={() => makeCall(EMERGENCY_CONTACTS.find(c => c.type === 'police')!)}
            >
              <ThemedText style={styles.quickActionIcon}>🚔</ThemedText>
              <ThemedText style={styles.quickActionText}>112</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#FF9800' }]}
              onPress={() => makeCall(EMERGENCY_CONTACTS.find(c => c.type === 'roadside')!)}
            >
              <ThemedText style={styles.quickActionIcon}>🔧</ThemedText>
              <ThemedText style={styles.quickActionText}>{t('emergency.roadside')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* All Contacts */}
        <View style={styles.allContacts}>
          <ThemedText style={styles.sectionTitle}>
            {t('emergency.allContacts')}
          </ThemedText>
          
          <View style={styles.contactsList}>
            {EMERGENCY_CONTACTS.map(renderEmergencyContact)}
          </View>
        </View>

        {/* Safety Tips */}
        <View style={styles.safetyTips}>
          <ThemedText style={styles.sectionTitle}>
            {t('emergency.safetyTips')}
          </ThemedText>
          
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <ThemedText style={styles.tipIcon}>🛡️</ThemedText>
              <ThemedText style={styles.tipText}>
                {t('emergency.tip1')}
              </ThemedText>
            </View>
            
            <View style={styles.tipItem}>
              <ThemedText style={styles.tipIcon}>📱</ThemedText>
              <ThemedText style={styles.tipText}>
                {t('emergency.tip2')}
              </ThemedText>
            </View>
            
            <View style={styles.tipItem}>
              <ThemedText style={styles.tipIcon}>📍</ThemedText>
              <ThemedText style={styles.tipText}>
                {t('emergency.tip3')}
              </ThemedText>
            </View>
            
            <View style={styles.tipItem}>
              <ThemedText style={styles.tipIcon}>🚗</ThemedText>
              <ThemedText style={styles.tipText}>
                {t('emergency.tip4')}
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
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
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 12,
    padding: 20,
    margin: 20,
  },
  emergencyIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  emergencyTextContainer: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 4,
  },
  emergencyDescription: {
    fontSize: 14,
    color: '#F44336',
    lineHeight: 18,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  quickActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  allContacts: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  contactsList: {
    gap: 12,
  },
  contactCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactEmoji: {
    fontSize: 24,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 18,
  },
  available24h: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  available24hText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  contactFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  phoneIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  phoneNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  callAction: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  safetyTips: {
    padding: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
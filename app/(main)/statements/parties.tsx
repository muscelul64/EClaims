import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from 'react-i18next';

interface Party {
  id: string;
  type: 'driver' | 'passenger' | 'pedestrian' | 'property_owner' | 'witness';
  name: string;
  phone?: string;
  isInsured?: boolean;
  insuranceCompany?: string;
}

const PARTY_TYPES = [
  {
    id: 'driver',
    icon: '🚗',
    title: 'statementParties.driver',
    description: 'statementParties.driverDescription'
  },
  {
    id: 'passenger',
    icon: '👥',
    title: 'statementParties.passenger',
    description: 'statementParties.passengerDescription'
  },
  {
    id: 'pedestrian',
    icon: '🚶',
    title: 'statementParties.pedestrian',
    description: 'statementParties.pedestrianDescription'
  },
  {
    id: 'property_owner',
    icon: '🏠',
    title: 'statementParties.propertyOwner',
    description: 'statementParties.propertyOwnerDescription'
  },
  {
    id: 'witness',
    icon: '👁️',
    title: 'statementParties.witness',
    description: 'statementParties.witnessDescription'
  }
];

export default function StatementPartiesScreen() {
  const router = useRouter();
  const { time, location, vehicle } = useLocalSearchParams();
  const { t } = useTranslation();
  
  const [selectedParties, setSelectedParties] = useState<string[]>([]);
  const [partyDetails, setPartyDetails] = useState<Record<string, Partial<Party>>>({});
  
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1c' }, 'background');
  const borderColor = useThemeColor({ light: '#e1e1e1', dark: '#333' }, 'icon');
  const selectedBorderColor = useThemeColor({}, 'tint');

  const handlePartyToggle = (partyType: string) => {
    setSelectedParties(prev => {
      if (prev.includes(partyType)) {
        // Remove party
        const newParties = prev.filter(p => p !== partyType);
        const newDetails = { ...partyDetails };
        delete newDetails[partyType];
        setPartyDetails(newDetails);
        return newParties;
      } else {
        // Add party
        return [...prev, partyType];
      }
    });
  };

  const handlePartyDetails = (partyType: string) => {
    const partyTypeData = PARTY_TYPES.find(p => p.id === partyType);
    if (!partyTypeData) return;

    Alert.prompt(
      t(partyTypeData.title) as string,
      t('statementParties.enterName') as string,
      [
        { text: t('common.cancel') as string, style: 'cancel' },
        {
          text: t('common.ok') as string,
          onPress: (name: string | undefined) => {
            if (name && name.trim()) {
              setPartyDetails(prev => ({
                ...prev,
                [partyType]: {
                  ...prev[partyType],
                  id: partyType,
                  type: partyType as Party['type'],
                  name: name.trim()
                }
              }));
            }
          }
        }
      ],
      'plain-text',
      partyDetails[partyType]?.name || ''
    );
  };

  const handleContinue = () => {
    if (selectedParties.length === 0) {
      Alert.alert(
        t('statementParties.noPartiesSelected') as string,
        t('statementParties.selectPartiesRequired') as string,
        [{ text: t('common.ok') as string }]
      );
      return;
    }

    // Check if all selected parties have names
    const partiesWithoutNames = selectedParties.filter(partyType => !partyDetails[partyType]?.name);
    
    if (partiesWithoutNames.length > 0) {
      const partyNames = partiesWithoutNames.map(type => t(PARTY_TYPES.find(p => p.id === type)?.title || '') as string);
      Alert.alert(
        t('statementParties.incompleteDetails') as string,
        t('statementParties.addNamesFor') as string + ': ' + partyNames.join(', '),
        [{ text: t('common.ok') as string }]
      );
      return;
    }

    // Navigate to circumstances/details
    const partiesData = selectedParties.map(partyType => partyDetails[partyType]);
    
    router.push({
      pathname: '/statements/circumstances',
      params: {
        time: time as string,
        location: location as string,
        vehicle: vehicle as string,
        parties: JSON.stringify(partiesData)
      }
    });
  };

  const renderPartyType = (partyType: typeof PARTY_TYPES[0]) => {
    const isSelected = selectedParties.includes(partyType.id);
    const hasDetails = partyDetails[partyType.id]?.name;
    
    return (
      <View key={partyType.id} style={styles.partyTypeContainer}>
        <TouchableOpacity
          style={[
            styles.partyCard,
            { 
              backgroundColor: cardBackgroundColor,
              borderColor: isSelected ? selectedBorderColor : borderColor
            },
            isSelected && styles.selectedCard
          ]}
          onPress={() => handlePartyToggle(partyType.id)}
          activeOpacity={0.7}
        >
          <View style={styles.partyContent}>
            <View style={styles.partyInfo}>
              <ThemedText style={styles.partyIcon}>
                {partyType.icon}
              </ThemedText>
              <View style={styles.partyTextInfo}>
                <ThemedText style={styles.partyTitle}>
                  {t(partyType.title)}
                </ThemedText>
                <ThemedText style={styles.partyDescription}>
                  {t(partyType.description)}
                </ThemedText>
                {hasDetails && (
                  <ThemedText style={styles.partyDetailsText}>
                    {partyDetails[partyType.id]?.name}
                  </ThemedText>
                )}
              </View>
            </View>

            {isSelected && (
              <View style={styles.selectedIndicator}>
                <ThemedText style={styles.selectedIcon}>✓</ThemedText>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {isSelected && (
          <ThemedButton
            title={hasDetails ? t('statementParties.editDetails') : t('statementParties.addDetails')}
            onPress={() => handlePartyDetails(partyType.id)}
            variant="outline"
            style={styles.detailsButton}
          />
        )}
      </View>
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
          {t('statementParties.involvedParties')}
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <ThemedText style={styles.sectionTitle}>
            {t('statementParties.whoWasInvolved')}
          </ThemedText>
          
          <ThemedText style={styles.description}>
            {t('statementParties.selectAllInvolvedParties')}
          </ThemedText>

          <View style={styles.partiesContainer}>
            {PARTY_TYPES.map(renderPartyType)}
          </View>

          {/* Summary */}
          {selectedParties.length > 0 && (
            <View style={styles.summary}>
              <ThemedText style={styles.summaryTitle}>
                {t('statementParties.selectedParties')} ({selectedParties.length})
              </ThemedText>
              {selectedParties.map(partyType => {
                const partyTypeData = PARTY_TYPES.find(p => p.id === partyType);
                const details = partyDetails[partyType];
                return (
                  <View key={partyType} style={styles.summaryItem}>
                    <ThemedText style={styles.summaryIcon}>
                      {partyTypeData?.icon}
                    </ThemedText>
                    <ThemedText style={styles.summaryText}>
                      {t(partyTypeData?.title || '')}: {details?.name || t('statementParties.noName')}
                    </ThemedText>
                  </View>
                );
              })}
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
          disabled={selectedParties.length === 0}
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
  partiesContainer: {
    gap: 15,
  },
  partyTypeContainer: {
    marginBottom: 10,
  },
  partyCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
  },
  selectedCard: {
    borderWidth: 2,
  },
  partyContent: {
    position: 'relative',
  },
  partyInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 40,
  },
  partyIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  partyTextInfo: {
    flex: 1,
  },
  partyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  partyDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 18,
  },
  partyDetailsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2196F3',
    marginTop: 8,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIcon: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  detailsButton: {
    marginTop: 10,
    borderColor: '#2196F3',
  },
  summary: {
    marginTop: 30,
    padding: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#4CAF50',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  summaryText: {
    fontSize: 14,
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
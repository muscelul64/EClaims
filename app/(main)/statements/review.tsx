import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ClaimStatement, useStatementsStore } from '@/stores/use-statements-store';
import { useTranslation } from 'react-i18next';

export default function StatementReviewScreen() {
  const router = useRouter();
  const { time, location, vehicle, parties, circumstances } = useLocalSearchParams();
  const { t } = useTranslation();
  const { addStatement } = useStatementsStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1c' }, 'background');
  const borderColor = useThemeColor({ light: '#e1e1e1', dark: '#333' }, 'icon');

  // Mapping from circumstance IDs to translation keys
  const circumstanceTranslationMap: Record<string, string> = {
    'rear_collision': 'rearCollision',
    'side_collision': 'sideCollision', 
    'front_collision': 'frontCollision',
    'parking_incident': 'parkingIncident',
    'single_vehicle': 'singleVehicle',
    'pedestrian_incident': 'pedestrianIncident',
    'property_damage': 'propertyDamage',
    'other': 'other'
  };

  // Parse the data with error handling
  let timeData = null;
  let locationData = null;
  let vehicleData = null;
  let partiesData: any[] = [];
  let circumstancesData = null;

  // Time is passed as a simple ISO string, not JSON
  try {
    if (time && typeof time === 'string') {
      // If it looks like JSON (starts with {), parse it as JSON
      if (time.startsWith('{')) {
        timeData = JSON.parse(time as string);
      } else {
        // Otherwise, treat it as an ISO string
        timeData = { selectedDateTime: time, isRecentEvent: false };
      }
    }
  } catch (error) {
    console.error('Error parsing time data:', error);
    timeData = { selectedDateTime: time, isRecentEvent: false };
  }

  try {
    locationData = location ? JSON.parse(location as string) : null;
  } catch (error) {
    console.error('Error parsing location data:', error);
    locationData = null;
  }

  try {
    vehicleData = vehicle ? JSON.parse(vehicle as string) : null;
  } catch (error) {
    console.error('Error parsing vehicle data:', error);
    vehicleData = null;
  }

  try {
    partiesData = parties ? JSON.parse(parties as string) : [];
  } catch (error) {
    console.error('Error parsing parties data:', error);
    partiesData = [];
  }

  try {
    circumstancesData = circumstances ? JSON.parse(circumstances as string) : null;
  } catch (error) {
    console.error('Error parsing circumstances data:', error);
    circumstancesData = null;
  }

  const handleEdit = (section: string) => {
    Alert.alert(
      t('statementReview.editSection') || 'Edit Section',
      t('statementReview.editSectionDescription') || 'This will allow you to edit the selected section',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.edit') || 'Edit',
          onPress: () => {
            switch (section) {
              case 'time':
                router.push('/statements/time');
                break;
              case 'location':
                router.push('/statements/location');
                break;
              case 'vehicle':
                router.push('/statements/vehicle-selection');
                break;
              case 'parties':
                router.push('/statements/parties');
                break;
              case 'circumstances':
                router.push('/statements/circumstances');
                break;
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate required data
      if (!vehicleData) {
        Alert.alert(
          t('statementReview.error') || 'Error',
          'Vehicle information is required',
          [{ text: t('common.ok') || 'OK' }]
        );
        setIsSubmitting(false);
        return;
      }

      if (!circumstancesData?.description) {
        Alert.alert(
          t('statementReview.error') || 'Error', 
          'Description is required',
          [{ text: t('common.ok') || 'OK' }]
        );
        setIsSubmitting(false);
        return;
      }

      // Create the statement object
      const statement: ClaimStatement = {
        id: `statement_${Date.now()}`,
        status: 'draft' as const,
        type: 'accident' as const,
        incidentDate: timeData?.selectedDateTime ? new Date(timeData.selectedDateTime).getTime() : Date.now(),
        description: circumstancesData.description,
        location: locationData || { 
          latitude: 0, 
          longitude: 0, 
          timestamp: Date.now(),
          address: 'Unknown location'
        },
        vehicle: {
          id: vehicleData.id || Date.now().toString(),
          make: vehicleData.make || '',
          model: vehicleData.model || '',
          year: vehicleData.year || 2024,
          licensePlate: vehicleData.licensePlate || '',
          vin: vehicleData.vin || '',
          color: vehicleData.color || '',
          fuelType: vehicleData.fuelType || 'gasoline',
          insuranceCompany: vehicleData.insuranceCompany || '',
          policyNumber: vehicleData.policyNumber || ''
        },
        damages: [],
        photos: [], // Will be added from camera store if needed
        isEmergencyServicesInvolved: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      console.log('Creating statement:', statement);

      // Add to statements store
      await addStatement(statement);

      Alert.alert(
        t('statementReview.success') || 'Success',
        t('statementReview.statementCreated') || 'Statement created successfully',
        [
          {
            text: t('common.ok') || 'OK',
            onPress: () => {
              // Navigate back to statements list
              router.push('/statements');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error creating statement:', error);
      Alert.alert(
        t('statementReview.error') || 'Error',
        String(t('statementReview.errorCreating')) || 'Failed to create statement. Please try again.',
        [{ text: String(t('common.ok')) || 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSection = (
    title: string,
    content: React.ReactNode,
    onEdit: () => void
  ) => (
    <View style={[styles.section, { backgroundColor: cardBackgroundColor, borderColor }]}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <ThemedText style={styles.editButtonText}>
            {t('common.edit')}
          </ThemedText>
        </TouchableOpacity>
      </View>
      <View style={styles.sectionContent}>
        {content}
      </View>
    </View>
  );

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
          {t('statementReview.reviewStatement')}
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <ThemedText style={styles.pageTitle}>
            {t('statementReview.reviewAndSubmit')}
          </ThemedText>
          
          <ThemedText style={styles.description}>
            {t('statementReview.reviewDescription')}
          </ThemedText>

          {/* Time Section */}
          {renderSection(
            t('statementReview.timeSection'),
            (
              <View>
                <ThemedText style={styles.infoText}>
                  {t('statementReview.dateTime')}: {timeData?.selectedDateTime ? new Date(timeData.selectedDateTime).toLocaleString('ro-RO') : t('statementReview.notSpecified')}
                </ThemedText>
                <ThemedText style={styles.infoText}>
                  {t('statementReview.recentEvent')}: {timeData?.isRecentEvent ? t('common.yes') : t('common.no')}
                </ThemedText>
              </View>
            ),
            () => handleEdit('time')
          )}

          {/* Location Section */}
          {renderSection(
            t('statementReview.locationSection'),
            (
              <View>
                <ThemedText style={styles.infoText}>
                  📍 {locationData?.address || t('statementReview.notSpecified')}
                </ThemedText>
                {locationData?.latitude && (
                  <ThemedText style={styles.coordsText}>
                    {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                  </ThemedText>
                )}
              </View>
            ),
            () => handleEdit('location')
          )}

          {/* Vehicle Section */}
          {renderSection(
            t('statementReview.vehicleSection'),
            (
              <View>
                <ThemedText style={styles.infoText}>
                  🚗 {vehicleData?.make} {vehicleData?.model}
                </ThemedText>
                {vehicleData?.licensePlate && (
                  <ThemedText style={styles.infoText}>
                    {t('vehicles.licensePlate')}: {vehicleData.licensePlate}
                  </ThemedText>
                )}
                {vehicleData?.year && (
                  <ThemedText style={styles.infoText}>
                    {t('vehicles.year')}: {vehicleData.year}
                  </ThemedText>
                )}
              </View>
            ),
            () => handleEdit('vehicle')
          )}

          {/* Parties Section */}
          {renderSection(
            t('statementReview.partiesSection'),
            (
              <View>
                {partiesData.length > 0 ? (
                  partiesData.map((party: any, index: number) => (
                    <ThemedText key={index} style={styles.infoText}>
                      👥 {party.name} ({t(`statementParties.${party.type}`)})
                    </ThemedText>
                  ))
                ) : (
                  <ThemedText style={styles.infoText}>
                    {t('statementReview.notSpecified')}
                  </ThemedText>
                )}
              </View>
            ),
            () => handleEdit('parties')
          )}

          {/* Circumstances Section */}
          {renderSection(
            t('statementReview.circumstancesSection'),
            (
              <View>
                <ThemedText style={styles.infoText}>
                  {t('statementReview.type')}: {circumstancesData?.type ? t(`statementCircumstances.${circumstanceTranslationMap[circumstancesData.type] || circumstancesData.type}`) : t('statementReview.notSpecified')}
                </ThemedText>
                
                {circumstancesData?.weather && circumstancesData.weather.length > 0 && (
                  <ThemedText style={styles.infoText}>
                    {t('statementReview.weather')}: {circumstancesData.weather.map((w: string) => t(`weather.${w}`)).join(', ')}
                  </ThemedText>
                )}
                
                {circumstancesData?.roadConditions && circumstancesData.roadConditions.length > 0 && (
                  <ThemedText style={styles.infoText}>
                    {t('statementReview.roadConditions')}: {circumstancesData.roadConditions.map((c: string) => t(`roadConditions.${c}`)).join(', ')}
                  </ThemedText>
                )}
                
                {circumstancesData?.speed && (
                  <ThemedText style={styles.infoText}>
                    {t('statementReview.speed')}: {circumstancesData.speed} km/h
                  </ThemedText>
                )}
                
                {circumstancesData?.description && (
                  <View style={styles.descriptionContainer}>
                    <ThemedText style={styles.descriptionLabel}>
                      {t('statementReview.description')}:
                    </ThemedText>
                    <ThemedText style={styles.descriptionText}>
                      {circumstancesData.description}
                    </ThemedText>
                  </View>
                )}
              </View>
            ),
            () => handleEdit('circumstances')
          )}

          {/* Submission Info */}
          <View style={[styles.submissionInfo, { borderColor }]}>
            <ThemedText style={styles.submissionTitle}>
              {t('statementReview.beforeSubmitting')}
            </ThemedText>
            <ThemedText style={styles.submissionText}>
              • {t('statementReview.accuracyCheck')}
            </ThemedText>
            <ThemedText style={styles.submissionText}>
              • {t('statementReview.addPhotos')}
            </ThemedText>
            <ThemedText style={styles.submissionText}>
              • {t('statementReview.signDocument')}
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <View style={styles.actionButtons}>
          <ThemedButton
            title={t('statementReview.saveDraft')}
            onPress={() => {
              Alert.alert(
                t('statementReview.draftSaved'),
                String(t('statementReview.draftSavedDescription')),
                [
                  {
                    text: String(t('common.ok')),
                    onPress: () => router.push('/statements')
                  }
                ]
              );
            }}
            variant="outline"
            style={styles.draftButton}
          />
          
          <ThemedButton
            title={isSubmitting ? t('statementReview.submitting') : t('statementReview.submitStatement')}
            onPress={handleSubmit}
            variant="primary"
            style={styles.submitButton}
            disabled={isSubmitting}
          />
        </View>
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
  pageTitle: {
    fontSize: 24,
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
  section: {
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2196F3',
  },
  editButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  sectionContent: {
    padding: 20,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  coordsText: {
    fontSize: 12,
    opacity: 0.6,
    fontFamily: 'monospace',
  },
  descriptionContainer: {
    marginTop: 12,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    fontStyle: 'italic',
  },
  submissionInfo: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    backgroundColor: 'rgba(255, 152, 0, 0.05)',
    borderColor: '#FF9800',
  },
  submissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#FF9800',
  },
  submissionText: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  draftButton: {
    flex: 1,
    borderColor: '#FF9800',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
  },
});
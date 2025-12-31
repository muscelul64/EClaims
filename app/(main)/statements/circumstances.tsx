import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from 'react-i18next';

const CIRCUMSTANCES = [
  {
    id: 'rear_collision',
    icon: '🚗💥',
    title: 'statementCircumstances.rearCollision',
    description: 'statementCircumstances.rearCollisionDesc'
  },
  {
    id: 'side_collision',
    icon: '🚗↔️',
    title: 'statementCircumstances.sideCollision',
    description: 'statementCircumstances.sideCollisionDesc'
  },
  {
    id: 'front_collision',
    icon: '💥🚗',
    title: 'statementCircumstances.frontCollision',
    description: 'statementCircumstances.frontCollisionDesc'
  },
  {
    id: 'parking_incident',
    icon: '🚗🅿️',
    title: 'statementCircumstances.parkingIncident',
    description: 'statementCircumstances.parkingIncidentDesc'
  },
  {
    id: 'single_vehicle',
    icon: '🚗🌳',
    title: 'statementCircumstances.singleVehicle',
    description: 'statementCircumstances.singleVehicleDesc'
  },
  {
    id: 'pedestrian_incident',
    icon: '🚶💥',
    title: 'statementCircumstances.pedestrianIncident',
    description: 'statementCircumstances.pedestrianIncidentDesc'
  },
  {
    id: 'property_damage',
    icon: '🏠💥',
    title: 'statementCircumstances.propertyDamage',
    description: 'statementCircumstances.propertyDamageDesc'
  },
  {
    id: 'other',
    icon: '❓',
    title: 'statementCircumstances.other',
    description: 'statementCircumstances.otherDesc'
  }
];

const WEATHER_CONDITIONS = [
  { id: 'clear', icon: '☀️', title: 'weather.clear' },
  { id: 'cloudy', icon: '☁️', title: 'weather.cloudy' },
  { id: 'rain', icon: '🌧️', title: 'weather.rain' },
  { id: 'fog', icon: '🌫️', title: 'weather.fog' },
  { id: 'snow', icon: '❄️', title: 'weather.snow' },
  { id: 'wind', icon: '💨', title: 'weather.wind' }
];

const ROAD_CONDITIONS = [
  { id: 'dry', icon: '🛣️', title: 'roadConditions.dry' },
  { id: 'wet', icon: '💧', title: 'roadConditions.wet' },
  { id: 'icy', icon: '🧊', title: 'roadConditions.icy' },
  { id: 'construction', icon: '🚧', title: 'roadConditions.construction' },
  { id: 'damaged', icon: '🕳️', title: 'roadConditions.damaged' }
];

export default function StatementCircumstancesScreen() {
  const router = useRouter();
  const { time, location, vehicle, parties } = useLocalSearchParams();
  const { t } = useTranslation();
  
  const [selectedCircumstance, setSelectedCircumstance] = useState<string>('');
  const [selectedWeather, setSelectedWeather] = useState<string[]>([]);
  const [selectedRoadConditions, setSelectedRoadConditions] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');
  const [speed, setSpeed] = useState<string>('');
  
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1c' }, 'background');
  const borderColor = useThemeColor({ light: '#e1e1e1', dark: '#333' }, 'icon');
  const selectedBorderColor = useThemeColor({}, 'tint');
  const inputBackgroundColor = useThemeColor({ light: '#f5f5f5', dark: '#333' }, 'background');
  const textColor = useThemeColor({}, 'text');

  const handleSpeedChange = (text: string) => {
    // Only allow numbers, remove any non-numeric characters
    const numericText = text.replace(/[^0-9]/g, '');
    setSpeed(numericText);
  };

  const handleCircumstanceSelect = (circumstanceId: string) => {
    setSelectedCircumstance(circumstanceId);
  };

  const handleWeatherToggle = (weatherId: string) => {
    setSelectedWeather(prev => 
      prev.includes(weatherId) 
        ? prev.filter(w => w !== weatherId)
        : [...prev, weatherId]
    );
  };

  const handleRoadConditionToggle = (conditionId: string) => {
    setSelectedRoadConditions(prev => 
      prev.includes(conditionId)
        ? prev.filter(c => c !== conditionId)
        : [...prev, conditionId]
    );
  };

  const handleContinue = () => {
    if (!selectedCircumstance) {
      Alert.alert(
        t('statementCircumstances.noCircumstanceSelected') as string,
        t('statementCircumstances.selectCircumstanceRequired') as string,
        [{ text: t('common.ok') as string }]
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        t('statementCircumstances.noDescription') as string,
        t('statementCircumstances.descriptionRequired') as string,
        [{ text: t('common.ok') as string }]
      );
      return;
    }

    // Navigate to final review
    const circumstancesData = {
      type: selectedCircumstance,
      weather: selectedWeather,
      roadConditions: selectedRoadConditions,
      description: description.trim(),
      speed: speed.trim() || '0' // Ensure speed is always a valid number string, default to '0' if empty
    };
    
    router.push({
      pathname: '/statements/review',
      params: {
        time: time as string,
        location: location as string,
        vehicle: vehicle as string,
        parties: parties as string,
        circumstances: JSON.stringify(circumstancesData)
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
          {t('statementCircumstances.circumstances')}
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.form}>
          {/* Circumstances */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {t('statementCircumstances.whatHappened')}
            </ThemedText>
            
            <View style={styles.optionsGrid}>
              {CIRCUMSTANCES.map((circumstance) => {
                const isSelected = selectedCircumstance === circumstance.id;
                
                return (
                  <TouchableOpacity
                    key={circumstance.id}
                    style={[
                      styles.optionCard,
                      { 
                        backgroundColor: cardBackgroundColor,
                        borderColor: isSelected ? selectedBorderColor : borderColor
                      },
                      isSelected && styles.selectedCard
                    ]}
                    onPress={() => handleCircumstanceSelect(circumstance.id)}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={styles.optionIcon}>
                      {circumstance.icon}
                    </ThemedText>
                    <ThemedText style={styles.optionTitle}>
                      {t(circumstance.title)}
                    </ThemedText>
                    <ThemedText style={styles.optionDescription}>
                      {t(circumstance.description)}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Weather Conditions */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {t('statementCircumstances.weatherConditions')}
            </ThemedText>
            
            <View style={styles.conditionsRow}>
              {WEATHER_CONDITIONS.map((weather) => {
                const isSelected = selectedWeather.includes(weather.id);
                
                return (
                  <TouchableOpacity
                    key={weather.id}
                    style={[
                      styles.conditionChip,
                      { 
                        backgroundColor: isSelected ? selectedBorderColor : cardBackgroundColor,
                        borderColor: selectedBorderColor
                      }
                    ]}
                    onPress={() => handleWeatherToggle(weather.id)}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={styles.chipIcon}>
                      {weather.icon}
                    </ThemedText>
                    <ThemedText style={[
                      styles.chipText,
                      isSelected && { color: 'white' }
                    ]}>
                      {t(weather.title)}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Road Conditions */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {t('statementCircumstances.roadConditions')}
            </ThemedText>
            
            <View style={styles.conditionsRow}>
              {ROAD_CONDITIONS.map((condition) => {
                const isSelected = selectedRoadConditions.includes(condition.id);
                
                return (
                  <TouchableOpacity
                    key={condition.id}
                    style={[
                      styles.conditionChip,
                      { 
                        backgroundColor: isSelected ? selectedBorderColor : cardBackgroundColor,
                        borderColor: selectedBorderColor
                      }
                    ]}
                    onPress={() => handleRoadConditionToggle(condition.id)}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={styles.chipIcon}>
                      {condition.icon}
                    </ThemedText>
                    <ThemedText style={[
                      styles.chipText,
                      isSelected && { color: 'white' }
                    ]}>
                      {t(condition.title)}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Speed */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {t('statementCircumstances.approximateSpeed')}
            </ThemedText>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.speedInput,
                  { 
                    backgroundColor: inputBackgroundColor,
                    color: textColor,
                    borderColor
                  }
                ]}
                value={speed}
                onChangeText={handleSpeedChange}
                placeholder={t('statementCircumstances.speedPlaceholder') as string}
                placeholderTextColor="rgba(128, 128, 128, 0.8)"
                keyboardType="numeric"
                maxLength={3}
              />
              <ThemedText style={styles.speedUnit}>km/h</ThemedText>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {t('statementCircumstances.detailedDescription')}
            </ThemedText>
            
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { 
                  backgroundColor: inputBackgroundColor,
                  color: textColor,
                  borderColor
                }
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('statementCircumstances.descriptionPlaceholder') as string}
              placeholderTextColor="rgba(128, 128, 128, 0.8)"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            
            <ThemedText style={styles.characterCount}>
              {description.length}/1000
            </ThemedText>
          </View>
        </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.footer}>
          <ThemedButton
            title={t('common.continue')}
            onPress={handleContinue}
            variant="primary"
            style={styles.continueButton}
            disabled={!selectedCircumstance || !description.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
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
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  optionsGrid: {
    gap: 12,
  },
  optionCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  selectedCard: {
    borderWidth: 2,
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 16,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  conditionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
  },
  speedInput: {
    flex: 1,
    textAlign: 'center',
  },
  speedUnit: {
    fontSize: 16,
    fontWeight: '500',
  },
  textArea: {
    height: 120,
    paddingTop: 15,
  },
  characterCount: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'right',
    marginTop: 5,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
    backgroundColor: 'transparent',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
  },
});
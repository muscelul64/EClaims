import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { useCustomThemeColor, useThemeColor } from '@/hooks/use-theme-color';
import { useVehiclesStore } from '@/stores/use-vehicles-store';
import { useTranslation } from 'react-i18next';

export default function AddVehicleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const { vehicles, addVehicle, updateVehicle } = useVehiclesStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useCustomThemeColor({ light: '#e1e1e1', dark: '#333' });
  
  // Find existing vehicle if editing
  const existingVehicle = id ? vehicles.find(v => v.id === id) : null;
  const isEditing = !!existingVehicle;
  
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    licensePlate: '',
    color: '',
    fuelType: 'gasoline' as 'gasoline' | 'diesel' | 'electric' | 'hybrid',
    insuranceCompany: '',
    policyNumber: '',
  });

  useEffect(() => {
    if (existingVehicle) {
      setFormData({
        make: existingVehicle.make || '',
        model: existingVehicle.model || '',
        year: existingVehicle.year || new Date().getFullYear(),
        vin: existingVehicle.vin || '',
        licensePlate: existingVehicle.licensePlate || '',
        color: existingVehicle.color || '',
        fuelType: existingVehicle.fuelType || 'gasoline',
        insuranceCompany: existingVehicle.insuranceCompany || '',
        policyNumber: existingVehicle.policyNumber || '',
      });
    }
  }, [existingVehicle]);

  const handleSave = async () => {
    // Validate required fields
    if (!formData.make.trim() || !formData.model.trim() || !formData.licensePlate.trim()) {
      Alert.alert(
        t('common.error') || 'Error',
        t('common.fillAllFields') || 'Please fill all required fields',
        [{ text: t('common.ok') || 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing && existingVehicle) {
        await updateVehicle(existingVehicle.id, formData);
      } else {
        await addVehicle(formData);
      }
      router.back();
    } catch {
      Alert.alert(
        t('common.error') || 'Error',
        t('common.tryAgain') || 'Please try again',
        [{ text: t('common.ok') || 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fuelTypes = [
    { key: 'gasoline', label: t('vehicleForm.gasoline') || 'Gasoline' },
    { key: 'diesel', label: t('vehicleForm.diesel') || 'Diesel' },
    { key: 'electric', label: t('vehicleForm.electric') || 'Electric' },
    { key: 'hybrid', label: t('vehicleForm.hybrid') || 'Hybrid' },
  ];

  const showFuelTypePicker = () => {
    Alert.alert(
      t('vehicleFormScreen.modalHeader') || 'Select Fuel Type',
      '',
      [
        ...fuelTypes.map(type => ({
          text: type.label,
          onPress: () => updateFormData('fuelType', type.key)
        })),
        { text: t('common.cancel') as string, style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedButton
            title={t('common.cancel')}
            onPress={() => router.back()}
            variant="secondary"
            style={styles.headerButton}
          />
          <ThemedText style={styles.headerTitle}>
            {isEditing ? t('common.editVehicle') : t('vehicleFormScreen.header')}
          </ThemedText>
          <ThemedButton
            title={t('common.save')}
            onPress={handleSave}
            variant="primary"
            style={styles.headerButton}
            disabled={isLoading}
          />
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
        <View style={styles.form}>
          <ThemedText style={styles.sectionTitle}>{t('review.vehicle')}</ThemedText>
          
          {/* Make */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.make')} *</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
            <ThemedTextInput
                style={styles.inputText}
                value={formData.make}
                onChangeText={(text) => updateFormData('make', text)}
                placeholder={t('vehicleForm.makePlaceholder') || 'Enter make'}
                autoCapitalize="words"
              />
            </ThemedView>
          </View>

          {/* Model */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.model')} *</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
              <ThemedTextInput
                style={styles.inputText}
                value={formData.model}
                onChangeText={(text) => updateFormData('model', text)}
                placeholder={t('vehicleForm.modelPlaceholder') || 'Enter model'}
                autoCapitalize="words"
              />
            </ThemedView>
          </View>

          {/* License Plate */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.licensePlate')} *</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
              <ThemedTextInput
                style={styles.inputText}
                value={formData.licensePlate}
                onChangeText={(text) => updateFormData('licensePlate', text)}
                placeholder={t('vehicleForm.licensePlatePlaceholder') || ''}
                autoCapitalize="characters"
              />
            </ThemedView>
          </View>

          {/* Year */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.year')}</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
              <ThemedTextInput
                style={styles.inputText}
                value={formData.year.toString()}
                onChangeText={(text) => {
                  const year = parseInt(text || '0', 10);
                  if (!isNaN(year) && year >= 1900 && year <= new Date().getFullYear()) {
                    updateFormData('year', year);
                  }
                }}
                placeholder="Year"
                keyboardType="numeric"
                maxLength={4}
              />
            </ThemedView>
          </View>

          {/* VIN */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.vin')}</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
              <ThemedTextInput
                style={styles.inputText}
                value={formData.vin}
                onChangeText={(text) => updateFormData('vin', text)}
                placeholder={t('vehicleForm.vinPlaceholder') || 'VIN'}
                autoCapitalize="characters"
                maxLength={17}
              />
            </ThemedView>
          </View>

          {/* Color */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.color')}</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
              <ThemedTextInput
                style={styles.inputText}
                value={formData.color}
                onChangeText={(text) => updateFormData('color', text)}
                placeholder={t('vehicleForm.colorPlaceholder') || 'Color'}
                autoCapitalize="words"
              />
            </ThemedView>
          </View>

          {/* Fuel Type */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.fuelType')}</ThemedText>
            <TouchableOpacity onPress={showFuelTypePicker}>
              <ThemedView style={[styles.input, { borderColor }]}>
                <ThemedText style={styles.inputText}>
                  {fuelTypes.find(f => f.key === formData.fuelType)?.label || t('vehicleForm.gasoline') || 'Gasoline'}
                </ThemedText>
              </ThemedView>
            </TouchableOpacity>
          </View>

          {/* Insurance Company */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.insuranceCompany')}</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
              <ThemedTextInput
                style={styles.inputText}
                value={formData.insuranceCompany}
                onChangeText={(text) => updateFormData('insuranceCompany', text)}
                placeholder={t('vehicleForm.insuranceCompanyPlaceholder') || 'Insurance Company'}
                autoCapitalize="words"
              />
            </ThemedView>
          </View>

          {/* Policy Number */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.policyNumber')}</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
              <ThemedTextInput
                style={styles.inputText}
                value={formData.policyNumber}
                onChangeText={(text) => updateFormData('policyNumber', text)}
                placeholder={t('vehicleForm.policyNumberPlaceholder') || 'Policy Number'}
                autoCapitalize="characters"
              />
            </ThemedView>
          </View>
        </View>
      </ScrollView>      </KeyboardAvoidingView>    </SafeAreaView>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  form: {
    padding: 20,
    minHeight: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    opacity: 0.8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    minHeight: 50,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
    color: 'inherit',
  },
});
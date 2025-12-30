import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <ThemedText style={styles.sectionTitle}>{t('review.vehicle')}</ThemedText>
          
          {/* Make */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.make')} *</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
              <ThemedText 
                style={styles.inputText}
                onPress={() => {
                  Alert.prompt(
                    t('vehicleForm.make'),
                    '',
                    (text) => updateFormData('make', text || ''),
                    'plain-text',
                    formData.make
                  );
                }}
              >
                {formData.make || t('vehicleForm.makePlaceholder')}
              </ThemedText>
            </ThemedView>
          </View>

          {/* Model */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.model')} *</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
              <ThemedText 
                style={styles.inputText}
                onPress={() => {
                  Alert.prompt(
                    t('vehicleForm.model'),
                    '',
                    (text) => updateFormData('model', text || ''),
                    'plain-text',
                    formData.model
                  );
                }}
              >
                {formData.model || t('vehicleForm.modelPlaceholder')}
              </ThemedText>
            </ThemedView>
          </View>

          {/* License Plate */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.licensePlate')} *</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
              <ThemedText 
                style={styles.inputText}
                onPress={() => {
                  Alert.prompt(
                    t('vehicleForm.licensePlate'),
                    '',
                    (text) => updateFormData('licensePlate', text || ''),
                    'plain-text',
                    formData.licensePlate
                  );
                }}
              >
                {formData.licensePlate || t('vehicleForm.licensePlatePlaceholder')}
              </ThemedText>
            </ThemedView>
          </View>

          {/* Year */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.year')}</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
              <ThemedText 
                style={styles.inputText}
                onPress={() => {
                  Alert.prompt(
                    t('vehicleForm.year'),
                    '',
                    (text) => {
                      const year = parseInt(text || '0', 10);
                      if (year >= 1900 && year <= new Date().getFullYear()) {
                        updateFormData('year', year);
                      }
                    },
                    undefined, // no keyboardType for year
                    formData.year.toString()
                  );
                }}
              >
                {formData.year.toString()}
              </ThemedText>
            </ThemedView>
          </View>

          {/* VIN */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.vin')}</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
              <ThemedText 
                style={styles.inputText}
                onPress={() => {
                  Alert.prompt(
                    t('vehicleForm.vin'),
                    '',
                    (text) => updateFormData('vin', text || ''),
                    'plain-text',
                    formData.vin
                  );
                }}
              >
                {formData.vin || t('vehicleForm.vinPlaceholder')}
              </ThemedText>
            </ThemedView>
          </View>

          {/* Color */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.color')}</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
              <ThemedText 
                style={styles.inputText}
                onPress={() => {
                  Alert.prompt(
                    t('vehicleForm.color'),
                    '',
                    (text) => updateFormData('color', text || ''),
                    'plain-text',
                    formData.color
                  );
                }}
              >
                {formData.color || t('vehicleForm.colorPlaceholder')}
              </ThemedText>
            </ThemedView>
          </View>

          {/* Fuel Type */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.fuelType')}</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
              <ThemedText 
                style={styles.inputText}
                onPress={showFuelTypePicker}
              >
                {fuelTypes.find(f => f.key === formData.fuelType)?.label || t('vehicleForm.gasoline')}
              </ThemedText>
            </ThemedView>
          </View>

          {/* Insurance Company */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.insuranceCompany')}</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
              <ThemedText 
                style={styles.inputText}
                onPress={() => {
                  Alert.prompt(
                    t('vehicleForm.insuranceCompany'),
                    '',
                    (text) => updateFormData('insuranceCompany', text || ''),
                    'plain-text',
                    formData.insuranceCompany
                  );
                }}
              >
                {formData.insuranceCompany || t('vehicleForm.insuranceCompanyPlaceholder')}
              </ThemedText>
            </ThemedView>
          </View>

          {/* Policy Number */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('vehicleForm.policyNumber')}</ThemedText>
            <ThemedView style={[styles.input, { borderColor }]}>
              <ThemedText 
                style={styles.inputText}
                onPress={() => {
                  Alert.prompt(
                    t('vehicleForm.policyNumber'),
                    '',
                    (text) => updateFormData('policyNumber', text || ''),
                    'plain-text',
                    formData.policyNumber
                  );
                }}
              >
                {formData.policyNumber || t('vehicleForm.policyNumberPlaceholder')}
              </ThemedText>
            </ThemedView>
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
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
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
  },
});
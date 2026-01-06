import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput } from 'react-native';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Vehicle, useVehiclesStore } from '@/stores/use-vehicles-store';

interface VehicleFormProps {
  vehicle?: Vehicle;
  onSuccess: () => void;
  onCancel: () => void;
}

const FUEL_TYPES = [
  { label: 'Gasoline', value: 'gasoline' },
  { label: 'Diesel', value: 'diesel' },
  { label: 'Electric', value: 'electric' },
  { label: 'Hybrid', value: 'hybrid' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => CURRENT_YEAR - i);

export function VehicleForm({ vehicle, onSuccess, onCancel }: VehicleFormProps) {
  const { addVehicle, updateVehicle } = useVehiclesStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Theme colors for picker
  const pickerBg = useThemeColor({ light: '#fff', dark: '#2c2c2c' }, 'background');
  const pickerBorder = useThemeColor({ light: '#ddd', dark: '#555' }, 'icon');
  
  const [formData, setFormData] = useState({
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year || CURRENT_YEAR,
    vin: vehicle?.vin || '',
    licensePlate: vehicle?.licensePlate || '',
    color: vehicle?.color || '',
    fuelType: vehicle?.fuelType || 'gasoline',
    insuranceCompany: vehicle?.insuranceCompany || '',
    policyNumber: vehicle?.policyNumber || '',
  });

  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const requiredFields = ['make', 'model', 'vin', 'licensePlate', 'color'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      Alert.alert('Validation Error', `Please fill in: ${missingFields.join(', ')}`);
      return false;
    }
    
    if (formData.vin.length < 17) {
      Alert.alert('Validation Error', 'VIN must be at least 17 characters');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      if (vehicle) {
        await updateVehicle(vehicle.id, formData);
      } else {
        await addVehicle(formData as any);
      }
      
      Alert.alert(
        'Success',
        `Vehicle ${vehicle ? 'updated' : 'added'} successfully!`,
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error) {
      console.error('Failed to save vehicle:', error);
      Alert.alert('Error', 'Failed to save vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.form}>
        <ThemedText type="title" style={styles.title}>
          {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        </ThemedText>
        
        <ThemedView style={styles.fieldGroup}>
          <ThemedText style={styles.label}>Make *</ThemedText>
          <ThemedTextInput
            style={styles.input}
            value={formData.make}
            onChangeText={(text: string) => updateField('make', text)}
            placeholder="e.g., Porsche, BMW, Mercedes"
            autoCapitalize="words"
          />
        </ThemedView>
        
        <ThemedView style={styles.fieldGroup}>
          <ThemedText style={styles.label}>Model *</ThemedText>
          <ThemedTextInput
            style={styles.input}
            value={formData.model}
            onChangeText={(text: string) => updateField('model', text)}
            placeholder="e.g., 911, Cayenne, Macan"
            autoCapitalize="words"
          />
        </ThemedView>
        
        <ThemedView style={styles.fieldGroup}>
          <ThemedText style={styles.label}>Year</ThemedText>
          <Picker
            selectedValue={formData.year}
            onValueChange={(value) => updateField('year', value)}
            style={styles.picker}
          >
            {YEARS.map(year => (
              <Picker.Item key={year} label={year.toString()} value={year} />
            ))}
          </Picker>
        </ThemedView>
        
        <ThemedView style={styles.fieldGroup}>
          <ThemedText style={styles.label}>VIN *</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.vin}
            onChangeText={(text) => updateField('vin', text.toUpperCase())}
            placeholder="Vehicle Identification Number"
            maxLength={17}
            autoCapitalize="characters"
          />
        </ThemedView>
        
        <ThemedView style={styles.fieldGroup}>
          <ThemedText style={styles.label}>License Plate *</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.licensePlate}
            onChangeText={(text) => updateField('licensePlate', text.toUpperCase())}
            placeholder="License plate number"
            autoCapitalize="characters"
          />
        </ThemedView>
        
        <ThemedView style={styles.fieldGroup}>
          <ThemedText style={styles.label}>Color *</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.color}
            onChangeText={(text) => updateField('color', text)}
            placeholder="Vehicle color"
            autoCapitalize="words"
          />
        </ThemedView>
        
        <ThemedView style={styles.fieldGroup}>
          <ThemedText style={styles.label}>Fuel Type</ThemedText>
          <Picker
            selectedValue={formData.fuelType}
            onValueChange={(value) => updateField('fuelType', value)}
            style={styles.picker}
          >
            {FUEL_TYPES.map(type => (
              <Picker.Item key={type.value} label={type.label} value={type.value} />
            ))}
          </Picker>
        </ThemedView>
        
        <ThemedView style={styles.fieldGroup}>
          <ThemedText style={styles.label}>Insurance Company</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.insuranceCompany}
            onChangeText={(text) => updateField('insuranceCompany', text)}
            placeholder="Insurance provider"
            autoCapitalize="words"
          />
        </ThemedView>
        
        <ThemedView style={styles.fieldGroup}>
          <ThemedText style={styles.label}>Policy Number</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.policyNumber}
            onChangeText={(text) => updateField('policyNumber', text)}
            placeholder="Insurance policy number"
          />
        </ThemedView>
        
        <ThemedView style={styles.buttonContainer}>
          <ThemedButton
            title="Cancel"
            variant="outline"
            onPress={onCancel}
            style={styles.button}
          />
          <ThemedButton
            title={isLoading ? 'Saving...' : 'Save Vehicle'}
            onPress={handleSubmit}
            disabled={isLoading}
            style={styles.button}
          />
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  picker: {
    borderWidth: 1,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 30,
  },
  button: {
    flex: 1,
  },
});

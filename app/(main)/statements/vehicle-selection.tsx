import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useCustomThemeColor, useThemeColor } from '@/hooks/use-theme-color';
import type { Vehicle } from '@/stores/use-vehicles-store';
import { useVehiclesStore } from '@/stores/use-vehicles-store';
import { useTranslation } from 'react-i18next';

export default function VehicleSelectionScreen() {
  const router = useRouter();
  const { time, location } = useLocalSearchParams();
  const { t } = useTranslation();
  
  const { vehicles, loadVehicles } = useVehiclesStore();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1c' }, 'background');
  const borderColor = useThemeColor({ light: '#e1e1e1', dark: '#333' }, 'icon');
  const selectedBorderColor = useThemeColor({}, 'tint');
  
  // Additional theme-aware colors
  const primaryButtonColor = useCustomThemeColor({ light: '#4CAF50', dark: '#66BB6A' });
  const linkColor = useCustomThemeColor({ light: '#2196F3', dark: '#64B5F6' });
  const licensePlateBackgroundColor = useCustomThemeColor({ 
    light: 'rgba(33, 150, 243, 0.1)', 
    dark: 'rgba(100, 181, 246, 0.1)' 
  });

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleContinue = () => {
    if (!selectedVehicle) {
      Alert.alert(
        t('statementVehicle.noVehicleSelected') || 'No Vehicle Selected',
        t('statementVehicle.selectVehicleRequired') || 'Please select a vehicle to continue',
        [{ text: t('common.ok') || 'OK' }]
      );
      return;
    }

    // Navigate to parties selection/details
    router.push({
      pathname: '/statements/parties',
      params: {
        time: time as string,
        location: location as string,
        vehicle: JSON.stringify(selectedVehicle)
      }
    });
  };

  const handleAddVehicle = () => {
    // Navigate to add vehicle screen
    router.push('/vehicles/add');
  };

  const renderVehicleCard = ({ item: vehicle }: { item: Vehicle }) => {
    const isSelected = selectedVehicle?.id === vehicle.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.vehicleCard,
          { 
            backgroundColor: cardBackgroundColor,
            borderColor: isSelected ? selectedBorderColor : borderColor
          },
          isSelected && styles.selectedCard
        ]}
        onPress={() => handleVehicleSelect(vehicle)}
        activeOpacity={0.7}
      >
        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleMainInfo}>
            <ThemedText style={styles.vehicleTitle}>
              {vehicle.make} {vehicle.model}
            </ThemedText>
            {vehicle.year && (
              <ThemedText style={styles.vehicleYear}>
                {vehicle.year}
              </ThemedText>
            )}
          </View>
          
          {vehicle.licensePlate && (
            <View style={[styles.licensePlateContainer, { 
              backgroundColor: licensePlateBackgroundColor, 
              borderColor: linkColor 
            }]}>
              <ThemedText style={[styles.licensePlateText, { color: linkColor }]}>
                {vehicle.licensePlate}
              </ThemedText>
            </View>
          )}
        </View>
        
        <View style={styles.vehicleDetails}>
          {vehicle.color && (
            <ThemedText style={styles.vehicleDetail}>
              {t('vehicles.color')}: {vehicle.color}
            </ThemedText>
          )}
        </View>

        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: primaryButtonColor }]}>
            <ThemedText style={styles.selectedIcon}>✓</ThemedText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <ThemedText style={styles.emptyIcon}>🚗</ThemedText>
      <ThemedText style={styles.emptyTitle}>
        {t('statementVehicle.noVehicles')}
      </ThemedText>
      <ThemedText style={styles.emptyDescription}>
        {t('statementVehicle.addVehicleFirst')}
      </ThemedText>
      <ThemedButton
        title={t('vehicles.addVehicle')}
        onPress={handleAddVehicle}
        variant="primary"
        style={[styles.addFirstVehicleButton, { backgroundColor: primaryButtonColor }]}
      />
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
          {t('statementVehicle.selectVehicle')}
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ThemedText style={styles.sectionTitle}>
          {t('statementVehicle.whichVehicle')}
        </ThemedText>
        
        <ThemedText style={styles.description}>
          {t('statementVehicle.selectVehicleDescription')}
        </ThemedText>

        {vehicles.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <FlatList
              data={vehicles}
              renderItem={renderVehicleCard}
              keyExtractor={(item) => item.id}
              style={styles.vehiclesList}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />

            {/* Add Vehicle Button */}
            <View style={styles.addVehicleContainer}>
              <ThemedButton
                title={t('statementVehicle.addAnotherVehicle')}
                onPress={handleAddVehicle}
                variant="outline"
                style={[styles.addVehicleButton, { borderColor: linkColor }]}
              />
            </View>
          </>
        )}
      </View>

      {/* Continue Button */}
      {vehicles.length > 0 && (
        <View style={styles.footer}>
          <ThemedButton
            title={t('common.continue')}
            onPress={handleContinue}
            variant="primary"
            style={[styles.continueButton, { backgroundColor: primaryButtonColor }]}
            disabled={!selectedVehicle}
          />
        </View>
      )}
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
    marginBottom: 20,
  },
  vehiclesList: {
    flex: 1,
  },
  vehicleCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  selectedCard: {
    borderWidth: 2,
  },
  vehicleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleMainInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehicleYear: {
    fontSize: 14,
    opacity: 0.6,
  },
  licensePlateContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  licensePlateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  vehicleDetails: {
    gap: 4,
  },
  vehicleDetail: {
    fontSize: 14,
    opacity: 0.7,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIcon: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  separator: {
    height: 15,
  },
  addVehicleContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  addVehicleButton: {
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  addFirstVehicleButton: {
    minWidth: 200,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  continueButton: {
  },
});
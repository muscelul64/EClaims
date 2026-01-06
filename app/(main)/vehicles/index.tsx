import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UniversalLinkRestrictionBanner } from '@/components/deeplink-restriction-banner';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useUniversalLinkVehicleAutoSelection } from '@/hooks/use-deeplink-vehicle-auto-selection';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useUserStore } from '@/stores/use-user-store';
import { useVehiclesStore, Vehicle } from '@/stores/use-vehicles-store';
import { useTranslation } from 'react-i18next';

const VehicleCard = ({ vehicle, onPress, onDelete, isSelectionMode, isDeleteDisabled }: {
  vehicle: Vehicle;
  onPress: () => void;
  onDelete: () => void;
  isSelectionMode?: boolean;
  isDeleteDisabled?: boolean;
}) => {
  const cardColor = useThemeColor({}, 'tint');
  const { t } = useTranslation();
  
  return (
    <TouchableOpacity onPress={onPress} style={[styles.vehicleCard, { backgroundColor: cardColor }]}>
      <View style={styles.vehicleCardContent}>
        <View style={styles.vehicleInfo}>
          <ThemedText style={[styles.vehicleTitle, { color: '#FFF' }]}>
            {vehicle.make ? `${vehicle.make} ${vehicle.model}` : t('_.incomplete')}
          </ThemedText>
          {vehicle.make && vehicle.licensePlate && (
            <>
              <ThemedText style={[styles.vehicleDetail, { color: '#FFF', opacity: 0.9 }]}>• {vehicle.make}</ThemedText>
              <ThemedText style={[styles.vehicleDetail, { color: '#FFF', opacity: 0.9 }]}>• {vehicle.licensePlate}</ThemedText>
              {vehicle.year && (
                <ThemedText style={[styles.vehicleDetail, { color: '#FFF', opacity: 0.9 }]}>• {vehicle.year}</ThemedText>
              )}
            </>
          )}
        </View>
        <View style={styles.vehicleActions}>
          {!isSelectionMode && (
            <TouchableOpacity 
              onPress={onDelete} 
              style={[styles.deleteButton, isDeleteDisabled && styles.deleteButtonDisabled]}
              disabled={isDeleteDisabled}
            >
              <ThemedText style={[styles.deleteText, isDeleteDisabled && styles.deleteTextDisabled]}>🗑️</ThemedText>
            </TouchableOpacity>
          )}
          {isSelectionMode && (
            <ThemedText style={[styles.selectText, { color: '#FFF' }]}>
              {t('common.select')}
            </ThemedText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function MyVehiclesScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams();
  const { t } = useTranslation();
  const { vehicles: allVehicles, getFilteredVehicles, removeVehicle, loadVehicles, selectVehicle } = useVehiclesStore();
  const { user } = useUserStore();
  const backgroundColor = useThemeColor({}, 'background');
  
  // Check if we're in a restricted Universal Link context
  const hasVehicleRestriction = user.universalLinkContext?.hasVehicleRestriction || false;
  
  // Hide Add/Remove vehicle buttons when accessed via Universal Link on both platforms
  const shouldHideVehicleActions = user.universalLinkContext?.hasVehicleRestriction || false;
  
  // Use filtered vehicles based on Universal Link context
  const vehicles = getFilteredVehicles();
  const isSelectionMode = mode === 'select';
  
  // Auto-select vehicle from Universal Link if available (useful for selection mode)
  useUniversalLinkVehicleAutoSelection({
    enableDebugLogs: true,
    screenName: 'My Vehicles'
  });

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const handleAddVehicle = () => {
    if (allVehicles.length >= 10) {
      Alert.alert(
        t('vehiclesScreen.vehiclesLimit'),
        '',
        [{ text: String(t('common.ok')) }]
      );
      return;
    }
    router.push('/vehicles/add');
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    if (isSelectionMode) {
      // Select the vehicle and navigate back
      selectVehicle(vehicle);
      router.back();
    } else {
      // Edit the vehicle
      router.push({
        pathname: '/vehicles/edit/[id]',
        params: { id: vehicle.id }
      });
    }
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    Alert.alert(
      String(t('vehiclesScreen.removeVehicleAlert')),
      '',
      [
        { text: String(t('common.cancel')), style: 'cancel' },
        {
          text: String(t('common.delete')),
          style: 'destructive',
          onPress: () => removeVehicle(vehicle.id)
        }
      ]
    );
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <VehicleCard
      vehicle={item}
      onPress={() => handleEditVehicle(item)}
      onDelete={() => handleDeleteVehicle(item)}
      isSelectionMode={isSelectionMode}
      isDeleteDisabled={hasVehicleRestriction || shouldHideVehicleActions}
    />
  );

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <ThemedText style={styles.vehicleCount}>
        {vehicles.length}/10 {t('profile.vehicles')}
      </ThemedText>
      {!isSelectionMode && !hasVehicleRestriction && !shouldHideVehicleActions && (
        <ThemedButton
          title={t('vehiclesScreen.addVehicle')}
          onPress={handleAddVehicle}
          variant="primary"
          style={styles.addButton}
        />
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyText}>
        {isSelectionMode ? t('vehicles.noVehiclesForSelection') : t('vehiclesScreen.noVehicle')}
      </ThemedText>
      {!isSelectionMode && !hasVehicleRestriction && (
        <ThemedButton
          title={t('vehiclesScreen.addVehicle')}
          onPress={handleAddVehicle}
          variant="primary"
          style={styles.addButton}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText>← {t('common.back')}</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          {isSelectionMode ? t('vehicles.selectVehicle') : t('profile.myVehicles')}
        </ThemedText>
      </View>

      {/* Universal Link Restriction Banner */}
      <UniversalLinkRestrictionBanner />

      {vehicles.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderVehicleItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
        />
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
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  headerContent: {
    padding: 20,
    paddingBottom: 0,
  },
  vehicleCount: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'right',
    marginBottom: 15,
  },
  addButton: {
    marginTop: 10,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  vehicleCard: {
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  vehicleCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehicleDetail: {
    fontSize: 12,
    marginBottom: 2,
  },
  vehicleActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.3,
  },
  deleteText: {
    fontSize: 18,
  },
  deleteTextDisabled: {
    opacity: 0.5,
  },
  selectText: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.7,
  },
});
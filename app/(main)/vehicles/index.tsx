import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useVehiclesStore, Vehicle } from '@/stores/use-vehicles-store';
import { useTranslation } from 'react-i18next';

const VehicleCard = ({ vehicle, onPress, onDelete }: {
  vehicle: Vehicle;
  onPress: () => void;
  onDelete: () => void;
}) => {
  const cardColor = useThemeColor({}, 'tint');
  const { t } = useTranslation();
  
  return (
    <TouchableOpacity onPress={onPress} style={[styles.vehicleCard, { backgroundColor: cardColor }]}>
      <View style={styles.vehicleCardContent}>
        <View style={styles.vehicleInfo}>
          <ThemedText style={styles.vehicleTitle}>
            {vehicle.make ? `${vehicle.make} ${vehicle.model}` : t('_.incomplete')}
          </ThemedText>
          {vehicle.make && vehicle.licensePlate && (
            <>
              <ThemedText style={styles.vehicleDetail}>• {vehicle.make}</ThemedText>
              <ThemedText style={styles.vehicleDetail}>• {vehicle.licensePlate}</ThemedText>
              {vehicle.year && (
                <ThemedText style={styles.vehicleDetail}>• {vehicle.year}</ThemedText>
              )}
            </>
          )}
        </View>
        <View style={styles.vehicleActions}>
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <ThemedText style={styles.deleteText}>🗑️</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function MyVehiclesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { vehicles, isLoading, removeVehicle, loadVehicles } = useVehiclesStore();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const handleAddVehicle = () => {
    if (vehicles.length >= 10) {
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
    router.push({
      pathname: '/vehicles/edit/[id]',
      params: { id: vehicle.id }
    });
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
    />
  );

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <ThemedText style={styles.vehicleCount}>
        {vehicles.length}/10 {t('profile.vehicles')}
      </ThemedText>
      <ThemedButton
        title={t('vehiclesScreen.addVehicle')}
        onPress={handleAddVehicle}
        variant="primary"
        style={styles.addButton}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyText}>
        {t('vehiclesScreen.noVehicle')}
      </ThemedText>
      <ThemedButton
        title={t('vehiclesScreen.addVehicle')}
        onPress={handleAddVehicle}
        variant="primary"
        style={styles.addButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText>← {t('common.back')}</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{t('profile.myVehicles')}</ThemedText>
      </View>

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
    color: '#FFF',
    marginBottom: 4,
  },
  vehicleDetail: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 2,
  },
  vehicleActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 18,
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
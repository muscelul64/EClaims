import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCameraStore } from '@/stores/use-camera-store';
//import { useUserStore } from '@/stores/use-user-store';
import { useVehiclesStore } from '@/stores/use-vehicles-store';
import { useTranslation } from 'react-i18next';
import { useDeeplinkVehicleAutoSelection } from '@/hooks/use-deeplink-vehicle-auto-selection';

const DamageTypeCard = ({ 
  title, 
  description, 
  icon, 
  onPress,
  disabled = false
}: {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
}) => {
  const cardColor = useThemeColor({}, 'tint');
  
  return (
    <TouchableOpacity 
      onPress={disabled ? undefined : onPress} 
      style={[
        styles.damageCard, 
        { backgroundColor: disabled ? '#999' : cardColor },
        disabled && styles.disabledCard
      ]}
      disabled={disabled}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <ThemedText style={[styles.cardIcon, disabled && styles.disabledText]}>{icon}</ThemedText>
        </View>
        <View style={styles.cardText}>
          <ThemedText style={[styles.cardTitle, disabled && styles.disabledText]}>{title}</ThemedText>
          <ThemedText style={[styles.cardDescription, disabled && styles.disabledText]}>{description}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function DamageAssessmentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { photos, getPhotosByType } = useCameraStore();
  const { selectedVehicle} = useVehiclesStore();
  //const { user } = useUserStore();
  const backgroundColor = useThemeColor({}, 'background');
  
  // Use the reusable deeplink vehicle auto-selection hook
  useDeeplinkVehicleAutoSelection({
    enableDebugLogs: true,
    screenName: 'Damage Assessment'
  });

  const damageTypes = [
    {
      id: 'general',
      title: t('damage.generalPhotos'),
      description: t('damage.generalDescription'),
      icon: '📸',
      route: '/damage/camera/general'
    },
    {
      id: 'specific',
      title: t('damage.specificDamage'),
      description: t('damage.specificDescription'),
      icon: '🎯',
      route: '/damage/select-areas'
    },
    {
      id: 'documents',
      title: t('damage.documents'),
      description: t('damage.documentsDescription'),
      icon: '📄',
      route: '/damage/documents'
    }
  ];

  const handleDamageTypePress = (damageType: any) => {
    if (!selectedVehicle) {
      Alert.alert(
        t('common.error'),
        String(t('damage.selectVehicleFirst')),
        [
          { text: String(t('common.cancel')), style: 'cancel' },
          {
            text: String(t('vehicles.selectVehicle')),
            onPress: () => router.push('/vehicles?mode=select')
          }
        ]
      );
      return;
    }
    router.push(damageType.route);
  };

  const getPhotoCount = (type: string) => {
    return getPhotosByType(type as any).length;
  };

  const renderProgressSummary = () => (
    <View style={styles.progressSection}>
      <ThemedText style={styles.progressTitle}>{t('damage.progress')}</ThemedText>
      
      <View style={styles.progressItem}>
        <ThemedText style={styles.progressLabel}>{t('damage.generalPhotos')}</ThemedText>
        <ThemedText style={styles.progressCount}>
          {getPhotoCount('general')}/{t('damage.recommended6')}
        </ThemedText>
      </View>
      
      <View style={styles.progressItem}>
        <ThemedText style={styles.progressLabel}>{t('damage.damagePhotos')}</ThemedText>
        <ThemedText style={styles.progressCount}>
          {getPhotoCount('damage')} {t('damage.photos')}
        </ThemedText>
      </View>
      
      <View style={styles.progressItem}>
        <ThemedText style={styles.progressLabel}>{t('damage.documents')}</ThemedText>
        <ThemedText style={styles.progressCount}>
          {getPhotoCount('registration') + getPhotosByType('id').length + getPhotosByType('license').length}
        </ThemedText>
      </View>
    </View>
  );

  const handleFinishAssessment = () => {
    const totalPhotos = photos.length;
    
    if (totalPhotos < 3) {
      Alert.alert(
        String(t('damage.insufficientPhotos')),
        String(t('damage.needMorePhotos')),
        [{ text: String(t('common.ok')) }]
      );
      return;
    }

    Alert.alert(
      String(t('damage.completeAssessment')),
      String(t('damage.assessmentCompleteMsg')),
      [
        { text: String(t('common.cancel')), style: 'cancel' },
        {
          text: String(t('common.finish')),
          onPress: () => {
            // Save assessment and navigate back
            router.back();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText>← {t('common.back')}</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{t('damage.title')}</ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Selection/Info */}
        {selectedVehicle ? (
          <View style={styles.vehicleInfo}>
            <ThemedText style={styles.vehicleTitle}>
              {selectedVehicle.make} {selectedVehicle.model}
            </ThemedText>
            <ThemedText style={styles.vehiclePlate}>
              {selectedVehicle.licensePlate}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.vehicleSelection}>
            <ThemedText style={styles.vehicleSelectionTitle}>
              {t('damage.selectVehicleFirst')}
            </ThemedText>
            <ThemedButton
              title={t('vehicles.selectVehicle')}
              onPress={() => router.push('/vehicles?mode=select')}
              variant="primary"
              style={styles.selectVehicleButton}
            />
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructions}>
          <ThemedText style={styles.instructionsTitle}>
            {t('damage.instructions')}
          </ThemedText>
          <ThemedText style={styles.instructionsText}>
            {t('damage.instructionsText')}
          </ThemedText>
        </View>

        {/* Progress Summary */}
        {photos.length > 0 && renderProgressSummary()}

        {/* Damage Type Cards */}
        <View style={styles.damageTypes}>
          {damageTypes.map((type) => (
            <DamageTypeCard
              key={type.id}
              title={type.title}
              description={type.description}
              icon={type.icon}
              onPress={() => handleDamageTypePress(type)}
              disabled={!selectedVehicle}
            />
          ))}
        </View>

        {/* Complete Assessment Button */}
        {photos.length >= 3 && (
          <View style={styles.finishSection}>
            <ThemedButton
              title={t('damage.completeAssessment')}
              onPress={handleFinishAssessment}
              variant="primary"
              style={styles.finishButton}
            />
          </View>
        )}
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
  content: {
    flex: 1,
    padding: 20,
  },
  vehicleInfo: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  vehicleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 14,
    opacity: 0.7,
  },
  vehicleSelection: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  vehicleSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#FF9800',
  },
  selectVehicleButton: {
    backgroundColor: '#FF9800',
    minWidth: 200,
  },
  instructions: {
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  progressSection: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  damageTypes: {
    marginBottom: 20,
  },
  damageCard: {
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 15,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#FFF',
    opacity: 0.9,
  },
  disabledCard: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.6,
  },
  finishSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  finishButton: {
    backgroundColor: '#4CAF50',
  },
});
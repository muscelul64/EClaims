import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useVehiclesStore } from '@/stores/use-vehicles-store';
import { useTranslation } from 'react-i18next';

interface DamageArea {
  id: string;
  name: string;
  position: { x: number; y: number };
  selected: boolean;
}

const VehicleDiagram = ({ 
  onAreaPress, 
  selectedAreas 
}: {
  onAreaPress: (areaId: string) => void;
  selectedAreas: string[];
}) => {
  const tintColor = useThemeColor({}, 'tint');
  
  // Simplified vehicle outline (top view)
  const vehicleOutline = "M80 50 L320 50 L350 80 L350 320 L320 350 L80 350 L50 320 L50 80 Z";
  
  const damageAreas: DamageArea[] = [
    { id: 'front', name: 'Front', position: { x: 200, y: 30 }, selected: false },
    { id: 'rear', name: 'Rear', position: { x: 200, y: 370 }, selected: false },
    { id: 'leftSide', name: 'Left Side', position: { x: 30, y: 200 }, selected: false },
    { id: 'rightSide', name: 'Right Side', position: { x: 370, y: 200 }, selected: false },
    { id: 'roof', name: 'Roof', position: { x: 200, y: 200 }, selected: false },
    { id: 'frontLeft', name: 'Front Left', position: { x: 120, y: 120 }, selected: false },
    { id: 'frontRight', name: 'Front Right', position: { x: 280, y: 120 }, selected: false },
    { id: 'rearLeft', name: 'Rear Left', position: { x: 120, y: 280 }, selected: false },
    { id: 'rearRight', name: 'Rear Right', position: { x: 280, y: 280 }, selected: false },
  ];

  return (
    <View style={styles.diagramContainer}>
      <View style={styles.svgWrapper}>
        <Svg width="400" height="400" viewBox="0 0 400 400" style={styles.svgDiagram}>
          {/* Vehicle outline */}
          <Path
            d={vehicleOutline}
            fill="rgba(200, 200, 200, 0.3)"
            stroke="#666"
            strokeWidth="2"
          />
          
          {/* Damage area markers - visual only */}
          {damageAreas.map((area) => {
            const isSelected = selectedAreas.includes(area.id);
            return (
              <Circle
                key={area.id}
                cx={area.position.x}
                cy={area.position.y}
                r="20"
                fill={isSelected ? tintColor : 'rgba(255, 0, 0, 0.6)'}
                stroke="#FFF"
                strokeWidth="2"
              />
            );
          })}
        </Svg>
        
        {/* Touchable overlays for each damage area */}
        {damageAreas.map((area) => (
          <TouchableOpacity
            key={`touch-${area.id}`}
            style={[
              styles.damageAreaTouch,
              {
                left: area.position.x - 25,
                top: area.position.y - 25,
              }
            ]}
            onPress={() => onAreaPress(area.id)}
            activeOpacity={0.7}
          />
        ))}
      </View>
    </View>
  );
};

export default function SelectDamageAreasScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { selectedVehicle } = useVehiclesStore();
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const backgroundColor = useThemeColor({}, 'background');

  const damageAreaNames: { [key: string]: string } = {
    front: t('damage.front'),
    rear: t('damage.rear'),
    leftSide: t('damage.leftSide'),
    rightSide: t('damage.rightSide'),
    roof: t('damage.roof'),
    frontLeft: t('damage.frontLeft'),
    frontRight: t('damage.frontRight'),
    rearLeft: t('damage.rearLeft'),
    rearRight: t('damage.rearRight'),
  };

  const handleAreaPress = (areaId: string) => {
    setSelectedAreas(prev => {
      if (prev.includes(areaId)) {
        return prev.filter(id => id !== areaId);
      } else {
        return [...prev, areaId];
      }
    });
  };

  const handleContinue = () => {
    if (selectedAreas.length === 0) {
      Alert.alert(
        t('damage.selectAreas') || 'Select Areas',
        t('damage.selectAreasDescription') || 'Please select damaged areas',
        [{ text: t('common.ok') || 'OK' }]
      );
      return;
    }

    // Navigate to camera for each selected area
    Alert.alert(
      t('damage.photosRequired') || 'Photos Required',
      t('damage.photosRequiredDescription', { count: selectedAreas.length }) || `${selectedAreas.length} photo(s) required`,
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.continue') || 'Continue',
          onPress: () => {
            // For now, just go to damage camera
            router.push('/damage/camera/damage');
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
        <ThemedText style={styles.headerTitle}>{t('damage.selectDamageAreas')}</ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Info */}
        {selectedVehicle && (
          <View style={styles.vehicleInfo}>
            <ThemedText style={styles.vehicleTitle}>
              {selectedVehicle.make} {selectedVehicle.model}
            </ThemedText>
            <ThemedText style={styles.vehiclePlate}>
              {selectedVehicle.licensePlate}
            </ThemedText>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructions}>
          <ThemedText style={styles.instructionsTitle}>
            {t('damage.selectAreasInstructions')}
          </ThemedText>
          <ThemedText style={styles.instructionsText}>
            {t('damage.tapAreasToSelect')}
          </ThemedText>
        </View>

        {/* Vehicle Diagram */}
        <VehicleDiagram
          onAreaPress={handleAreaPress}
          selectedAreas={selectedAreas}
        />

        {/* Selected Areas List */}
        {selectedAreas.length > 0 && (
          <View style={styles.selectedAreas}>
            <ThemedText style={styles.selectedTitle}>
              {t('damage.selectedAreas')} ({selectedAreas.length})
            </ThemedText>
            {selectedAreas.map((areaId) => (
              <View key={areaId} style={styles.selectedItem}>
                <ThemedText style={styles.selectedItemText}>
                  • {damageAreaNames[areaId] || areaId}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => handleAreaPress(areaId)}
                  style={styles.removeButton}
                >
                  <ThemedText style={styles.removeButtonText}>✕</ThemedText>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <ThemedButton
            title={t('damage.continueToPhotos')}
            onPress={handleContinue}
            variant="primary"
            style={styles.continueButton}
            disabled={selectedAreas.length === 0}
          />
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
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
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
  diagramContainer: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    padding: 20,
  },
  svgWrapper: {
    position: 'relative',
    width: 400,
    height: 400,
  },
  svgDiagram: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  damageAreaTouch: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'transparent',
  },
  selectedAreas: {
    marginVertical: 20,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    marginBottom: 6,
  },
  selectedItemText: {
    fontSize: 14,
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  continueButton: {
    backgroundColor: '#2196F3',
  },
});
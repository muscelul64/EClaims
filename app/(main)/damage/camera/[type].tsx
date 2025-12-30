import { CameraType, CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CapturePhoto, useCameraStore } from '@/stores/use-camera-store';
import { useVehiclesStore } from '@/stores/use-vehicles-store';
import { useTranslation } from 'react-i18next';

export default function DamageCameraScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const { t } = useTranslation();
  
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('auto');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const { addPhoto, setCurrentPhotoType } = useCameraStore();
  const { selectedVehicle } = useVehiclesStore();
  const backgroundColor = useThemeColor({}, 'background');
  
  // Set photo type based on route parameter
  React.useEffect(() => {
    if (type && typeof type === 'string') {
      setCurrentPhotoType(type as CapturePhoto['type']);
    }
  }, [type, setCurrentPhotoType]);

  const photoTypeConfig = {
    general: {
      title: t('damage.generalPhotos'),
      instructions: t('damage.generalInstructions'),
    },
    damage: {
      title: t('damage.damagePhotos'),
      instructions: t('damage.damageInstructions'),
    },
    registration: {
      title: t('camera.registration'),
      instructions: t('camera.registrationMessage'),
    },
    id: {
      title: t('camera.id'),
      instructions: t('camera.idMessage'),
    },
    license: {
      title: t('camera.drivingLicense'),
      instructions: t('camera.licenseMessage'),
    }
  };

  const currentConfig = photoTypeConfig[type as keyof typeof photoTypeConfig] || photoTypeConfig.general;

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.permissionContainer}>
          <ThemedText style={styles.permissionText}>
            {t('camera.permissionDescription')}
          </ThemedText>
          <ThemedButton
            title={t('common.grant')}
            onPress={requestPermission}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (photo) {
        const capturedPhoto: CapturePhoto = {
          ...photo,
          id: `photo_${Date.now()}`,
          type: (type as CapturePhoto['type']) || 'general',
          metadata: {
            timestamp: Date.now(),
            vehicleId: selectedVehicle?.id,
            location: undefined, // TODO: Add location if needed
          }
        };

        addPhoto(capturedPhoto);
        
        Alert.alert(
          t('camera.photoSaved') || 'Photo Saved',
          t('camera.photoSavedDescription') || 'Your photo has been saved successfully.',
          [
            {
              text: t('camera.takeAnother') || 'Take Another',
              onPress: () => {}, // Stay on camera
            },
            {
              text: t('common.done') || 'Done',
              onPress: () => router.back(),
            }
          ]
        );
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(
        t('camera.error') || 'Camera Error',
        t('camera.errorDescription') || 'Failed to access camera',
        [{ text: t('common.ok') || 'OK' }]
      );
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => {
      switch (current) {
        case 'off': return 'auto';
        case 'auto': return 'on';
        case 'on': return 'off';
        default: return 'auto';
      }
    });
  };

  const getFlashIcon = () => {
    switch (flash) {
      case 'on': return '💡';
      case 'off': return '🌙';
      default: return '⚡';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ThemedText style={styles.headerButtonText}>✕</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{currentConfig.title}</ThemedText>
        <View style={styles.placeholder} />
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <ThemedText style={styles.instructionsText}>
          {currentConfig.instructions}
        </ThemedText>
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
        />
        
        {/* Camera Overlay */}
        <View style={styles.overlay}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity onPress={toggleFlash} style={styles.controlButton}>
              <ThemedText style={styles.controlIcon}>{getFlashIcon()}</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity onPress={toggleCameraFacing} style={styles.controlButton}>
              <ThemedText style={styles.controlIcon}>🔄</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            
            <View style={styles.placeholder} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerButton: {
    padding: 10,
  },
  headerButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholder: {
    width: 38,
  },
  instructions: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
  },
  instructionsText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
  },
  topControls: {
    alignItems: 'flex-end',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    color: '#FFF',
    fontSize: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
});
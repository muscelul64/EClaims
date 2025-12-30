import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CapturePhoto, useCameraStore } from '@/stores/use-camera-store';
import { useTranslation } from 'react-i18next';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: 'id' | 'license' | 'registration' | 'damage' | 'general';
    returnTo?: string;
  }>();
  
  const {
    isFlashEnabled,
    setFlashEnabled,
    addPhoto,
    currentPhotoType,
    setCurrentPhotoType
  } = useCameraStore();
  
  const { t } = useTranslation();
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    if (params.type) {
      setCurrentPhotoType(params.type);
    }
  }, [params.type, setCurrentPhotoType]);

  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Requesting camera permissions...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.permissionContainer}>
        <ThemedText style={styles.permissionText}>
          Camera access is required to take photos
        </ThemedText>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <ThemedText style={styles.permissionButtonText}>Grant Permission</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;
    
    try {
      setIsCapturing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true,
      });
      
      if (!photo) return;
      
      // Get location if permission is granted
      let location;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const currentLocation = await Location.getCurrentPositionAsync({});
          location = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          };
        }
      } catch (error) {
        console.log('Location access denied or failed:', error);
      }
      
      const capturedPhoto: CapturePhoto = {
        ...photo,
        id: `photo_${Date.now()}`,
        type: currentPhotoType,
        metadata: {
          location,
          timestamp: Date.now(),
        },
      };
      
      addPhoto(capturedPhoto);
      
      Alert.alert(
        'Photo Captured',
        'Photo has been saved successfully.',
        [
          {
            text: 'Take Another',
            style: 'default',
          },
          {
            text: 'Done',
            onPress: () => {
              router.back();
              if (params.returnTo) {
                router.push(params.returnTo as any);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to take picture:', error);
      Alert.alert(t('common.error') || 'Error', t('camera.errorTakingPhoto') || 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlashEnabled(!isFlashEnabled);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={isFlashEnabled ? 'on' : 'off'}
      >
        {/* Header Controls */}
        <View style={styles.headerControls}>
          <TouchableOpacity style={styles.controlButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <ThemedText style={styles.photoTypeText}>
            {currentPhotoType.charAt(0).toUpperCase() + currentPhotoType.slice(1)} Photo
          </ThemedText>
          
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Ionicons 
              name={isFlashEnabled ? "flash" : "flash-off"} 
              size={24} 
              color={isFlashEnabled ? "yellow" : "white"} 
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={28} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isCapturing}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <View style={styles.controlButton} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  photoTypeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ddd',
  },
});

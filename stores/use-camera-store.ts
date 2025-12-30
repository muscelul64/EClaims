import { CameraCapturedPicture } from 'expo-camera';
import { create } from 'zustand';

export interface CapturePhoto extends CameraCapturedPicture {
  id: string;
  type: 'id' | 'license' | 'registration' | 'damage' | 'general';
  metadata?: {
    location?: { latitude: number; longitude: number };
    timestamp?: number;
    vehicleId?: string;
    damageArea?: string;
  };
}

interface CameraState {
  photos: CapturePhoto[];
  isFlashEnabled: boolean;
  currentPhotoType: CapturePhoto['type'];
  addPhoto: (photo: CapturePhoto) => void;
  removePhoto: (id: string) => void;
  clearPhotos: () => void;
  setFlashEnabled: (enabled: boolean) => void;
  setCurrentPhotoType: (type: CapturePhoto['type']) => void;
  getPhotosByType: (type: CapturePhoto['type']) => CapturePhoto[];
}

export const useCameraStore = create<CameraState>((set, get) => ({
  photos: [],
  isFlashEnabled: false,
  currentPhotoType: 'general',
  
  addPhoto: (photo) => {
    set((state) => ({
      photos: [...state.photos, photo]
    }));
  },
  
  removePhoto: (id) => {
    set((state) => ({
      photos: state.photos.filter(photo => photo.id !== id)
    }));
  },
  
  clearPhotos: () => {
    set({ photos: [] });
  },
  
  setFlashEnabled: (enabled) => {
    set({ isFlashEnabled: enabled });
  },
  
  setCurrentPhotoType: (type) => {
    set({ currentPhotoType: type });
  },
  
  getPhotosByType: (type) => {
    return get().photos.filter(photo => photo.type === type);
  },
}));

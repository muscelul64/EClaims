import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  color: string;
  fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  insuranceCompany?: string;
  policyNumber?: string;
  registrationDocument?: string;
  createdAt: number;
  updatedAt: number;
}

interface VehiclesState {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  isLoading: boolean;
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
  removeVehicle: (id: string) => Promise<void>;
  selectVehicle: (vehicle: Vehicle | null) => void;
  loadVehicles: () => Promise<void>;
  saveVehicles: () => Promise<void>;
}

const STORAGE_KEY = '@vehicles';

export const useVehiclesStore = create<VehiclesState>((set, get) => ({
  vehicles: [],
  selectedVehicle: null,
  isLoading: false,
  
  addVehicle: async (vehicleData) => {
    const now = Date.now();
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `vehicle_${now}`,
      createdAt: now,
      updatedAt: now,
    };
    
    set((state) => ({
      vehicles: [...state.vehicles, newVehicle]
    }));
    
    await get().saveVehicles();
  },
  
  updateVehicle: async (id, updates) => {
    set((state) => ({
      vehicles: state.vehicles.map(vehicle => 
        vehicle.id === id 
          ? { ...vehicle, ...updates, updatedAt: Date.now() }
          : vehicle
      )
    }));
    
    await get().saveVehicles();
  },
  
  removeVehicle: async (id) => {
    set((state) => ({
      vehicles: state.vehicles.filter(vehicle => vehicle.id !== id),
      selectedVehicle: state.selectedVehicle?.id === id ? null : state.selectedVehicle
    }));
    
    await get().saveVehicles();
  },
  
  selectVehicle: (vehicle) => {
    set({ selectedVehicle: vehicle });
  },
  
  loadVehicles: async () => {
    try {
      set({ isLoading: true });
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const vehicles = JSON.parse(data);
        set({ vehicles });
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  saveVehicles: async () => {
    try {
      const { vehicles } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    } catch (error) {
      console.error('Failed to save vehicles:', error);
    }
  },
}));

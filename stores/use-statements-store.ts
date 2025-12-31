import { submitStatement as apiSubmitStatement } from '@/utils/api/statements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { CapturePhoto } from './use-camera-store';
import { Vehicle } from './use-vehicles-store';

export interface StatementLocation {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: number;
}

export interface StatementDamage {
  id: string;
  area: string;
  severity: 'minor' | 'moderate' | 'severe';
  description?: string;
  photos: CapturePhoto[];
}

export interface ClaimStatement {
  id: string;
  type: 'accident' | 'damage' | 'theft';
  status: 'draft' | 'submitted' | 'processing' | 'completed';
  vehicle: Vehicle;
  incidentDate: number;
  location: StatementLocation;
  description: string;
  damages: StatementDamage[];
  photos: CapturePhoto[];
  involvedParties?: {
    driverLicense?: CapturePhoto;
    vehicleRegistration?: CapturePhoto;
    insurance?: string;
  }[];
  isEmergencyServicesInvolved: boolean;
  policeReportNumber?: string;
  witnessInfo?: {
    name: string;
    phone: string;
    statement: string;
  }[];
  confirmationNumber?: string;
  createdAt: number;
  updatedAt: number;
  submittedAt?: number;
}

interface StatementsState {
  statements: ClaimStatement[];
  currentStatement: ClaimStatement | null;
  isLoading: boolean;
  startNewStatement: (type: ClaimStatement['type'], vehicle: Vehicle) => void;
  updateCurrentStatement: (updates: Partial<ClaimStatement>) => void;
  addDamage: (damage: Omit<StatementDamage, 'id'>) => void;
  updateDamage: (id: string, updates: Partial<StatementDamage>) => void;
  removeDamage: (id: string) => void;
  addPhoto: (photo: CapturePhoto) => void;
  removePhoto: (photoId: string) => void;
  saveStatement: () => Promise<void>;
  submitStatement: () => Promise<any>;
  loadStatements: () => Promise<void>;
  clearCurrentStatement: () => void;
  // New methods for statement workflow
  addStatement: (statement: ClaimStatement) => Promise<void>;
  updateStatement: (id: string, updates: Partial<ClaimStatement>) => void;
  deleteStatement: (id: string) => void;
  getStatement: (id: string) => ClaimStatement | undefined;
}

const STORAGE_KEY = '@statements';

export const useStatementsStore = create<StatementsState>((set, get) => ({
  statements: [],
  currentStatement: null,
  isLoading: false,
  
  startNewStatement: (type, vehicle) => {
    const now = Date.now();
    const newStatement: ClaimStatement = {
      id: `statement_${now}`,
      type,
      status: 'draft',
      vehicle,
      incidentDate: now,
      location: {
        latitude: 0,
        longitude: 0,
        timestamp: now,
      },
      description: '',
      damages: [],
      photos: [],
      isEmergencyServicesInvolved: false,
      createdAt: now,
      updatedAt: now,
    };
    
    set({ currentStatement: newStatement });
  },
  
  updateCurrentStatement: (updates) => {
    set((state) => ({
      currentStatement: state.currentStatement ? {
        ...state.currentStatement,
        ...updates,
        updatedAt: Date.now(),
      } : null
    }));
  },
  
  addDamage: (damageData) => {
    const damage: StatementDamage = {
      ...damageData,
      id: `damage_${Date.now()}`,
    };
    
    set((state) => ({
      currentStatement: state.currentStatement ? {
        ...state.currentStatement,
        damages: [...state.currentStatement.damages, damage],
        updatedAt: Date.now(),
      } : null
    }));
  },
  
  updateDamage: (id, updates) => {
    set((state) => ({
      currentStatement: state.currentStatement ? {
        ...state.currentStatement,
        damages: state.currentStatement.damages.map(damage => 
          damage.id === id ? { ...damage, ...updates } : damage
        ),
        updatedAt: Date.now(),
      } : null
    }));
  },
  
  removeDamage: (id) => {
    set((state) => ({
      currentStatement: state.currentStatement ? {
        ...state.currentStatement,
        damages: state.currentStatement.damages.filter(damage => damage.id !== id),
        updatedAt: Date.now(),
      } : null
    }));
  },
  
  addPhoto: (photo) => {
    set((state) => ({
      currentStatement: state.currentStatement ? {
        ...state.currentStatement,
        photos: [...state.currentStatement.photos, photo],
        updatedAt: Date.now(),
      } : null
    }));
  },
  
  removePhoto: (photoId) => {
    set((state) => ({
      currentStatement: state.currentStatement ? {
        ...state.currentStatement,
        photos: state.currentStatement.photos.filter(photo => photo.id !== photoId),
        updatedAt: Date.now(),
      } : null
    }));
  },
  
  saveStatement: async () => {
    const { currentStatement, statements } = get();
    if (!currentStatement) return;
    
    const existingIndex = statements.findIndex(s => s.id === currentStatement.id);
    let updatedStatements;
    
    if (existingIndex >= 0) {
      updatedStatements = statements.map((s, index) => 
        index === existingIndex ? currentStatement : s
      );
    } else {
      updatedStatements = [...statements, currentStatement];
    }
    
    set({ statements: updatedStatements });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStatements));
    } catch (error) {
      console.error('Failed to save statements:', error);
    }
  },
  
  submitStatement: async () => {
    const { currentStatement } = get();
    if (!currentStatement) return;

    try {
      set({ isLoading: true });
      
      // Update statement status to submitting
      const updatedStatement = {
        ...currentStatement,
        status: 'submitted' as const,
        submittedAt: Date.now(),
        updatedAt: Date.now(),
      };

      set({ currentStatement: updatedStatement });

      // Submit to API
      const response = await apiSubmitStatement(updatedStatement);
      
      if (response.success && response.data) {
        console.log('Statement submitted successfully:', {
          confirmationNumber: response.data.confirmationNumber,
          statementId: response.data.statementId,
        });

        // Update statement with confirmation info if available
        const finalStatement = {
          ...updatedStatement,
          status: 'processing' as const,
          confirmationNumber: response.data.confirmationNumber,
        };

        set({ currentStatement: finalStatement });
        await get().saveStatement();
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to submit statement');
      }
    } catch (error) {
      console.error('Failed to submit statement:', error);
      
      // Revert status on error
      set((state) => ({
        currentStatement: state.currentStatement ? {
          ...state.currentStatement,
          status: 'draft',
          submittedAt: undefined,
        } : null
      }));
      
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  loadStatements: async () => {
    try {
      set({ isLoading: true });
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const statements = JSON.parse(data);
        set({ statements });
      }
    } catch (error) {
      console.error('Failed to load statements:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  clearCurrentStatement: () => {
    set({ currentStatement: null });
  },

  // New methods for statement workflow
  addStatement: async (statement) => {
    console.log('Adding statement to store:', statement.id);
    
    set((state) => ({
      statements: [statement, ...state.statements],
    }));
    
    // Save to AsyncStorage
    try {
      const { statements } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(statements));
      console.log('Statement saved successfully to storage');
    } catch (error) {
      console.error('Failed to save statement to storage:', error);
      throw error;
    }
  },

  updateStatement: (id, updates) => {
    set((state) => ({
      statements: state.statements.map((statement) =>
        statement.id === id
          ? { ...statement, ...updates, updatedAt: Date.now() }
          : statement
      ),
    }));
    
    // Save to AsyncStorage
    const saveToStorage = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().statements));
      } catch (error) {
        console.error('Failed to update statement:', error);
      }
    };
    saveToStorage();
  },

  deleteStatement: (id) => {
    set((state) => ({
      statements: state.statements.filter((statement) => statement.id !== id),
    }));
    
    // Save to AsyncStorage
    const saveToStorage = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().statements));
      } catch (error) {
        console.error('Failed to delete statement:', error);
      }
    };
    saveToStorage();
  },

  getStatement: (id) => {
    return get().statements.find((statement) => statement.id === id);
  },
}));

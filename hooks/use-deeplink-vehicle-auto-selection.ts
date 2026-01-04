import { useUserStore } from '@/stores/use-user-store';
import { useVehiclesStore } from '@/stores/use-vehicles-store';
import { useEffect } from 'react';

/**
 * Custom hook for auto-selecting vehicles from deeplink context
 * This should be used in any screen that might be accessed via deeplink and needs vehicle selection
 */
export function useDeeplinkVehicleAutoSelection(options?: {
  enableDebugLogs?: boolean;
  screenName?: string;
}) {
  const { user } = useUserStore();
  const { selectedVehicle, selectVehicle, getFilteredVehicles, loadVehicles } = useVehiclesStore();
  
  const { enableDebugLogs = false, screenName = 'Unknown Screen' } = options || {};

  // Load vehicles on mount to ensure we have the latest data
  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  // Auto-select vehicle from deeplink context if available
  useEffect(() => {
    const deeplinkContext = user.deeplinkContext;
    
    if (enableDebugLogs) {
      console.log(`=== ${screenName} Vehicle Auto-Selection Debug ===`);
      console.log('Deeplink context:', JSON.stringify(deeplinkContext, null, 2));
      console.log('Current selected vehicle:', selectedVehicle ? {
        id: selectedVehicle.id,
        make: selectedVehicle.make,
        model: selectedVehicle.model
      } : null);
    }
    
    // If we already have a vehicle selected, don't override it
    if (selectedVehicle) {
      if (enableDebugLogs) {
        console.log('Vehicle already selected - skipping auto-selection');
      }
      return;
    }
    
    // Function to attempt vehicle selection
    const attemptVehicleSelection = () => {
      if (enableDebugLogs) {
        console.log('Attempting vehicle selection...');
      }
      
      if (!deeplinkContext) {
        if (enableDebugLogs) {
          console.log('No deeplink context found');
        }
        return false;
      }
      
      // Check if we have any form of vehicle restriction/data
      const hasVehicleFromDeeplink = deeplinkContext.hasVehicleRestriction || 
                                    deeplinkContext.allowedVehicleId || 
                                    deeplinkContext.vehicleData;
      
      if (enableDebugLogs) {
        console.log('Has vehicle from deeplink?', hasVehicleFromDeeplink);
      }
      
      if (!hasVehicleFromDeeplink) {
        if (enableDebugLogs) {
          console.log('No vehicle data in deeplink context');
        }
        return false;
      }
      
      const filteredVehicles = getFilteredVehicles();
      if (enableDebugLogs) {
        console.log('All filtered vehicles:', filteredVehicles.map(v => ({ 
          id: v.id, 
          make: v.make, 
          model: v.model,
          vin: v.vin,
          licensePlate: v.licensePlate 
        })));
      }
      
      // Try to find by allowedVehicleId first
      if (deeplinkContext.allowedVehicleId) {
        if (enableDebugLogs) {
          console.log('Looking for vehicle with ID:', deeplinkContext.allowedVehicleId);
        }
        const deeplinkVehicle = filteredVehicles.find(v => v.id === deeplinkContext.allowedVehicleId);
        
        if (deeplinkVehicle) {
          if (enableDebugLogs) {
            console.log('✅ Found vehicle by ID - auto-selecting:', deeplinkVehicle.make, deeplinkVehicle.model);
          }
          selectVehicle(deeplinkVehicle);
          return true;
        } else if (enableDebugLogs) {
          console.warn('❌ Vehicle not found by allowedVehicleId:', deeplinkContext.allowedVehicleId);
        }
      }
      
      // Try to find by vehicle data (VIN, license plate, etc.)
      if (deeplinkContext.vehicleData) {
        if (enableDebugLogs) {
          console.log('Looking for vehicle by data:', deeplinkContext.vehicleData);
        }
        
        const vehicleByVin = deeplinkContext.vehicleData.vin ? 
          filteredVehicles.find(v => v.vin === deeplinkContext.vehicleData.vin) : null;
        
        const vehicleByPlate = deeplinkContext.vehicleData.licensePlate ? 
          filteredVehicles.find(v => v.licensePlate === deeplinkContext.vehicleData.licensePlate) : null;
        
        const matchedVehicle = vehicleByVin || vehicleByPlate;
        
        if (matchedVehicle) {
          if (enableDebugLogs) {
            console.log('✅ Found vehicle by data - auto-selecting:', matchedVehicle.make, matchedVehicle.model);
          }
          selectVehicle(matchedVehicle);
          return true;
        } else if (enableDebugLogs) {
          console.warn('❌ Vehicle not found by VIN or plate');
        }
        
        // If no specific match but we have vehicles in restriction mode, select the first one
        if (filteredVehicles.length > 0) {
          if (enableDebugLogs) {
            console.log('✅ Selecting first available vehicle in restriction mode:', filteredVehicles[0].make, filteredVehicles[0].model);
          }
          selectVehicle(filteredVehicles[0]);
          return true;
        }
      }
      
      if (enableDebugLogs) {
        console.log('❌ No vehicle could be auto-selected');
      }
      return false;
    };
    
    // Attempt immediate selection
    if (enableDebugLogs) {
      console.log('Attempting immediate vehicle selection...');
    }
    if (attemptVehicleSelection()) {
      if (enableDebugLogs) {
        console.log('✅ Immediate selection successful');
      }
      return;
    }
    
    // If immediate selection failed and we have deeplink context, try again after a brief delay
    if (deeplinkContext && (deeplinkContext.hasVehicleRestriction || deeplinkContext.allowedVehicleId || deeplinkContext.vehicleData)) {
      if (enableDebugLogs) {
        console.log('⏱️ Setting up retry timeout...');
      }
      const retryTimeout = setTimeout(() => {
        if (enableDebugLogs) {
          console.log('🔄 Retrying vehicle auto-selection after delay...');
        }
        if (!selectedVehicle) {
          const success = attemptVehicleSelection();
          if (enableDebugLogs) {
            if (success) {
              console.log('✅ Retry selection successful');
            } else {
              console.log('❌ Retry selection failed');
            }
          }
        } else if (enableDebugLogs) {
          console.log('Vehicle was selected elsewhere during retry delay');
        }
      }, 500);
      
      return () => {
        if (enableDebugLogs) {
          console.log('Cleaning up retry timeout');
        }
        clearTimeout(retryTimeout);
      };
    }
    
    if (enableDebugLogs) {
      console.log('❌ No valid conditions for auto-selection');
      console.log(`=== End ${screenName} Auto-Selection Debug ===`);
    }
  }, [user.deeplinkContext, selectedVehicle, selectVehicle, getFilteredVehicles, enableDebugLogs, screenName]);
}
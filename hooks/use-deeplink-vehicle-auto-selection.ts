import { useUserStore } from '@/stores/use-user-store';
import { useVehiclesStore } from '@/stores/use-vehicles-store';
import { useEffect } from 'react';

/**
 * Custom hook for auto-selecting vehicles from Universal Link context
 * This should be used in any screen that might be accessed via Universal Link and needs vehicle selection
 */
export function useUniversalLinkVehicleAutoSelection(options?: {
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

  // Auto-select vehicle from Universal Link context if available
  useEffect(() => {
    const universalLinkContext = user.universalLinkContext;
    
    if (enableDebugLogs) {
      console.log(`=== ${screenName} Vehicle Auto-Selection Debug ===`);
      console.log('Universal Link context:', JSON.stringify(universalLinkContext, null, 2));
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
      
      if (!universalLinkContext) {
        if (enableDebugLogs) {
          console.log('No Universal Link context found');
        }
        return false;
      }
      
      // Check if we have any form of vehicle restriction/data
      const hasVehicleFromUniversalLink = universalLinkContext.hasVehicleRestriction || 
                                    universalLinkContext.allowedVehicleId || 
                                    universalLinkContext.vehicleData;
      
      if (enableDebugLogs) {
        console.log('Has vehicle from Universal Link?', hasVehicleFromUniversalLink);
      }
      
      if (!hasVehicleFromUniversalLink) {
        if (enableDebugLogs) {
          console.log('No vehicle data in Universal Link context');
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
      if (universalLinkContext.allowedVehicleId) {
        if (enableDebugLogs) {
          console.log('Looking for vehicle with ID:', universalLinkContext.allowedVehicleId);
        }
        const universalLinkVehicle = filteredVehicles.find(v => v.id === universalLinkContext.allowedVehicleId);
        
        if (universalLinkVehicle) {
          if (enableDebugLogs) {
            console.log('✅ Found vehicle by ID - auto-selecting:', universalLinkVehicle.make, universalLinkVehicle.model);
          }
          selectVehicle(universalLinkVehicle);
          return true;
        } else if (enableDebugLogs) {
          console.warn('❌ Vehicle not found by allowedVehicleId:', universalLinkContext.allowedVehicleId);
        }
      }
      
      // Try to find by vehicle data (VIN, license plate, etc.)
      if (universalLinkContext.vehicleData) {
        if (enableDebugLogs) {
          console.log('Looking for vehicle by data:', universalLinkContext.vehicleData);
        }
        
        const vehicleByVin = universalLinkContext.vehicleData.vin ? 
          filteredVehicles.find(v => v.vin === universalLinkContext.vehicleData.vin) : null;
        
        const vehicleByPlate = universalLinkContext.vehicleData.licensePlate ? 
          filteredVehicles.find(v => v.licensePlate === universalLinkContext.vehicleData.licensePlate) : null;
        
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
    
    // If immediate selection failed and we have Universal Link context, try again after a brief delay
    if (universalLinkContext && (universalLinkContext.hasVehicleRestriction || universalLinkContext.allowedVehicleId || universalLinkContext.vehicleData)) {
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
  }, [user.universalLinkContext, selectedVehicle, selectVehicle, getFilteredVehicles, enableDebugLogs, screenName]);
}
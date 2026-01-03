import { ClaimStatement } from '@/stores/use-statements-store';
import { ApiError, ApiResponse, createApiHeaders, handleApiError } from './base';

// API endpoint configuration
const STATEMENTS_API_BASE = 'http://drivesafewabapi.deactec.com';

export interface StatementSubmissionPayload {
  id: string;
  type: 'accident' | 'damage' | 'theft';
  status: 'draft' | 'submitted' | 'processing' | 'completed';
  incidentDate: string; // ISO date string
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    timestamp: string; // ISO date string
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    vin: string;
    color?: string;
    fuelType: string;
    insuranceCompany?: string;
    policyNumber?: string;
  };
  damages: {
    id: string;
    area: string;
    severity: 'minor' | 'moderate' | 'severe';
    description?: string;
    photoCount: number;
  }[];
  photos: {
    id: string;
    type: 'id' | 'license' | 'registration' | 'damage' | 'general';
    timestamp: string; // ISO date string
    location?: {
      latitude: number;
      longitude: number;
    };
  }[];
  involvedParties?: {
    type: string;
    name: string;
    phone?: string;
    isInsured?: boolean;
    insuranceCompany?: string;
  }[];
  circumstances?: {
    type: string;
    weather?: string[];
    roadConditions?: string[];
    speed?: string;
    description: string;
  };
  isEmergencyServicesInvolved: boolean;
  policeReportNumber?: string;
  witnessInfo?: {
    name: string;
    phone: string;
    statement: string;
  }[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  submittedAt?: string; // ISO date string
  deviceInfo: {
    platform: string;
    version: string;
    appVersion: string;
  };
}

export interface StatementSubmissionResponse {
  statementId: string;
  status: 'received' | 'processing' | 'completed';
  confirmationNumber: string;
  message: string;
  estimatedProcessingTime?: string;
  nextSteps?: string[];
}

/**
 * Convert ClaimStatement to API payload format
 */
export const createStatementPayload = (
  statement: ClaimStatement,
  parties?: any[],
  circumstances?: any
): StatementSubmissionPayload => {
  return {
    id: statement.id,
    type: statement.type,
    status: statement.status,
    incidentDate: new Date(statement.incidentDate).toISOString(),
    description: statement.description,
    location: {
      latitude: statement.location.latitude,
      longitude: statement.location.longitude,
      address: statement.location.address,
      timestamp: new Date(statement.location.timestamp).toISOString(),
    },
    vehicle: {
      id: statement.vehicle.id,
      make: statement.vehicle.make,
      model: statement.vehicle.model,
      year: statement.vehicle.year,
      licensePlate: statement.vehicle.licensePlate,
      vin: statement.vehicle.vin,
      color: statement.vehicle.color,
      fuelType: statement.vehicle.fuelType || 'unknown',
      insuranceCompany: statement.vehicle.insuranceCompany,
      policyNumber: statement.vehicle.policyNumber,
    },
    damages: statement.damages.map(damage => ({
      id: damage.id,
      area: damage.area,
      severity: damage.severity,
      description: damage.description,
      photoCount: damage.photos.length,
    })),
    photos: statement.photos.map(photo => ({
      id: photo.id,
      type: photo.type,
      timestamp: new Date(photo.metadata?.timestamp || Date.now()).toISOString(),
      location: photo.metadata?.location ? {
        latitude: photo.metadata.location.latitude,
        longitude: photo.metadata.location.longitude,
      } : undefined,
    })),
    involvedParties: parties?.map(party => ({
      type: party.type,
      name: party.name,
      phone: party.phone,
      isInsured: party.isInsured,
      insuranceCompany: party.insuranceCompany,
    })),
    circumstances: circumstances ? {
      type: circumstances.type,
      weather: circumstances.weather,
      roadConditions: circumstances.roadConditions,
      speed: circumstances.speed,
      description: circumstances.description,
    } : undefined,
    isEmergencyServicesInvolved: statement.isEmergencyServicesInvolved,
    policeReportNumber: statement.policeReportNumber,
    witnessInfo: statement.witnessInfo,
    createdAt: new Date(statement.createdAt).toISOString(),
    updatedAt: new Date(statement.updatedAt).toISOString(),
    submittedAt: statement.submittedAt ? new Date(statement.submittedAt).toISOString() : undefined,
    deviceInfo: {
      platform: 'react-native',
      version: '1.0.0',
      appVersion: '1.0.0',
    },
  };
};

/**
 * Submit statement to the API
 */
export const submitStatement = async (
  statement: ClaimStatement,
  parties?: any[],
  circumstances?: any,
  token?: string
): Promise<ApiResponse<StatementSubmissionResponse>> => {
  try {
    const payload = createStatementPayload(statement, parties, circumstances);
    
    console.log('Submitting statement to API:', {
      endpoint: `${STATEMENTS_API_BASE}/statements`,
      statementId: statement.id,
      payload: payload
    });

    const headers = await createApiHeaders(token);
    const response = await fetch(`${STATEMENTS_API_BASE}/statements`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data: StatementSubmissionResponse = await response.json();
    
    console.log('Statement submitted successfully:', {
      statementId: data.statementId,
      confirmationNumber: data.confirmationNumber,
      status: data.status
    });

    return {
      success: true,
      data,
      message: 'Statement submitted successfully'
    };

  } catch (error) {
    console.error('Failed to submit statement:', error);
    throw handleApiError(error);
  }
};

/**
 * Get statement status from API
 */
export const getStatementStatus = async (
  statementId: string,
  token?: string
): Promise<ApiResponse<{ status: string; message: string }>> => {
  try {
    const headers = await createApiHeaders(token);
    const response = await fetch(`${STATEMENTS_API_BASE}/statements/${statementId}/status`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    
    return {
      success: true,
      data,
      message: 'Status retrieved successfully'
    };

  } catch (error) {
    console.error('Failed to get statement status:', error);
    throw handleApiError(error);
  }
};

/**
 * Upload photos for a statement
 */
export const uploadStatementPhotos = async (
  statementId: string,
  photos: { id: string; uri: string; type: string }[],
  token?: string
): Promise<ApiResponse<{ uploadedCount: number }>> => {
  try {
    const formData = new FormData();
    formData.append('statementId', statementId);
    
    photos.forEach((photo, index) => {
      formData.append('photos', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: `photo_${photo.id}_${index}.jpg`,
      } as any);
      formData.append(`photoData_${index}`, JSON.stringify({
        id: photo.id,
        type: photo.type,
      }));
    });

    const headers = await createApiHeaders(token);
    delete headers['Content-Type']; // Let fetch set it for FormData

    const response = await fetch(`${STATEMENTS_API_BASE}/statements/${statementId}/photos`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    
    return {
      success: true,
      data,
      message: 'Photos uploaded successfully'
    };

  } catch (error) {
    console.error('Failed to upload photos:', error);
    throw handleApiError(error);
  }
};
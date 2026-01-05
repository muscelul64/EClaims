import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { ENV_CONFIG } from './environment';

// Deeplink URL structure:
// porscheeclaims://action/param1/param2?token=auth_token
// https://eclaims.deactech.com/action/param1/param2?token=auth_token

export interface AuthToken {
  token: string;
  userId: string;
  expiresAt: number;
  scope?: string[];
}

export interface DeepLinkHandler {
  pattern: string;
  handler: (params: any, authToken?: AuthToken) => void;
  requiresAuth?: boolean;
  allowsTokenAuth?: boolean;
  description?: string;
}

interface ParsedURL {
  action: string;
  params: any;
  authToken?: AuthToken;
}

export class DeepLinkManager {
  private static instance: DeepLinkManager;
  private handlers: Map<string, DeepLinkHandler> = new Map();
  private isAuthenticated: boolean = false;
  private onTokenAuthenticate?: (token: AuthToken, params?: any) => Promise<boolean>;
  
  static getInstance(): DeepLinkManager {
    if (!DeepLinkManager.instance) {
      DeepLinkManager.instance = new DeepLinkManager();
    }
    return DeepLinkManager.instance;
  }

  // Set the token authentication callback
  setTokenAuthenticator(callback: (token: AuthToken, params?: any) => Promise<boolean>) {
    this.onTokenAuthenticate = callback;
  }

  // Initialize the deeplink system
  initialize() {
    this.registerDefaultHandlers();
    this.setupLinkingListener();
    this.handleInitialURL();
  }

  // Update authentication status
  setAuthenticationStatus(isAuthenticated: boolean) {
    this.isAuthenticated = isAuthenticated;
  }

  // Register a new deeplink handler
  registerHandler(pattern: string, handler: DeepLinkHandler) {
    this.handlers.set(pattern, handler);
  }

  // Setup the listener for incoming deeplinks
  private setupLinkingListener() {
    const subscription = Linking.addEventListener('url', this.handleDeepLink.bind(this));
    return subscription;
  }

  // Handle initial URL when app is opened via deeplink
  private async handleInitialURL() {
    try {
      const initialURL = await Linking.getInitialURL();
      if (initialURL) {
        setTimeout(() => this.handleDeepLink({ url: initialURL }), 1000);
      }
    } catch (error) {
      console.warn('Error handling initial URL:', error);
    }
  }

  // Main deeplink handler
  private async handleDeepLink({ url }: { url: string }) {
    try {
      const parsed = await this.parseURL(url);
      if (!parsed) {
        console.warn('Could not parse deeplink:', url);
        return;
      }

      const { action, params, authToken } = parsed;
      const handler = this.handlers.get(action);

      if (!handler) {
        console.warn('No handler found for action:', action);
        this.showDeepLinkError(`Unknown action: ${action}`);
        return;
      }

      // Handle token authentication first if present
      if (authToken) {
        if (!handler.allowsTokenAuth) {
          console.warn('Token authentication not allowed for action:', action);
          this.showDeepLinkError('Token authentication not supported for this action');
          return;
        }

        if (!this.onTokenAuthenticate) {
          console.warn('Token authenticator not set');
          this.showDeepLinkError('Token authentication not configured');
          return;
        }

        // Validate token
        if (!this.isTokenValid(authToken)) {
          console.warn('Invalid or expired token');
          this.showDeepLinkError('Authentication token is invalid or expired');
          return;
        }

        // Attempt token authentication
        try {
          // Pass parameters to token authenticator for deeplink context
          const authParams = {
            ...params,
            originalUrl: url
          };
          const authSuccess = await this.onTokenAuthenticate(authToken, authParams);
          if (!authSuccess) {
            console.warn('Token authentication failed');
            this.showDeepLinkError('Authentication failed');
            return;
          }
          
          // Update authentication status
          this.setAuthenticationStatus(true);
        } catch (error) {
          console.error('Token authentication error:', error);
          this.showDeepLinkError('Authentication error occurred');
          return;
        }
      }

      // Check authentication requirement
      if (handler.requiresAuth && !this.isAuthenticated && !authToken) {
        console.warn('Authentication required for action:', action);
        this.handleAuthRequiredDeepLink(url);
        return;
      }

      // Execute the handler
      handler.handler(params, authToken);

    } catch (error) {
      console.error('Error handling deeplink:', error);
      this.showDeepLinkError('Invalid link format');
    }
  }

  // Parse the incoming URL
  private async parseURL(url: string): Promise<ParsedURL | null> {
    try {
      console.log('🔍 Parsing incoming URL:', url);
      
      // Handle both custom scheme and universal links
      let cleanURL = url;
      let sourceType = 'unknown';
      
      // Get environment-specific universal link host
      const universalLinkHost = ENV_CONFIG.UNIVERSAL_LINK_HOST;
      const universalLinkPrefix = `https://${universalLinkHost}/`;
      
      if (url.startsWith(universalLinkPrefix)) {
        cleanURL = url.replace(universalLinkPrefix, `${ENV_CONFIG.APP_SCHEME}://`);
        sourceType = 'Universal Link';
        console.log('✅ Detected Universal Link, converted to:', cleanURL);
      } else if (url.startsWith(`${ENV_CONFIG.APP_SCHEME}://`)) {
        cleanURL = url.replace(`${ENV_CONFIG.APP_SCHEME}://`, '');
        sourceType = 'Custom Scheme';
        console.log('✅ Detected Custom Scheme, cleaned to:', cleanURL);
      } else {
        console.warn('⚠️ Unknown URL scheme:', url);
        console.log('Expected Universal Link prefix:', universalLinkPrefix);
        console.log('Expected Custom Scheme prefix:', `${ENV_CONFIG.APP_SCHEME}://`);
      }

      // Split URL and query parameters
      const [pathPart, queryPart] = cleanURL.split('?');
      const parts = pathPart.split('/').filter(part => part.length > 0);
      
      console.log('URL components:', { sourceType, pathPart, queryPart: queryPart?.substring(0, 100) + '...' });
      
      if (parts.length === 0) {
        const authToken = await this.parseAuthToken(queryPart);
        return { action: 'home', params: {}, authToken };
      }

      const action = parts[0];
      const params: any = {};
      let authToken: AuthToken | undefined;

      // Parse query parameters for token and other data
      if (queryPart) {
        const queryParams = new URLSearchParams(queryPart);
        
        // Extract authentication token
        const tokenString = queryParams.get('token');
        if (tokenString) {
          authToken = await this.parseAuthToken(tokenString);
          console.log('📝 Auth token extracted:', authToken?.userId ? 'Valid' : 'Invalid');
        }
        
        // Extract other query parameters (including vehicleData and secureData)
        for (const [key, value] of queryParams.entries()) {
          if (key !== 'token') {
            params[key] = decodeURIComponent(value);
            if (key === 'vehicleData' || key === 'secureData') {
              console.log(`📦 Found ${key} parameter (length: ${value.length})`);
            } else {
              console.log(`📝 Parameter ${key}:`, value.substring(0, 50));
            }
          }
        }
      }

      // Parse URL parameters based on action
      switch (action) {
        case 'statement':
          if (parts[1]) params.statementId = parts[1];
          if (parts[2]) params.mode = parts[2]; // view, edit, continue
          break;
        case 'vehicle':
          if (parts[1]) params.vehicleId = parts[1];
          if (parts[2]) params.action = parts[2]; // view, edit, add
          break;
        case 'vehicles':
          // Single vehicle ID in URL path: /vehicles/vehicleId
          if (parts[1]) params.vehicleId = parts[1];
          break;
        case 'damage':
          if (parts[1]) params.vehicleId = parts[1];
          if (parts[2]) params.type = parts[2]; // assess, report
          break;
        case 'camera':
          if (parts[1]) params.type = parts[1]; // id, license, registration, damage, general
          if (parts[2]) params.returnTo = parts[2];
          break;
        default:
          // Generic parameter parsing
          for (let i = 1; i < parts.length; i += 2) {
            if (i + 1 < parts.length) {
              params[parts[i]] = decodeURIComponent(parts[i + 1]);
            }
          }
      }

      return { action, params, authToken };

    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  }

  // Parse authentication token from string
  private async parseAuthToken(tokenString?: string): Promise<AuthToken | undefined> {
    if (!tokenString) return undefined;
    
    try {
      // Try secure JWT parsing first
      try {
        const { secureJWT } = await import('./secure-communication');
        const secureResult = secureJWT.verifyToken(tokenString);
        if (secureResult) {
          return {
            token: tokenString,
            userId: secureResult.payload.userId || secureResult.payload.sub || '',
            expiresAt: secureResult.payload.exp || Date.now() + 24 * 60 * 60 * 1000,
            scope: secureResult.payload.scope ? secureResult.payload.scope.split(' ') : undefined
          };
        }
      } catch (secureError) {
        console.warn('Secure token parsing failed, trying legacy methods:', secureError);
      }
      
      // Handle legacy JWT-like tokens
      if (tokenString.includes('.')) {
        // JWT-like token - decode payload
        const parts = tokenString.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          return {
            token: tokenString,
            userId: payload.sub || payload.userId || '',
            expiresAt: (payload.exp || 0) * 1000, // Convert to milliseconds
            scope: payload.scope ? payload.scope.split(' ') : undefined
          };
        }
      }
      
      // Try to parse as JSON
      const parsed = JSON.parse(atob(tokenString));
      return {
        token: tokenString,
        userId: parsed.userId || '',
        expiresAt: parsed.expiresAt || Date.now() + 24 * 60 * 60 * 1000, // Default 24h
        scope: parsed.scope
      };
    } catch (error) {
      // Treat as simple token
      console.warn('Could not parse token, treating as simple token:', error);
      return {
        token: tokenString,
        userId: '',
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // Default 24h
      };
    }
  }

  // Validate authentication token
  private isTokenValid(token: AuthToken): boolean {
    // Check expiration
    if (token.expiresAt && Date.now() > token.expiresAt) {
      console.warn('Token expired');
      return false;
    }

    // Check token format
    if (!token.token || token.token.length < 10) {
      console.warn('Invalid token format');
      return false;
    }

    // Add more validation as needed (signature verification, etc.)
    return true;
  }

  // Register default handlers
  private registerDefaultHandlers() {
    // Home
    this.registerHandler('home', {
      pattern: `${ENV_CONFIG.APP_SCHEME}://home`,
      handler: () => router.replace('/'),
      requiresAuth: true,
      allowsTokenAuth: true,
      description: 'Navigate to home screen'
    });

    // New Statement
    this.registerHandler('new-statement', {
      pattern: `${ENV_CONFIG.APP_SCHEME}://new-statement`,
      handler: () => router.push('/(main)/statements/new'),
      requiresAuth: true,
      allowsTokenAuth: true,
      description: 'Start a new insurance statement'
    });

    // View Statement
    this.registerHandler('statement', {
      pattern: 'porscheeclaims://statement/:id',
      handler: (params, authToken) => {
        if (params.statementId) {
          const mode = params.mode || 'view';
          // Pass token context if available
          if (authToken) {
            console.log('Accessing statement with authenticated token for user:', authToken.userId);
          }
          switch (mode) {
            case 'continue':
              router.push('/(main)/statements/new');
              break;
            case 'edit':
              router.push(`/(main)/statements/details/${params.statementId}`);
              break;
            default:
              router.push('/(main)/statements');
              break;
          }
        }
      },
      requiresAuth: true,
      description: 'View or edit an insurance statement'
    });

    // Vehicles
    this.registerHandler('vehicles', {
      pattern: 'porscheeclaims://vehicles',
      handler: async (params, authToken) => {
        // Handle vehicle data from deeplink - SMART VERSION  
        // Support both vehicleData (legacy base64) and secureData (encrypted) parameters
        const vehicleDataParam = params.vehicleData || params.secureData;
        if (vehicleDataParam) {
          try {
            // Import secure communication utility
            const { secureCommunication } = await import('./secure-communication');
            
            // Use smart extraction to automatically detect format (encrypted vs legacy)
            const decodedVehicleData = secureCommunication.smartExtractVehicleData(vehicleDataParam);
            
            if (!decodedVehicleData) {
              console.error('Failed to decode vehicle data in any format');
              console.log('Attempted to parse vehicle data parameter:', vehicleDataParam?.substring(0, 50) + '...');
              Alert.alert('Error', 'Unable to process vehicle data from deeplink');
              return;
            }
            
            console.log('✅ Successfully decoded vehicle data from Universal Link/deeplink');
            console.log('Vehicle details:', { 
              make: decodedVehicleData.make, 
              model: decodedVehicleData.model, 
              vin: decodedVehicleData.vin?.substring(0, 8) + '...'
            });
            
            // Import the vehicles store
            const { useVehiclesStore } = await import('@/stores/use-vehicles-store');
            const vehiclesStore = useVehiclesStore.getState();
            
            // Clear all existing vehicles (single vehicle mode)
            const currentVehicles = vehiclesStore.vehicles;
            for (const vehicle of currentVehicles) {
              await vehiclesStore.removeVehicle(vehicle.id);
            }
            
            // Add the new vehicle from deeplink
            const newVehicle = {
              make: decodedVehicleData.make || '',
              model: decodedVehicleData.model || '',
              year: decodedVehicleData.year || 2024,
              vin: decodedVehicleData.vin || '',
              licensePlate: decodedVehicleData.licensePlate || '',
              color: decodedVehicleData.color || '',
              fuelType: (decodedVehicleData.fuelType || 'gasoline') as 'gasoline' | 'diesel' | 'electric' | 'hybrid',
              insuranceCompany: decodedVehicleData.insuranceCompany || '',
              policyNumber: decodedVehicleData.policyNumber || ''
            };
            
            await vehiclesStore.addVehicle(newVehicle);
            
            // Get the newly created vehicle to get the actual ID
            const updatedVehicles = vehiclesStore.vehicles;
            const addedVehicle = updatedVehicles[updatedVehicles.length - 1];
            
            // Set deeplink context for vehicle restriction
            const { useUserStore } = await import('@/stores/use-user-store');
            const userStore = useUserStore.getState();
            
            const contextData = {
              hasVehicleRestriction: true,
              allowedVehicleId: addedVehicle?.id,
              originalUrl: params.originalUrl || '',
              vehicleData: decodedVehicleData
            };
            
            userStore.setDeeplinkContext(contextData);
            
            console.log('Vehicle added from deeplink:', decodedVehicleData.make, decodedVehicleData.model);
            console.log('Deeplink context set:', contextData);
            console.log('Added vehicle ID:', addedVehicle?.id);
          } catch (error) {
            console.error('Error processing vehicle data from deeplink:', error);
            Alert.alert('Error', 'Invalid vehicle data in link');
          }
        }
        
        // Navigate to vehicles page
        if (authToken) {
          console.log('Accessing vehicles with authenticated token for user:', authToken.userId);
        }
        router.push('/(main)/vehicles');
      },
      requiresAuth: false, // Allow access with token auth even without login
      allowsTokenAuth: true,
      description: 'View vehicles list (with potential restrictions from token)'
    });

    // Vehicle Details
    this.registerHandler('vehicle', {
      pattern: 'porscheeclaims://vehicle/:id',
      handler: (params) => {
        if (params.action === 'add') {
          router.push('/(main)/vehicles/add');
        } else if (params.vehicleId) {
          router.push(`/(main)/vehicles/edit/${params.vehicleId}`);
        } else {
          router.push('/(main)/vehicles');
        }
      },
      requiresAuth: true,
      description: 'View or manage vehicle details'
    });

    // Add Vehicle
    this.registerHandler('add-vehicle', {
      pattern: 'porscheeclaims://add-vehicle',
      handler: () => router.push('/(main)/vehicles/add'),
      requiresAuth: true,
      description: 'Add a new vehicle'
    });

    // Damage Assessment
    this.registerHandler('damage', {
      pattern: 'porscheeclaims://damage',
      handler: async (params) => {
        // If we have a specific vehicle ID, ensure it's selected for damage assessment
        if (params.vehicleId) {
          try {
            const { useVehiclesStore } = await import('@/stores/use-vehicles-store');
            const { useUserStore } = await import('@/stores/use-user-store');
            
            const vehiclesStore = useVehiclesStore.getState();
            const userStore = useUserStore.getState();
            
            // Find the vehicle and select it
            const vehicle = vehiclesStore.vehicles.find(v => v.id === params.vehicleId);
            if (vehicle) {
              vehiclesStore.selectVehicle(vehicle);
              
              // Set deeplink context to indicate vehicle restriction
              userStore.setDeeplinkContext({
                hasVehicleRestriction: true,
                allowedVehicleId: params.vehicleId,
                originalUrl: params.originalUrl || '',
              });
              
              console.log('Vehicle pre-selected for damage assessment:', vehicle.make, vehicle.model);
            }
          } catch (error) {
            console.error('Error pre-selecting vehicle for damage assessment:', error);
          }
        }
        
        // Navigate to damage assessment
        router.push('/(main)/damage');
      },
      requiresAuth: true,
      description: 'Start damage assessment with optional vehicle pre-selection'
    });

    // Camera
    this.registerHandler('camera', {
      pattern: 'porscheeclaims://camera/:type',
      handler: (params) => {
        const { type, returnTo } = params;
        const cameraParams = new URLSearchParams();
        if (type) cameraParams.append('type', type);
        if (returnTo) cameraParams.append('returnTo', returnTo);
        
        router.push(`/camera?${cameraParams.toString()}`);
      },
      requiresAuth: true,
      description: 'Open camera for specific purpose'
    });

    // Emergency
    this.registerHandler('emergency', {
      pattern: 'porscheeclaims://emergency',
      handler: () => router.push('/(main)/emergency'),
      requiresAuth: false, // Emergency should be accessible without auth
      description: 'Access emergency contacts'
    });

    // Settings
    this.registerHandler('settings', {
      pattern: 'porscheeclaims://settings',
      handler: () => router.push('/(main)/settings'),
      requiresAuth: true,
      description: 'Open app settings'
    });

    // Login
    this.registerHandler('login', {
      pattern: 'porscheeclaims://login',
      handler: () => router.replace('/(auth)/login'),
      requiresAuth: false,
      description: 'Navigate to login screen'
    });
  }

  // Handle deeplinks that require authentication
  private handleAuthRequiredDeepLink(url: string) {
    Alert.alert(
      'Login Required',
      'Please log in to access this feature.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Login',
          onPress: () => {
            // Store the pending deeplink to handle after login
            this.storePendingDeepLink(url);
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  }

  // Store deeplink to handle after authentication
  private storePendingDeepLink(url: string) {
    // You could use AsyncStorage here to persist across app restarts
    // For now, we'll use a simple property
    this.pendingDeepLink = url;
  }

  private pendingDeepLink: string | null = null;

  // Handle pending deeplink after authentication
  handlePendingDeepLink() {
    if (this.pendingDeepLink) {
      const url = this.pendingDeepLink;
      this.pendingDeepLink = null;
      setTimeout(() => this.handleDeepLink({ url }), 500);
    }
  }

  // Show error for invalid deeplinks
  private showDeepLinkError(message: string) {
    Alert.alert(
      'Invalid Link',
      message,
      [
        { text: 'OK', onPress: () => router.push('/') }
      ]
    );
  }

  // Generate deeplinks for sharing
  static generateDeepLink(action: string, params?: Record<string, string>, authToken?: string): string {
    let url = `${ENV_CONFIG.APP_SCHEME}://${action}`;
    
    if (params) {
      const paramPairs = Object.entries(params)
        .map(([key, value]) => `${key}/${encodeURIComponent(value)}`)
        .join('/');
      
      if (paramPairs) {
        url += `/${paramPairs}`;
      }
    }
    
    // Add authentication token as query parameter
    if (authToken) {
      url += `?token=${encodeURIComponent(authToken)}`;
    }
    
    return url;
  }

  // Generate universal links for sharing
  static generateUniversalLink(action: string, params?: Record<string, string>, authToken?: string): string {
    let url = `https://${ENV_CONFIG.UNIVERSAL_LINK_HOST}/${action}`;
    
    if (params) {
      const paramPairs = Object.entries(params)
        .map(([key, value]) => `${key}/${encodeURIComponent(value)}`)
        .join('/');
      
      if (paramPairs) {
        url += `/${paramPairs}`;
      }
    }
    
    // Add authentication token as query parameter
    if (authToken) {
      url += `?token=${encodeURIComponent(authToken)}`;
    }
    
    return url;
  }

  // Generate secure deeplink with temporary token
  static generateSecureDeepLink(
    action: string, 
    params?: Record<string, string>, 
    tokenData?: { userId: string; expiresInMinutes?: number; scope?: string[] }
  ): string {
    let authToken: string | undefined;
    
    if (tokenData) {
      const expiresAt = Date.now() + (tokenData.expiresInMinutes || 60) * 60 * 1000;
      const tokenPayload = {
        userId: tokenData.userId,
        expiresAt,
        scope: tokenData.scope,
        iat: Date.now()
      };
      
      // Simple base64 encoding (in production, use proper JWT)
      authToken = btoa(JSON.stringify(tokenPayload));
    }
    
    return this.generateDeepLink(action, params, authToken);
  }

  // Generate secure universal link with temporary token
  static generateSecureUniversalLink(
    action: string, 
    params?: Record<string, string>, 
    tokenData?: { userId: string; expiresInMinutes?: number; scope?: string[] }
  ): string {
    let authToken: string | undefined;
    
    if (tokenData) {
      const expiresAt = Date.now() + (tokenData.expiresInMinutes || 60) * 60 * 1000;
      const tokenPayload = {
        userId: tokenData.userId,
        expiresAt,
        scope: tokenData.scope,
        iat: Date.now()
      };
      
      // Simple base64 encoding (in production, use proper JWT)
      authToken = btoa(JSON.stringify(tokenPayload));
    }
    
    return this.generateUniversalLink(action, params, authToken);
  }

  // Get all registered handlers (for debugging)
  getRegisteredHandlers(): DeepLinkHandler[] {
    return Array.from(this.handlers.values());
  }
}

// Export singleton instance
export const deepLinkManager = DeepLinkManager.getInstance();

// Export helper functions
export const generateDeepLink = DeepLinkManager.generateDeepLink;
export const generateUniversalLink = DeepLinkManager.generateUniversalLink;
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Alert, Platform } from 'react-native';
import { ENV_CONFIG } from './environment';

// Universal Link URL structure:
// https://eclaims.deactech.com/action/param1/param2?token=auth_token

/**
 * Firebase JWT verification utilities
 */
interface FirebaseJWTPayload {
  name?: string;
  email?: string;
  user_id?: string;
  sub?: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  auth_time?: number;
  [key: string]: any;
}

class FirebaseJWTVerifier {
  static async verifyFirebaseJWT(token: string): Promise<FirebaseJWTPayload | null> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      // Decode header and payload
      const header = JSON.parse(this.base64URLDecode(parts[0]));
      const payload = JSON.parse(this.base64URLDecode(parts[1]));
      
      // Validate basic Firebase JWT structure
      if (header.alg !== 'RS256') {
        throw new Error('Unsupported algorithm, expected RS256');
      }

      if (!payload.iss || !payload.iss.includes('securetoken.google.com')) {
        throw new Error('Invalid issuer, expected Firebase token');
      }

      // Check expiration
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        throw new Error('Token expired');
      }

      // For production, implement full signature verification against Google's public keys
      // For now, return the payload after basic validation
      return payload as FirebaseJWTPayload;
      
    } catch (error) {
      console.error('Firebase JWT verification failed:', error);
      return null;
    }
  }

  private static base64URLDecode(str: string): string {
    // Add padding if needed
    str += '='.repeat((4 - str.length % 4) % 4);
    // Replace URL-safe characters
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(str)));
  }
}

export interface AuthToken {
  token: string;
  userId: string;
  expiresAt: number;
  scope?: string[];
}

export interface UniversalLinkHandler {
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

export class UniversalLinkManager {
  private static instance: UniversalLinkManager;
  private handlers: Map<string, UniversalLinkHandler> = new Map();
  private isAuthenticated: boolean = false;
  private onTokenAuthenticate?: (token: AuthToken, params?: any) => Promise<boolean>;
  private pendingDeepLink?: string;
  private navigationReady: boolean = false;
  
  static getInstance(): UniversalLinkManager {
    if (!UniversalLinkManager.instance) {
      UniversalLinkManager.instance = new UniversalLinkManager();
    }
    return UniversalLinkManager.instance;
  }

  // Set navigation ready state
  setNavigationReady(ready: boolean) {
    this.navigationReady = ready;
  }

  // Safe navigation with retry logic
  private safeNavigate(route: string, maxRetries = 3, retryDelay = 1000): Promise<void> {
    return new Promise((resolve, reject) => {
      const attemptNavigation = (attempt: number) => {
        if (!this.navigationReady && attempt === 1) {
          setTimeout(() => attemptNavigation(attempt + 1), retryDelay);
          return;
        }

        try {
          router.push(route as any);
          resolve();
        } catch {
          if (attempt < maxRetries) {
            setTimeout(() => attemptNavigation(attempt + 1), retryDelay);
          } else {
            // Final fallback - try to go to home
            try {
              router.replace('/');
              resolve();
            } catch (fallbackError) {
              reject(fallbackError);
            }
          }
        }
      };

      attemptNavigation(1);
    });
  }

  // Set the token authentication callback
  setTokenAuthenticator(callback: (token: AuthToken, params?: any) => Promise<boolean>) {
    this.onTokenAuthenticate = callback;
  }

  // Initialize the Universal Link system
  initialize() {
    this.registerDefaultHandlers();
    this.setupLinkingListener();
    this.handleInitialURL();
  }
  
  // Update authentication status
  setAuthenticationStatus(isAuthenticated: boolean) {
    this.isAuthenticated = isAuthenticated;
  }

  // Register a new Universal Link handler
  registerHandler(pattern: string, handler: UniversalLinkHandler) {
    this.handlers.set(pattern, handler);
  }

  // Setup the listener for incoming Universal Links
  private setupLinkingListener() {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      this.handleUniversalLink({ url });
    });
    return subscription;
  }

  // Handle initial URL when app is opened via Universal Link
  private async handleInitialURL() {
    try {
      const initialURL = await Linking.getInitialURL();
      if (initialURL) {
        setTimeout(() => this.handleUniversalLink({ url: initialURL }), 1000);
      }
    } catch (error) {
      console.warn('Error handling initial URL:', error);
    }
  }

  // Main Universal Link handler
  private async handleUniversalLink({ url }: { url: string }) {
    try {
      const parsed = await this.parseURL(url);
      if (!parsed) {
        console.warn('Could not parse Universal Link:', url);
        return;
      }

      const { action, params, authToken } = parsed;
      
      const handler = this.handlers.get(action);

      if (!handler) {
        console.warn('No handler found for action:', action);
        this.showUniversalLinkError(`Unknown action: ${action}`);
        return;
      }

      // Handle token authentication first if present
      if (authToken) {
        if (!handler.allowsTokenAuth) {
          console.warn('Token authentication not allowed for action:', action);
          this.showUniversalLinkError('Token authentication not supported for this action');
          return;
        }

        if (!this.onTokenAuthenticate) {
          console.warn('Token authenticator not set');
          this.showUniversalLinkError('Token authentication not configured');
          return;
        }

        // Validate token
        if (!this.isTokenValid(authToken)) {
          console.warn('Invalid or expired token');
          this.showUniversalLinkError('Authentication token is invalid or expired');
          return;
        }

        // Attempt token authentication
        try {
          // Pass parameters to token authenticator for Universal Link context
          const authParams = {
            ...params,
            originalUrl: url
          };
          const authSuccess = await this.onTokenAuthenticate(authToken, authParams);
          if (!authSuccess) {
            console.warn('❌ Token authentication failed');
            this.showUniversalLinkError('Authentication failed');
            return;
          }
          // Update authentication status
          this.setAuthenticationStatus(true);
        } catch (err) {
          console.error('Token authentication error:', err);
          this.showUniversalLinkError('Authentication error occurred');
          return;
        }
      }

      // Check authentication requirement
      if (handler.requiresAuth && !this.isAuthenticated && !authToken) {
        console.warn('Authentication required for action:', action);
        this.handleAuthRequiredUniversalLink(url);
        return;
      }

      // Execute the handler
      
      // Wait for navigation to be ready before executing handler
      if (!this.navigationReady) {
        const maxWaitTime = 5000; // 5 seconds max wait
        const startTime = Date.now();
        
        while (!this.navigationReady && (Date.now() - startTime) < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Check every 100ms
        }
      }

      try {
        await handler.handler(params, authToken);
      } catch (handlerError) {
        console.error(`Handler execution failed for action: ${action}`, handlerError);
        this.showUniversalLinkError('Error processing Universal Link');
      }

    } catch (error) {
      console.error('❌ Error handling Universal Link:', error);
      this.showUniversalLinkError('Invalid link format');
    }
  }

  // Parse the incoming URL
  private async parseURL(url: string): Promise<ParsedURL | null> {
    try {
      console.log('=== PARSE URL START ===');
      console.log('🔍 Parsing incoming URL:', url);
      console.log('📍 Current environment:', ENV_CONFIG.UNIVERSAL_LINK_HOST);
      console.log('📱 Platform:', Platform.OS);
      
      // Handle both custom scheme and universal links
      let cleanURL = url;
      let sourceType = 'unknown';
      
      // Support all possible Universal Link hosts (environment-agnostic)
      const universalLinkHosts = [
        'eclaims.deactech.com',
        'staging-eclaims.deactech.com',
        'dev-eclaims.deactech.com'
      ];
      
      let foundUniversalLink = false;
      for (const host of universalLinkHosts) {
        const prefix = `https://${host}/`;
        if (url.startsWith(prefix)) {
          cleanURL = url.replace(prefix, '');
          sourceType = `Universal Link (${host})`;
          console.log(`✅ Detected Universal Link from ${host}, cleaned to:`, cleanURL);
          foundUniversalLink = true;
          break;
        }
      }
      
      if (!foundUniversalLink) {
        console.warn('⚠️ URL is not a supported Universal Link:', url);
        console.log('Expected Universal Link hosts:', universalLinkHosts);
        console.log('Note: Custom schemes are no longer supported, use Universal Links only');
        return { action: 'home', params: {}, authToken: undefined };
      }

      // Universal Links should be clean at this point
      console.log('✅ Processing Universal Link:', cleanURL);

      // Split URL and query parameters
      const [pathPart, queryPart] = cleanURL.split('?');
      const parts = pathPart.split('/').filter(part => part.length > 0);
      
      console.log('URL components:', { 
        sourceType, 
        pathPart, 
        queryPartsCount: queryPart ? new URLSearchParams(queryPart).size : 0,
        urlParts: parts
      });
      
      if (parts.length === 0) {
        console.log('📍 No URL parts found, defaulting to home action');
        const authToken = await this.parseAuthToken(queryPart);
        return { action: 'home', params: {}, authToken };
      }

      const action = parts[0];
      console.log('🎯 Extracted action:', action);
      console.log('📝 All URL parts:', parts);
      console.log('📝 Original URL:', url);
      console.log('📝 Cleaned URL:', cleanURL);
      
      // Validate action is one of the supported actions
      const validActions = ['home', 'vehicles', 'vehicle', 'add-vehicle', 'damage', 'camera', 'statement', 'statements', 'new-statement', 'emergency', 'settings', 'login'];
      
      // Special case: if action is the scheme name, it means URL parsing failed
      if (action === 'porscheeclaims' || action.includes('porscheeclaims')) {
        console.error(`Action contains scheme name: "${action}". This indicates URL parsing issue.`);
        
        // Try to recover by looking for valid action in the parts
        const validActionInParts = parts.find(part => validActions.includes(part));
        if (validActionInParts) {
          return await this.parseURL(url.replace(action + '/', ''));
        }
        
        // Fallback to vehicles if this looks like a vehicle-related URL
        if (url.includes('vehicleData') || url.includes('/vehicles')) {
          const authToken = await this.parseAuthToken(queryPart);
          return { action: 'vehicles', params: {}, authToken };
        }
        
        // Final fallback to home
        const authToken = await this.parseAuthToken(queryPart);
        return { action: 'home', params: {}, authToken };
      }
      
      if (!validActions.includes(action)) {
        console.error(`Invalid action: "${action}". Valid actions are:`, validActions);
        return { action: 'home', params: {}, authToken: undefined }; // Fallback to home
      }

      const params: any = {};
      let authToken: AuthToken | undefined;

      // Parse query parameters for token and other data
      if (queryPart) {
        const queryParams = new URLSearchParams(queryPart);
        
        // Extract authentication token
        const tokenString = queryParams.get('token');
        if (tokenString) {
          authToken = await this.parseAuthToken(tokenString);
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
      } else {
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
    
    console.log('🔐 Parsing authentication token...');
    
    try {
      // Try Firebase JWT first (if it looks like a JWT)
      if (tokenString.includes('.') && tokenString.split('.').length === 3) {
        console.log('🔍 Attempting to parse as Firebase JWT...');
        const firebaseResult = await FirebaseJWTVerifier.verifyFirebaseJWT(tokenString);
        
        if (firebaseResult) {
          console.log('✅ Successfully parsed Firebase JWT');
          return {
            token: tokenString,
            userId: firebaseResult.user_id || firebaseResult.sub || '',
            expiresAt: firebaseResult.exp * 1000, // Convert to milliseconds
            scope: firebaseResult.scope ? firebaseResult.scope.split(' ') : undefined
          };
        }
        
        console.log('⚠️ Not a Firebase JWT, trying secure JWT...');
      }
      
      // Try secure JWT parsing 
      try {
        const { secureJWT } = await import('./secure-communication');
        const secureResult = secureJWT.verifyToken(tokenString);
        if (secureResult) {
          console.log('✅ Successfully parsed secure encrypted JWT');
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
      
      // Handle legacy JWT-like tokens (basic JWT parsing)
      if (tokenString.includes('.')) {
        const parts = tokenString.split('.');
        if (parts.length === 3) {
          console.log('🔍 Attempting legacy JWT parsing...');
          try {
            const payload = JSON.parse(atob(parts[1]));
            return {
              token: tokenString,
              userId: payload.sub || payload.userId || '',
              expiresAt: (payload.exp || 0) * 1000, // Convert to milliseconds
              scope: payload.scope ? payload.scope.split(' ') : undefined
            };
          } catch (jwtError) {
            console.warn('Legacy JWT parsing failed:', jwtError);
          }
        }
      }
      
      // Try to parse as JSON with Base64URL decoding first, then fallback to standard Base64
      let parsed;
      try {
        // Try Base64URL decode first (new URL-safe format)
        const { Base64URL } = await import('./secure-communication');
        if (Base64URL.isValid(tokenString)) {
          const decoded = Base64URL.decode(tokenString);
          parsed = JSON.parse(decoded);
        } else {
          // Fallback to standard Base64
          parsed = JSON.parse(atob(tokenString));
        }
      } catch {
        // Fallback to standard Base64
        parsed = JSON.parse(atob(tokenString));
      }
      
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
      pattern: 'https://*/home',
      handler: () => router.replace('/'),
      requiresAuth: true,
      allowsTokenAuth: true,
      description: 'Navigate to home screen'
    });

    // New Statement
    this.registerHandler('new-statement', {
      pattern: 'https://*/new-statement',
      handler: () => setTimeout(() => router.push('/(main)/statements/new'), 2000),
      requiresAuth: true,
      allowsTokenAuth: true,
      description: 'Start a new insurance statement'
    });

    // View Statement
    this.registerHandler('statement', {
pattern: 'https://*/statement/:id',
      handler: (params, authToken) => {
        if (params.statementId) {
          const mode = params.mode || 'view';
          // Pass token context if available
          if (authToken) {
            console.log('Accessing statement with authenticated token for user:', authToken.userId);
          }
          // Add delay to ensure Root Layout is fully mounted
          setTimeout(() => {
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
          }, 2000);
        }
      },
      requiresAuth: true,
      description: 'View or edit an insurance statement'
    });

    // Vehicles
    this.registerHandler('vehicles', {
pattern: 'https://*/vehicles',
      handler: async (params, authToken) => {
        
        // Handle vehicle data from Universal Link - SMART VERSION  
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
              Alert.alert('Error', 'Unable to process vehicle data from Universal Link');
              return;
            }
            
            console.log('✅ Successfully decoded vehicle data from Universal Link');
            console.log('Vehicle details:', { 
              make: decodedVehicleData.make, 
              model: decodedVehicleData.model, 
              vin: decodedVehicleData.vin?.substring(0, 8) + '...',
              vehicleId: decodedVehicleData.vehicleId,
              licensePlate: decodedVehicleData.licensePlate
            });
            
            // Import the vehicles store
            console.log('🗃️ Importing vehicles store...');
            const { useVehiclesStore } = await import('@/stores/use-vehicles-store');
            const vehiclesStore = useVehiclesStore.getState();
            
            console.log('Current vehicles count:', vehiclesStore.vehicles.length);
            
            // Clear all existing vehicles (single vehicle mode)
            const currentVehicles = vehiclesStore.vehicles;
            console.log('🧹 Clearing existing vehicles:', currentVehicles.length);
            for (const vehicle of currentVehicles) {
              await vehiclesStore.removeVehicle(vehicle.id);
              console.log('Removed vehicle:', vehicle.make, vehicle.model);
            }
            
            // Add the new vehicle from Universal Link
            console.log('➕ Adding new vehicle from Universal Link...');
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
            
            console.log('Vehicle to add:', JSON.stringify(newVehicle, null, 2));
            await vehiclesStore.addVehicle(newVehicle);
            console.log('✅ Vehicle added successfully');
            
            // Get the newly created vehicle to get the actual ID
            const updatedVehicles = vehiclesStore.vehicles;
            const addedVehicle = updatedVehicles[updatedVehicles.length - 1];
            
            // Set Universal Link context for vehicle restriction
            const { useUserStore } = await import('@/stores/use-user-store');
            const userStore = useUserStore.getState();
            
            const contextData = {
              hasVehicleRestriction: true,
              allowedVehicleId: addedVehicle?.id,
              originalUrl: params.originalUrl || '',
              vehicleData: decodedVehicleData
            };
            
            userStore.setUniversalLinkContext(contextData);
            console.log('🚗 === VEHICLES HANDLER END ===');
            
          } catch (error: any) {
            console.error('Error in vehicles handler:', error);
            Alert.alert('Error', `Failed to process vehicle data: ${error?.message || 'Unknown error'}`);
            return;
          }
        } else {
          // No vehicle data parameter found, showing regular vehicles screen
        }
        
        // Navigate to vehicles page
        if (authToken) {
          console.log('Accessing vehicles with authenticated token for user:', authToken.userId);
        }
        
        console.log('🚀 Navigating to vehicles...');
        
        // Add delay to ensure Root Layout is fully mounted
        console.log('⏳ Preparing to navigate to vehicles...');
        this.safeNavigate('/vehicles').catch((error) => {
          console.error('❌ Vehicles navigation failed completely:', error);
          // Try absolute path as final fallback
          this.safeNavigate('/(main)/vehicles').catch((finalError) => {
            console.error('❌ All vehicles navigation attempts failed:', finalError);
          });
        });
      },
      requiresAuth: false, // Allow access with token auth even without login
      allowsTokenAuth: true,
      description: 'View vehicles list (with potential restrictions from token)'
    });

    // Vehicle Details
    this.registerHandler('vehicle', {
pattern: 'https://*/vehicle/:id',
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
pattern: 'https://*/add-vehicle',
      handler: () => {
        const targetRoute = '/(main)/vehicles/add';
        console.log('🚀 Navigating to add vehicle route:', targetRoute);
        try {
          router.push(targetRoute);
          console.log('✅ Navigation successful to:', targetRoute);
        } catch (error) {
          console.error('❌ Add vehicle navigation failed:', error);
          // Try fallback
          router.push('/vehicles/add');
        }
      },
      requiresAuth: true,
      description: 'Add a new vehicle'
    });

    // Damage Assessment
    this.registerHandler('damage', {
pattern: 'https://*/damage',
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
              
              // Set Universal Link context to indicate vehicle restriction
              userStore.setUniversalLinkContext({
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
pattern: 'https://*/camera/:type',
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
pattern: 'https://*/emergency',
      handler: () => router.push('/(main)/emergency'),
      requiresAuth: false, // Emergency should be accessible without auth
      description: 'Access emergency contacts'
    });

    // Settings
    this.registerHandler('settings', {
pattern: 'https://*/settings',
      handler: () => router.push('/(main)/settings'),
      requiresAuth: true,
      description: 'Open app settings'
    });

    // Login
    this.registerHandler('login', {
pattern: 'https://*/login',
      handler: () => router.replace('/(auth)/login'),
      requiresAuth: false,
      description: 'Navigate to login screen'
    });
  }

  // Handle Universal Links that require authentication
  private handleAuthRequiredUniversalLink(url: string) {
    Alert.alert(
      'Login Required',
      'Please log in to access this feature.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Login',
          onPress: () => {
            // Store the pending Universal Link to handle after login
            this.storePendingUniversalLink(url);
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  }

  // Store Universal Link to handle after authentication
  private storePendingUniversalLink(url: string) {
    // You could use AsyncStorage here to persist across app restarts
    // For now, we'll use a simple property
    this.pendingDeepLink = url;
  }

  // Show error for invalid deeplinks
  private showUniversalLinkError(message: string) {
    Alert.alert(
      'Invalid Link',
      message,
      [
        { text: 'OK', onPress: () => router.push('/') }
      ]
    );
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
    
    return this.generateUniversalLink(action, params, authToken);
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
  getRegisteredHandlers(): UniversalLinkHandler[] {
    return Array.from(this.handlers.values());
  }

  // Handle pending deeplink after authentication
  handlePendingDeepLink() {
    if (this.pendingDeepLink && this.isAuthenticated) {
      console.log('🔄 Processing pending deeplink after authentication');
      this.handleUniversalLink({ url: this.pendingDeepLink });
      this.pendingDeepLink = undefined;
    }
  }

  // Generate deeplink (alias for generateUniversalLink)
  static generateDeepLink(action: string, params?: Record<string, string>, authToken?: string): string {
    return this.generateUniversalLink(action, params, authToken);
  }
}

// Export singleton instance and initialize immediately
export const universalLinkManager = UniversalLinkManager.getInstance();
// Initialize the manager immediately when module loads
universalLinkManager.initialize();
export const deepLinkManager = universalLinkManager;

// Export helper functions
export const generateUniversalLink = UniversalLinkManager.generateUniversalLink;
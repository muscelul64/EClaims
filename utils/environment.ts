// Environment configuration for Porsche E-Claims
// This file manages different environment settings

export type Environment = 'development' | 'staging' | 'production';

// Detect environment based on build configuration
const getEnvironment = (): Environment => {
  // In development builds
  if (__DEV__) {
    return 'development';
  }
  
  // For production builds, check if we're in staging or production
  // This can be overridden with environment variables or build settings
  return process.env.EXPO_PUBLIC_ENVIRONMENT as Environment || 'production';
};

export const ENVIRONMENT = getEnvironment();

// Environment-specific configuration
export const CONFIG = {
  development: {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL_DEV || 'https://api-dev.eclaims.porsche.com',
    MASTER_APP_SCHEME: process.env.EXPO_PUBLIC_MASTER_APP_SCHEME_DEV || 'porsche-master-app-dev',
    APP_SCHEME: process.env.EXPO_PUBLIC_APP_SCHEME_DEV || 'porscheeclaims-dev',
    UNIVERSAL_LINK_HOST: process.env.EXPO_PUBLIC_UNIVERSAL_LINK_HOST_DEV || 'dev-eclaims.porsche.com',
    ENABLE_LOGGING: process.env.EXPO_PUBLIC_ENABLE_CONSOLE_LOGGING !== 'false',
    DEBUG_MODE: process.env.EXPO_PUBLIC_ENABLE_DEVELOPER_MENU !== 'false',
    NETWORK_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_NETWORK_TIMEOUT || '45000'),
  },
  staging: {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL_STAGING || 'https://api-staging.eclaims.porsche.com',
    MASTER_APP_SCHEME: process.env.EXPO_PUBLIC_MASTER_APP_SCHEME_STAGING || 'porsche-master-app-staging',
    APP_SCHEME: process.env.EXPO_PUBLIC_APP_SCHEME_STAGING || 'porscheeclaims-staging',
    UNIVERSAL_LINK_HOST: process.env.EXPO_PUBLIC_UNIVERSAL_LINK_HOST_STAGING || 'staging-eclaims.porsche.com',
    ENABLE_LOGGING: process.env.EXPO_PUBLIC_ENABLE_CONSOLE_LOGGING === 'true',
    DEBUG_MODE: false,
    NETWORK_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_NETWORK_TIMEOUT || '35000'),
  },
  production: {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL_PROD || 'https://api.eclaims.porsche.com',
    MASTER_APP_SCHEME: process.env.EXPO_PUBLIC_MASTER_APP_SCHEME_PROD || 'porsche-master-app',
    APP_SCHEME: process.env.EXPO_PUBLIC_APP_SCHEME_PROD || 'porscheeclaims',
    UNIVERSAL_LINK_HOST: process.env.EXPO_PUBLIC_UNIVERSAL_LINK_HOST_PROD || 'eclaims.porsche.com',
    ENABLE_LOGGING: false,
    DEBUG_MODE: false,
    NETWORK_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_NETWORK_TIMEOUT || '30000'),
  }
};

// Current environment configuration
export const ENV_CONFIG = CONFIG[ENVIRONMENT];

// Utility functions
export const isDevelopment = () => ENVIRONMENT === 'development';
export const isStaging = () => ENVIRONMENT === 'staging';
export const isProduction = () => ENVIRONMENT === 'production';

// Logging utility that respects environment
export const log = {
  debug: (...args: any[]) => {
    if (ENV_CONFIG.ENABLE_LOGGING) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (ENV_CONFIG.ENABLE_LOGGING) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (ENV_CONFIG.ENABLE_LOGGING) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors regardless of environment
    console.error('[ERROR]', ...args);
  }
};

// Export current environment info
export const ENV_INFO = {
  environment: ENVIRONMENT,
  apiUrl: ENV_CONFIG.API_BASE_URL,
  debugMode: ENV_CONFIG.DEBUG_MODE,
  loggingEnabled: ENV_CONFIG.ENABLE_LOGGING,
} as const;
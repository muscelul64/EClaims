import CryptoJS from 'crypto-js';
import { Alert } from 'react-native';

/**
 * Secure Communication Utility
 * Handles encryption/decryption for sensitive data in deeplinks
 */

export interface EncryptionConfig {
  sharedSecret: string;
  algorithm: string;
  keySize: number;
}

export interface SecurePayload {
  data: string;
  iv: string;
  timestamp: number;
  signature: string;
}

/**
 * Base64URL encoding utilities for URL-safe transmission
 * Base64URL replaces + with -, / with _, and removes padding =
 */
export class Base64URL {
  /**
   * Encode data to Base64URL format (URL-safe, no padding)
   */
  static encode(data: string): string {
    const base64 = btoa(data);
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, ''); // Remove padding
  }

  /**
   * Decode Base64URL format back to original data
   */
  static decode(data: string): string {
    // Restore standard Base64 format
    let base64 = data
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    return atob(base64);
  }

  /**
   * Check if string is valid Base64URL format
   */
  static isValid(data: string): boolean {
    return /^[A-Za-z0-9\-_]*$/.test(data);
  }
}

export class SecureCommunication {
  private static instance: SecureCommunication;
  public config: EncryptionConfig;

  constructor(config?: Partial<EncryptionConfig>) {
    this.config = {
      sharedSecret: process.env.EXPO_PUBLIC_SHARED_SECRET || 'porsche-eclaims-default-key-2026',
      algorithm: 'AES',
      keySize: 256,
      ...config
    };
  }

  static getInstance(config?: Partial<EncryptionConfig>): SecureCommunication {
    if (!SecureCommunication.instance) {
      SecureCommunication.instance = new SecureCommunication(config);
    }
    return SecureCommunication.instance;
  }

  /**
   * Encrypt sensitive data for transmission
   */
  encryptData(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      const timestamp = Date.now();
      
      // Generate random IV for each encryption
      const iv = CryptoJS.lib.WordArray.random(16);
      
      // Create encryption key from shared secret
      const key = CryptoJS.PBKDF2(this.config.sharedSecret, iv, {
        keySize: this.config.keySize / 32,
        iterations: 1000
      });
      
      // Encrypt the data
      const encrypted = CryptoJS.AES.encrypt(jsonString, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      // Create signature to prevent tampering
      const signature = this.createSignature(encrypted.toString(), timestamp);
      
      // Package everything together
      const payload: SecurePayload = {
        data: encrypted.toString(),
        iv: iv.toString(CryptoJS.enc.Base64),
        timestamp,
        signature
      };
      
      // Encode as Base64URL for URL safety (no padding issues)
      return Base64URL.encode(JSON.stringify(payload));
      
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt received data
   */
  decryptData<T = any>(encryptedData: string): T {
    try {
      // Try Base64URL decode first, fallback to standard Base64
      let payload: SecurePayload;
      try {
        payload = JSON.parse(Base64URL.decode(encryptedData));
      } catch {
        // Fallback to standard Base64 for backward compatibility
        payload = JSON.parse(atob(encryptedData));
      }
      
      // Validate timestamp (reject old data)
      const maxAge = 5 * 60 * 1000; // 5 minutes
      if (Date.now() - payload.timestamp > maxAge) {
        throw new Error('Data expired');
      }
      
      // Verify signature
      const expectedSignature = this.createSignature(payload.data, payload.timestamp);
      if (payload.signature !== expectedSignature) {
        throw new Error('Data integrity check failed');
      }
      
      // Recreate key from shared secret and IV
      const iv = CryptoJS.enc.Base64.parse(payload.iv);
      const key = CryptoJS.PBKDF2(this.config.sharedSecret, iv, {
        keySize: this.config.keySize / 32,
        iterations: 1000
      });
      
      // Decrypt the data
      const decrypted = CryptoJS.AES.decrypt(payload.data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Decryption failed');
      }
      
      return JSON.parse(decryptedString);
      
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Create authentication token with encryption
   */
  createSecureAuthToken(tokenData: any, expirationMinutes: number = 60): string {
    const authData = {
      ...tokenData,
      expiresAt: Date.now() + (expirationMinutes * 60 * 1000),
      issuedAt: Date.now(),
      nonce: CryptoJS.lib.WordArray.random(8).toString()
    };
    
    return this.encryptData(authData);
  }

  /**
   * Validate and decrypt authentication token
   */
  validateSecureAuthToken(encryptedToken: string): any {
    try {
      const tokenData = this.decryptData(encryptedToken);
      
      // Check expiration
      if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
        throw new Error('Token expired');
      }
      
      return tokenData;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }

  /**
   * Create HMAC signature for data integrity
   */
  private createSignature(data: string, timestamp: number): string {
    const message = `${data}:${timestamp}`;
    return CryptoJS.HmacSHA256(message, this.config.sharedSecret).toString();
  }

  /**
   * Secure vehicle data for deeplink
   */
  secureVehicleData(vehicleData: any): string {
    return this.encryptData({
      vehicleData,
      source: 'master-app',
      version: '1.0'
    });
  }

  /**
   * Check if data appears to be encrypted (vs legacy base64)
   */
  isEncryptedData(data: string): boolean {
    try {
      // Try to parse as encrypted payload structure
      const decoded = JSON.parse(atob(data));
      return decoded.data && decoded.iv && decoded.timestamp && decoded.signature;
    } catch {
      return false;
    }
  }

  /**
   * Smart vehicle data extraction with automatic format detection
   */
  smartExtractVehicleData(data: string): any {
    // First, check if it's encrypted data
    if (this.isEncryptedData(data)) {
      console.log('Detected encrypted vehicle data');
      try {
        return this.extractVehicleData(data);
      } catch (error) {
        console.warn('Encrypted data extraction failed:', error);
        return null;
      }
    } else {
      // Try Base64URL decoding first (new URL-safe format)
      console.log('Attempting Base64URL vehicle data decoding');
      if (Base64URL.isValid(data)) {
        try {
          const decoded = Base64URL.decode(data);
          return JSON.parse(decoded);
        } catch (error) {
          console.log('Base64URL decoding failed, trying standard Base64');
        }
      }
      
      // Fallback to legacy standard base64 decoding
      console.log('Attempting legacy base64 vehicle data decoding');
      try {
        return JSON.parse(atob(data));
      } catch (error) {
        console.error('All vehicle data decoding methods failed:', error);
        return null;
      }
    }
  }

  /**
   * Extract vehicle data from secure payload (silent mode for deeplink fallback)
   */
  extractVehicleData(secureData: string): any {
    try {
      const decrypted = this.decryptData(secureData);
      return decrypted.vehicleData;
    } catch (error) {
      console.error('Failed to extract vehicle data:', error);
      // Don't show Alert here - let the calling code handle the error
      return null;
    }
  }

  /**
   * Extract vehicle data from secure payload (with user notification)
   */
  extractVehicleDataWithAlert(secureData: string): any {
    try {
      const decrypted = this.decryptData(secureData);
      return decrypted.vehicleData;
    } catch (error) {
      console.error('Failed to extract vehicle data:', error);
      Alert.alert('Security Error', 'Unable to process vehicle data securely');
      return null;
    }
  }

  /**
   * Encode vehicle data in Base64URL format for URL-safe transmission
   * This avoids the query parameter parsing issues with standard Base64 padding
   */
  encodeVehicleDataForURL(vehicleData: any): string {
    const jsonString = JSON.stringify(vehicleData);
    return Base64URL.encode(jsonString);
  }

  /**
   * Legacy Base64URL vehicle data encoding (maintains URL safety)
   * @deprecated Use encodeVehicleDataForURL for new implementations
   */
  legacyEncodeVehicleData(vehicleData: any): string {
    const jsonString = JSON.stringify(vehicleData);
    return Base64URL.encode(jsonString);
  }

  /**
   * Legacy Base64URL vehicle data decoding (URL-safe fallback)
   * @deprecated Use smartExtractVehicleData for new implementations
   */
  legacyDecodeVehicleData(encodedData: string): any {
    try {
      if (Base64URL.isValid(encodedData)) {
        const decoded = Base64URL.decode(encodedData);
        return JSON.parse(decoded);
      } else {
        // Still fallback to standard Base64 for very old data
        return JSON.parse(atob(encodedData));
      }
    } catch (error) {
      console.error('Legacy vehicle data decoding failed:', error);
      return null;
    }
  }

  /**
   * Legacy Base64URL auth token creation (URL-safe)
   * @deprecated Use createSecureAuthToken for new implementations
   */
  legacyCreateAuthToken(tokenData: any): string {
    const timestamp = Date.now();
    const authPayload = {
      ...tokenData,
      timestamp,
      nonce: Math.random().toString(36).substring(2, 15)
    };
    const jsonString = JSON.stringify(authPayload);
    return Base64URL.encode(jsonString);
  }

  /**
   * Legacy Base64URL auth token validation (URL-safe)
   * @deprecated Use validateSecureAuthToken for new implementations
   */
  legacyValidateAuthToken(encodedToken: string): any {
    try {
      if (Base64URL.isValid(encodedToken)) {
        const decoded = Base64URL.decode(encodedToken);
        return JSON.parse(decoded);
      } else {
        // Fallback to standard Base64 for very old tokens
        return JSON.parse(atob(encodedToken));
      }
    } catch (error) {
      console.error('Legacy auth token validation failed:', error);
      return null;
    }
  }

  /**
   * Create a URL-safe vehicle data parameter string
   */
  createVehicleDataParam(vehicleData: any, useEncryption: boolean = false): string {
    if (useEncryption) {
      // Use encrypted format with Base64URL encoding
      const encryptedData = this.encryptData({ vehicleData });
      return `secureData=${encodeURIComponent(encryptedData)}`;
    } else {
      // Use Base64URL format to avoid padding issues
      const urlSafeData = this.encodeVehicleDataForURL(vehicleData);
      return `vehicleData=${encodeURIComponent(urlSafeData)}`;
    }
  }
}

/**
 * JWT-style token handling with encryption
 */
export class SecureJWTManager {
  private secureCom: SecureCommunication;

  constructor(config?: Partial<EncryptionConfig>) {
    this.secureCom = new SecureCommunication(config);
  }

  /**
   * Create encrypted JWT-style token
   */
  createToken(payload: any, expirationHours: number = 24): string {
    const header = {
      alg: 'AES256',
      typ: 'SEJWT', // Secure Encrypted JWT
      created: Date.now()
    };

    const tokenPayload = {
      ...payload,
      exp: Date.now() + (expirationHours * 60 * 60 * 1000),
      iat: Date.now(),
      iss: 'porsche-eclaims'
    };

    // Encrypt both header and payload
    const encryptedHeader = this.secureCom.encryptData(header);
    const encryptedPayload = this.secureCom.encryptData(tokenPayload);

    // Create signature
    const signature = CryptoJS.HmacSHA256(
      `${encryptedHeader}.${encryptedPayload}`, 
      this.secureCom.config.sharedSecret
    ).toString();

    return `${encryptedHeader}.${encryptedPayload}.${signature}`;
  }

  /**
   * Verify and decrypt JWT-style token
   */
  verifyToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const [encryptedHeader, encryptedPayload, signature] = parts;

      // Verify signature
      const expectedSignature = CryptoJS.HmacSHA256(
        `${encryptedHeader}.${encryptedPayload}`, 
        this.secureCom.config.sharedSecret
      ).toString();

      if (signature !== expectedSignature) {
        throw new Error('Token signature verification failed');
      }

      // Decrypt and validate
      const header = this.secureCom.decryptData(encryptedHeader);
      const payload = this.secureCom.decryptData(encryptedPayload);

      if (payload.exp && Date.now() > payload.exp) {
        throw new Error('Token expired');
      }

      return { header, payload };
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }
}

// Export instances for easy use
export const secureCommunication = SecureCommunication.getInstance();
export const secureJWT = new SecureJWTManager();

// Helper functions for easy integration
export const encryptForDeeplink = (data: any): string => secureCommunication.encryptData(data);
export const decryptFromDeeplink = <T = any>(data: string): T => secureCommunication.decryptData<T>(data);
export const createSecureToken = (payload: any): string => secureJWT.createToken(payload);
export const verifySecureToken = (token: string): any => secureJWT.verifyToken(token);

// Legacy Base64URL helper functions (URL-safe, no padding conflicts)
export const legacyEncodeVehicleData = (vehicleData: any): string => secureCommunication.legacyEncodeVehicleData(vehicleData);
export const legacyDecodeVehicleData = (encodedData: string): any => secureCommunication.legacyDecodeVehicleData(encodedData);
export const legacyCreateAuthToken = (tokenData: any): string => secureCommunication.legacyCreateAuthToken(tokenData);
export const legacyValidateAuthToken = (encodedToken: string): any => secureCommunication.legacyValidateAuthToken(encodedToken);
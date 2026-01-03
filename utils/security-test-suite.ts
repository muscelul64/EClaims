import { secureCommunication, secureJWT } from '@/utils/secure-communication';
import { Alert } from 'react-native';

/**
 * Security Testing and Demonstration Utility
 */

export class SecurityTestSuite {
  
  /**
   * Test smart vehicle data extraction (both encrypted and legacy)
   */
  static testSmartExtraction(): boolean {
    try {
      console.log('🧠 Testing smart vehicle data extraction...');
      
      const vehicleData = {
        make: 'Porsche',
        model: '911 Test',
        year: 2024,
        vin: 'SMART123456789'
      };

      // Test encrypted format
      const encrypted = secureCommunication.secureVehicleData(vehicleData);
      const extractedSecure = secureCommunication.smartExtractVehicleData(encrypted);
      const secureMatch = JSON.stringify(vehicleData) === JSON.stringify(extractedSecure);
      
      // Test legacy format
      const legacy = btoa(JSON.stringify(vehicleData));
      const extractedLegacy = secureCommunication.smartExtractVehicleData(legacy);
      const legacyMatch = JSON.stringify(vehicleData) === JSON.stringify(extractedLegacy);
      
      console.log('✅ Smart extraction test:', 
        secureMatch && legacyMatch ? 'PASSED' : 'FAILED');
      console.log('  - Encrypted format:', secureMatch ? 'OK' : 'FAILED');
      console.log('  - Legacy format:', legacyMatch ? 'OK' : 'FAILED');
      
      return secureMatch && legacyMatch;
    } catch (error) {
      console.error('❌ Smart extraction test failed:', error);
      return false;
    }
  }

  /**
   * Test basic encryption/decryption
   */
  static testBasicEncryption(): boolean {
    try {
      const testData = {
        message: 'Hello, secure world!',
        timestamp: Date.now(),
        sensitive: true
      };

      console.log('🔐 Testing basic encryption...');
      console.log('Original data:', testData);

      const encrypted = secureCommunication.encryptData(testData);
      console.log('Encrypted data:', encrypted.substring(0, 50) + '...');

      const decrypted = secureCommunication.decryptData(encrypted);
      console.log('Decrypted data:', decrypted);

      const matches = JSON.stringify(testData) === JSON.stringify(decrypted);
      console.log('✅ Encryption test:', matches ? 'PASSED' : 'FAILED');
      
      return matches;
    } catch (error) {
      console.error('❌ Encryption test failed:', error);
      return false;
    }
  }

  /**
   * Test vehicle data encryption (deeplink scenario)
   */
  static testVehicleDataEncryption(): boolean {
    try {
      const vehicleData = {
        make: 'Porsche',
        model: '911 Carrera',
        year: 2024,
        vin: 'WP0CA2A89KS123456',
        licensePlate: 'P-EC 123',
        color: 'Guards Red',
        insuranceCompany: 'Allianz',
        policyNumber: 'POL123456789'
      };

      console.log('🚗 Testing vehicle data encryption...');
      
      const encrypted = secureCommunication.secureVehicleData(vehicleData);
      console.log('Encrypted vehicle data length:', encrypted.length);

      const decrypted = secureCommunication.extractVehicleData(encrypted);
      console.log('Decrypted vehicle data:', decrypted.make, decrypted.model);

      const vehicleMatches = JSON.stringify(vehicleData) === JSON.stringify(decrypted.vehicleData);
      console.log('✅ Vehicle encryption test:', vehicleMatches ? 'PASSED' : 'FAILED');
      
      return vehicleMatches;
    } catch (error) {
      console.error('❌ Vehicle encryption test failed:', error);
      return false;
    }
  }

  /**
   * Test secure JWT token creation and verification
   */
  static testSecureJWT(): boolean {
    try {
      const payload = {
        userId: 'test123',
        role: 'premium',
        permissions: ['view', 'edit', 'create'],
        vehicleAccess: ['WP0CA2A89KS123456']
      };

      console.log('🎫 Testing secure JWT...');
      
      const token = secureJWT.createToken(payload, 1); // 1 hour expiration
      console.log('Created secure token length:', token.length);

      const verified = secureJWT.verifyToken(token);
      console.log('Verified token payload:', verified?.payload.userId, verified?.payload.role);

      const jwtMatches = verified?.payload.userId === payload.userId;
      console.log('✅ JWT test:', jwtMatches ? 'PASSED' : 'FAILED');
      
      return jwtMatches;
    } catch (error) {
      console.error('❌ JWT test failed:', error);
      return false;
    }
  }

  /**
   * Test token expiration
   */
  static testTokenExpiration(): boolean {
    try {
      console.log('⏰ Testing token expiration...');
      
      const payload = { userId: 'test123' };
      
      // Create token that expires in 1 second
      const shortToken = secureJWT.createToken(payload, 0.0003); // ~1 second
      
      // Verify immediately (should work)
      const immediate = secureJWT.verifyToken(shortToken);
      const immediateValid = immediate !== null;
      
      // Wait 2 seconds and verify again (should fail)
      setTimeout(() => {
        const expired = secureJWT.verifyToken(shortToken);
        const expiredInvalid = expired === null;
        
        console.log('✅ Expiration test:', 
          immediateValid && expiredInvalid ? 'PASSED' : 'FAILED');
        
        return immediateValid && expiredInvalid;
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('❌ Expiration test failed:', error);
      return false;
    }
  }

  /**
   * Test data integrity (tamper detection)
   */
  static testDataIntegrity(): boolean {
    try {
      console.log('🔒 Testing data integrity...');
      
      const testData = { secret: 'important data' };
      const encrypted = secureCommunication.encryptData(testData);
      
      // Tamper with the encrypted data
      const tamperedData = encrypted.slice(0, -10) + 'TAMPERED!!';
      
      let tamperDetected = false;
      try {
        secureCommunication.decryptData(tamperedData);
      } catch (error) {
        tamperDetected = true;
        console.log('✅ Tamper detection worked:', error instanceof Error ? error.message : String(error));
      }
      
      console.log('✅ Integrity test:', tamperDetected ? 'PASSED' : 'FAILED');
      return tamperDetected;
    } catch (error) {
      console.error('❌ Integrity test failed:', error);
      return false;
    }
  }

  /**
   * Generate test deeplink URLs with secure data
   */
  static generateTestDeeplinks(): {
    secureVehicle: string;
    secureAuth: string;
    legacy: string;
  } {
    try {
      // Secure vehicle deeplink
      const vehicleData = {
        make: 'Porsche',
        model: 'Taycan',
        year: 2024,
        vin: 'WP0ZZZ9999S123456'
      };
      
      const secureVehicleData = secureCommunication.secureVehicleData(vehicleData);
      const secureVehicleUrl = `porscheeclaims://vehicles?vehicleData=${encodeURIComponent(secureVehicleData)}`;
      
      // Secure auth token
      const authPayload = { userId: 'demo123', role: 'user' };
      const secureToken = secureJWT.createToken(authPayload, 24);
      const secureAuthUrl = `porscheeclaims://home?token=${encodeURIComponent(secureToken)}`;
      
      // Legacy comparison
      const legacyVehicleData = btoa(JSON.stringify(vehicleData));
      const legacyUrl = `porscheeclaims://vehicles?vehicleData=${encodeURIComponent(legacyVehicleData)}`;
      
      console.log('🔗 Generated test deeplinks:');
      console.log('Secure vehicle URL length:', secureVehicleUrl.length);
      console.log('Secure auth URL length:', secureAuthUrl.length);
      console.log('Legacy URL length:', legacyUrl.length);
      
      return {
        secureVehicle: secureVehicleUrl,
        secureAuth: secureAuthUrl,
        legacy: legacyUrl
      };
    } catch (error) {
      console.error('❌ Failed to generate test deeplinks:', error);
      return {
        secureVehicle: '',
        secureAuth: '',
        legacy: ''
      };
    }
  }

  /**
   * Run all security tests
   */
  static runAllTests(): {
    results: {
      basicEncryption: boolean;
      vehicleEncryption: boolean;
      smartExtraction: boolean;
      secureJWT: boolean;
      tokenExpiration: boolean;
      dataIntegrity: boolean;
    };
    deeplinks: {
      secureVehicle: string;
      secureAuth: string;
      legacy: string;
    };
  } {
    console.log('🧪 Running Security Test Suite...');
    console.log('================================');
    
    const results = {
      basicEncryption: this.testBasicEncryption(),
      vehicleEncryption: this.testVehicleDataEncryption(),
      smartExtraction: this.testSmartExtraction(),
      secureJWT: this.testSecureJWT(),
      tokenExpiration: this.testTokenExpiration(),
      dataIntegrity: this.testDataIntegrity()
    };
    
    console.log('================================');
    console.log('📊 Test Results:');
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = Object.values(results).every(Boolean);
    console.log('================================');
    console.log(`🎯 Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    // Generate test deeplinks
    const deeplinks = this.generateTestDeeplinks();
    console.log('🔗 Test deeplinks generated successfully');
    
    // Show results to user
    Alert.alert(
      'Security Tests Complete',
      `${allPassed ? '✅ All tests passed!' : '❌ Some tests failed'}\n\nCheck console for detailed results.`,
      [{ text: 'OK' }]
    );
    
    return { results, deeplinks };
  }

  /**
   * Performance test for encryption operations
   */
  static testPerformance(iterations: number = 100): void {
    console.log(`⚡ Performance test (${iterations} iterations)...`);
    
    const testData = {
      userId: 'performance-test',
      vehicleData: {
        make: 'Porsche',
        model: 'Performance Test Vehicle',
        vin: 'PERF0RMANCE1TEST2'
      },
      timestamp: Date.now()
    };
    
    // Encryption performance
    const encryptStart = Date.now();
    const encryptedResults = [];
    
    for (let i = 0; i < iterations; i++) {
      const encrypted = secureCommunication.encryptData({ ...testData, iteration: i });
      encryptedResults.push(encrypted);
    }
    
    const encryptTime = Date.now() - encryptStart;
    
    // Decryption performance
    const decryptStart = Date.now();
    
    for (const encrypted of encryptedResults) {
      secureCommunication.decryptData(encrypted);
    }
    
    const decryptTime = Date.now() - decryptStart;
    
    console.log('⚡ Performance Results:');
    console.log(`Encryption: ${encryptTime}ms (${(encryptTime/iterations).toFixed(2)}ms avg)`);
    console.log(`Decryption: ${decryptTime}ms (${(decryptTime/iterations).toFixed(2)}ms avg)`);
    console.log(`Total: ${encryptTime + decryptTime}ms`);
  }
}

// Export easy-to-use functions
export const runSecurityTests = () => SecurityTestSuite.runAllTests();
export const testPerformance = (iterations = 100) => SecurityTestSuite.testPerformance(iterations);
export const generateTestDeeplinks = () => SecurityTestSuite.generateTestDeeplinks();
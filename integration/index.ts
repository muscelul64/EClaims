/**
 * E-Claims Native Integration
 * 
 * This module provides native integration modules for embedding React Native E-Claims
 * into native Android (Kotlin) and iOS (Swift 5) applications.
 * 
 * Available Integration Modules:
 * 
 * Android (Kotlin):
 * - native/android/EClaimsAndroidModule.kt - Native module bridge
 * - native/android/EClaimsAndroidModule.ts - TypeScript interface
 * - native/android/KotlinImplementationExample.kt - Implementation example
 * 
 * iOS (Swift 5):
 * - native/ios/EClaimsIOSModule.swift - Native module bridge  
 * - native/ios/SwiftImplementationExample.swift - Implementation example
 * 
 * Documentation:
 * - native/README.md - Complete integration guide
 * 
 * For implementation instructions, see the README.md file in the native/ folder.
 */

// Re-export native module information for TypeScript support
export const NATIVE_MODULES = {
  android: {
    moduleName: 'EClaimsAndroidNative',
    bridgeFile: './native/android/EClaimsAndroidModule.kt',
    exampleFile: './native/android/KotlinImplementationExample.kt',
  },
  ios: {
    moduleName: 'EClaimsIOSNative', 
    bridgeFile: './native/ios/EClaimsIOSModule.swift',
    exampleFile: './native/ios/SwiftImplementationExample.swift',
  },
} as const;

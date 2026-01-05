# Platform Integration Guide

This directory contains platform-specific code for integrating with the Porsche E-Claims app from native iOS and Android master applications.

## Files

### iOS Integration
- **`PorscheEClaimsDeeplink.swift`** - Swift 5 implementation for iOS master app with Universal Links support
- **`README.md`** - Detailed iOS integration documentation

### Android Integration  
- **`SecureCommunication.kt`** - Kotlin implementation for Android master app with App Links support

## ⚙️ Environment Configuration

**IMPORTANT**: Both iOS and Android implementations support environment-specific configuration:

### Supported Environments:
- **Production**: `eclaims.deactech.com` / `porscheeclaims://`
- **Staging**: `staging-eclaims.deactech.com` / `porscheeclaims-staging://` 
- **Development**: `dev-eclaims.deactech.com` / `porscheeclaims-dev://`

### iOS Configuration
Update `UNIVERSAL_LINK_BASE` in `PorscheEClaimsDeeplink.swift`:
```swift
private static let UNIVERSAL_LINK_BASE = "https://eclaims.deactech.com"  // Production
// private static let UNIVERSAL_LINK_BASE = "https://staging-eclaims.deactech.com"  // Staging  
// private static let UNIVERSAL_LINK_BASE = "https://dev-eclaims.deactech.com"  // Development
```

### Android Configuration  
Use the Environment enum in `SecureCommunication.kt`:
```kotlin
// Production (default)
val secureCom = SecureCommunication(environment = SecureCommunication.Environment.PRODUCTION)

// Staging
val secureCom = SecureCommunication(environment = SecureCommunication.Environment.STAGING)

// Development  
val secureCom = SecureCommunication(environment = SecureCommunication.Environment.DEVELOPMENT)
```

## Features

Both implementations provide:
- **Universal Links/App Links** - Preferred integration method for better UX
- **Custom Scheme Fallback** - Backward compatibility support
- AES-256-CBC encryption for vehicle data
- PBKDF2 key derivation for enhanced security
- HMAC-SHA256 signatures for data integrity
- Secure authentication token creation
- Environment-aware URL generation

## Quick Start

### iOS (Swift 5) - Universal Links (Recommended)
```swift
// Create vehicle data
let vehicleData = PorscheEClaimsDeeplink.VehicleData(
    vehicleId: "vehicle123",
    vin: "WP0ZZZ99ZTS392124",
    make: "Porsche",
    model: "911 Carrera"
)

// Generate Universal Link (default behavior)
if let universalUrl = PorscheEClaimsDeeplink.generateVehicleDeeplink(
    vehicleData: vehicleData,
    useUniversalLink: true  // Default: true
) {
    PorscheEClaimsDeeplink.launchEClaims(url: universalUrl) { success in
        print("Launch success: \\(success)")
    }
}
```

### Android (Kotlin) - App Links (Recommended)
```kotlin
// Configure for your environment
val secureCom = SecureCommunication(
    environment = SecureCommunication.Environment.PRODUCTION
)

// Generate Universal Link (App Link)
val universalUrl = SecureCommunicationExtensions.run {
    secureCom.createPorscheVehicleDeeplink(
        model = "911 Carrera",
        year = 2024,
        vin = "WP0ZZZ99ZTS392124",
        userId = "user123",
        useUniversalLink = true  // Default: true
    )
}

// Launch with App Link
val intent = Intent(Intent.ACTION_VIEW, Uri.parse(universalUrl))
startActivity(intent)
```

### Legacy Custom Scheme Support
```kotlin
// Android - Custom Scheme Fallback
val customSchemeUrl = SecureCommunicationExtensions.run {
    secureCom.createPorscheVehicleDeeplink(
        model = "911 Carrera",
        year = 2024, 
        vin = "WP0ZZZ99ZTS392124",
        userId = "user123",
        useUniversalLink = false  // Force custom scheme
    )
}
```

## Security Configuration

Both implementations use the same shared secret as the React Native app:
- **Development**: `P0rsch3-ECl41ms-S3cur3-K3y-D3v3l0pm3nt-2026!@#`
- **Production**: Use environment-specific secure keys

## Dependencies

### iOS Requirements
- iOS 13.0+
- CryptoKit framework
- CommonCrypto framework

### Android Requirements
- Android API 21+ (Android 5.0)
- Standard Java/Kotlin cryptography libraries (included in Android SDK)

## Integration Steps

1. Copy the appropriate file to your master app project
2. Update the shared secret to match your environment
3. Use the convenience methods to create secure deeplinks
4. Handle app installation checks and error cases

The implementations are fully compatible with the security features in the Porsche E-Claims React Native app and provide seamless encrypted communication between native master apps and the E-Claims application.
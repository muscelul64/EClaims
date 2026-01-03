# Platform Integration Guide

This directory contains platform-specific code for integrating with the Porsche E-Claims app from native iOS and Android master applications.

## Files

### iOS Integration
- **`SecureCommunication.swift`** - Swift 5 implementation for iOS master app

### Android Integration  
- **`SecureCommunication.kt`** - Kotlin implementation for Android master app

## Features

Both implementations provide:
- AES-256-CBC encryption for vehicle data
- PBKDF2 key derivation for enhanced security
- HMAC-SHA256 signatures for data integrity
- Secure authentication token creation
- Deeplink URL generation with encrypted payloads

## Quick Start

### iOS (Swift 5)
```swift
let secureCom = SecureCommunication()

let deeplinkURL = try secureCom.createPorscheVehicleDeeplink(
    model: "911 Carrera",
    year: 2024,
    vin: "WP0CA2A89KS123456",
    userId: "user123"
)

UIApplication.shared.open(deeplinkURL)
```

### Android (Kotlin)
```kotlin
val secureCom = SecureCommunication()

val deeplinkUrl = SecureCommunicationExtensions.run {
    secureCom.createPorscheVehicleDeeplink(
        model = "911 Carrera",
        year = 2024,
        vin = "WP0CA2A89KS123456",
        userId = "user123"
    )
}

val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deeplinkUrl))
startActivity(intent)
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
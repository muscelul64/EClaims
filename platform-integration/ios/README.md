# iOS Deeplink Integration for Porsche E-Claims

This document explains how to integrate Porsche E-Claims deeplink functionality into your iOS master app.

## 📦 Installation

### Option 1: Add Swift File to Project
1. Copy `PorscheEClaimsDeeplink.swift` to your iOS project
2. Add to your target in Xcode
3. Import the required frameworks in your project:
   ```swift
   import Foundation
   import CryptoKit
   import UIKit
   import CommonCrypto
   ```

### Option 2: Swift Package Manager (if available)
```swift
dependencies: [
    .package(url: "https://github.com/porsche/eclaims-ios-integration", from: "1.0.0")
]
```

## 🚀 Quick Start

### 1. Basic Vehicle Deeplink

```swift
// Create vehicle data
let vehicleData = PorscheEClaimsDeeplink.VehicleData(
    vehicleId: "vehicle123",
    vin: "WP0ZIZzP3DD001234",
    make: "Porsche", 
    model: "911 Carrera"
)

// Generate deeplink
if let url = PorscheEClaimsDeeplink.generateVehicleDeeplink(
    vehicleData: vehicleData,
    useUniversalLink: true
) {
    // Launch E-Claims
    PorscheEClaimsDeeplink.launchEClaims(url: url) { success in
        print("Launch success: \\(success)")
    }
}
```

### 2. Secure Deeplink with Authentication

```swift
// Create authentication token
let authToken = PorscheEClaimsDeeplink.AuthToken(
    userId: "currentUserId",
    expiresAt: Date().addingTimeInterval(3600).timeIntervalSince1970, // 1 hour
    sessionId: "session123"
)

// Create detailed vehicle data
let vehicleData = PorscheEClaimsDeeplink.VehicleData(
    vehicleId: "vehicle123",
    vin: "WP0ZIZzP3DD001234",
    make: "Porsche",
    model: "911 Carrera",
    year: 2023,
    licensePlate: "ABC123",
    color: "Black",
    fuelType: "gasoline",
    insuranceCompany: "Porsche Insurance",
    policyNumber: "POL-2024-001234"
)

// Generate encrypted deeplink
if let url = PorscheEClaimsDeeplink.generateVehicleDeeplink(
    vehicleData: vehicleData,
    authToken: authToken,
    useUniversalLink: true,
    encrypt: true,
    encryptionKey: "your-256-bit-encryption-key"
) {
    PorscheEClaimsDeeplink.launchEClaims(url: url) { success in
        if success {
            print("✅ E-Claims launched with encrypted vehicle data")
        } else {
            print("❌ Failed to launch E-Claims")
        }
    }
}
```

### 3. Direct Damage Assessment

```swift
let authToken = PorscheEClaimsDeeplink.AuthToken(
    userId: "currentUserId",
    expiresAt: Date().addingTimeInterval(3600).timeIntervalSince1970
)

let damageUrl = PorscheEClaimsDeeplink.generateDamageAssessmentDeeplink(
    vehicleId: "vehicle123",
    authToken: authToken,
    useUniversalLink: true
)

PorscheEClaimsDeeplink.launchEClaims(url: damageUrl) { success in
    print("Damage assessment launch: \\(success)")
}
```

## 🔐 Security Features

### Encryption
- **Algorithm**: AES-256-GCM with PBKDF2 key derivation
- **Format**: JWE-style encrypted payloads
- **Key Management**: Your app provides the encryption key
- **Fallback**: Automatic legacy base64 support for compatibility

### Authentication Tokens
- **Format**: Base64-encoded JSON with user ID and expiration
- **Expiration**: Automatic token expiration handling
- **Scope**: Optional scope-based permissions
- **Session Tracking**: Session ID for audit trails

## 📱 Universal Links vs Custom Scheme

### Universal Links (Recommended)
```swift
// Uses: https://eclaims.porsche.com/vehicles?...
useUniversalLink: true
```
**Benefits:**
- Works even if app is not installed (redirects to App Store)
- More secure and user-friendly
- Better integration with iOS

### Custom Scheme
```swift
// Uses: porscheeclaims://vehicles?...
useUniversalLink: false  
```
**Benefits:**
- Direct app launch if installed
- Simpler for testing and development

## 🔧 Error Handling

The library provides comprehensive error handling:

```swift
PorscheEClaimsDeeplink.launchEClaims(url: deeplink) { success in
    if success {
        // E-Claims app launched successfully
        print("✅ App launched")
    } else {
        // Handle failure cases:
        // 1. App not installed → redirects to App Store
        // 2. Invalid URL format
        // 3. System permission denied
        print("❌ Launch failed")
        
        // Show user-friendly message
        showAlert("E-Claims app is not installed or cannot be opened")
    }
}
```

## 📋 Integration Checklist

### Required Info.plist Entries
```xml
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>porscheeclaims</string>
</array>
```

### Required Frameworks
- `Foundation` (system)
- `UIKit` (system)
- `CryptoKit` (iOS 13+)
- `CommonCrypto` (system)

### Security Configuration
1. **Encryption Key**: Use a secure 256-bit key
2. **Token Expiration**: Set reasonable expiration times
3. **User ID**: Use consistent user identification
4. **Session Management**: Track sessions for audit trails

## 🧪 Testing

### Test URLs
```swift
// Test basic vehicle deeplink
let testUrl = "porscheeclaims://vehicles?vehicleData=eyJ2ZWhpY2xlSWQiOiJ0ZXN0MTIzIn0="

// Test universal link  
let testUniversalUrl = "https://eclaims.porsche.com/vehicles?vehicleData=eyJ2ZWhpY2xlSWQiOiJ0ZXN0MTIzIn0="
```

### Debug Logging
The library includes comprehensive console logging:
- ✅ Success indicators
- ❌ Error messages  
- 🔐 Security operations
- 📱 Launch attempts

## 🐛 Troubleshooting

### Common Issues

1. **App Not Launching**
   - Verify E-Claims app is installed
   - Check URL scheme configuration
   - Validate deeplink URL format

2. **Authentication Failures**
   - Check token expiration
   - Verify user ID format
   - Ensure token structure is correct

3. **Encryption Errors**
   - Validate encryption key format (256-bit)
   - Check key derivation parameters
   - Verify data serialization

### Support
For integration support, contact the E-Claims development team or refer to the main project documentation.

---

**Compatible with iOS 13.0+**  
**Swift 5.0+**  
**Xcode 12.0+**
# iOS Universal Links Integration for Porsche E-Claims

This document explains how to integrate Porsche E-Claims Universal Links functionality into your iOS master app. Universal Links provide the best user experience on iOS and are the recommended integration method.

## ⚙️ Environment Configuration

**IMPORTANT**: Before using this library, you must configure the Universal Link domain for your target environment:

In `PorscheEClaimsDeeplink.swift`, update the `UNIVERSAL_LINK_BASE` constant:

```swift
// Production (default)
private static let UNIVERSAL_LINK_BASE = "https://eclaims.deactech.com"

// Staging 
private static let UNIVERSAL_LINK_BASE = "https://staging-eclaims.deactech.com"

// Development
private static let UNIVERSAL_LINK_BASE = "https://dev-eclaims.deactech.com"
```

### Supported Environments:
- **Production**: `eclaims.deactech.com`
- **Staging**: `staging-eclaims.deactech.com`  
- **Development**: `dev-eclaims.deactech.com`

**IMPORTANT**: Ensure your Apple App Site Association (AASA) files are hosted at:
- `https://eclaims.deactech.com/.well-known/apple-app-site-association`
- `https://staging-eclaims.deactech.com/.well-known/apple-app-site-association`  
- `https://dev-eclaims.deactech.com/.well-known/apple-app-site-association`

See [../../docs/APPLE-UNIVERSAL-LINKS-SETUP.md](../../docs/APPLE-UNIVERSAL-LINKS-SETUP.md) for complete configuration instructions.

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

### 1. Basic Vehicle Universal Link

```swift
// Create vehicle data
let vehicleData = PorscheEClaimsDeeplink.VehicleData(
    vehicleId: "vehicle123",
    vin: "WP0ZIZzP3DD001234",
    make: "Porsche", 
    model: "911 Carrera"
)

// Generate Universal Link (default behavior)
if let url = PorscheEClaimsDeeplink.generateVehicleDeeplink(
    vehicleData: vehicleData
    // useUniversalLink defaults to true on iOS
) {
    // Launch E-Claims via Universal Link
    PorscheEClaimsDeeplink.launchEClaims(url: url) { success in
        print("Launch success: \\(success)")
    }
}
```

### 2. Secure Universal Link with Authentication

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

// Generate encrypted Universal Link (recommended)
if let url = PorscheEClaimsDeeplink.generateVehicleDeeplink(
    vehicleData: vehicleData,
    authToken: authToken,
    // useUniversalLink defaults to true
    encrypt: true,
    encryptionKey: "your-256-bit-encryption-key"
) {
    PorscheEClaimsDeeplink.launchEClaims(url: url) { success in
        if success {
            print("✅ E-Claims launched with encrypted vehicle data via Universal Link")
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
    authToken: authToken
    // useUniversalLink defaults to true
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

## � Universal Links vs Custom Scheme

### Universal Links (Default & Recommended)
```swift
// Uses: https://eclaims.deactech.com/vehicles?...
// This is now the default behavior
```
**Benefits:**
- ✅ Works even if app is not installed (redirects to App Store)
- ✅ More secure and user-friendly
- ✅ Better integration with iOS ecosystem
- ✅ No need to declare custom schemes in Info.plist
- ✅ Seamless user experience

### Custom Scheme (Fallback)
```swift
// Uses: porscheeclaims://vehicles?...
useUniversalLink: false  // Explicitly disable Universal Links
```
**Use Cases:**
- Development and testing environments
- Legacy compatibility requirements
- Apps that cannot support Universal Links

**Note:** Universal Links are the recommended approach for production iOS apps.

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

### Required Associated Domains (Universal Links)
Add to your app's entitlements file:
```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:eclaims.deactech.com</string>
</array>
```

### Optional Info.plist Entries (Custom Scheme Fallback)
Only needed if using custom schemes:
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

### Test Universal Links
```swift
// Test basic vehicle Universal Link
let testUniversalUrl = "https://eclaims.deactech.com/vehicles?vehicleData=eyJ2ZWhpY2xlSWQiOiJ0ZXN0MTIzIn0="

// Test via Safari or Notes app to verify Universal Link handling
// Universal Links work when opened from other apps or web browsers
```

### Test Custom Scheme (if needed)
```swift
// Test custom scheme (fallback)
let testSchemeUrl = "porscheeclaims://vehicles?vehicleData=eyJ2ZWhpY2xlSWQiOiJ0ZXN0MTIzIn0="
```

### Debug Logging
The library includes comprehensive console logging:
- ✅ Success indicators for Universal Links
- ❌ Error messages with specific failure reasons
- 🔐 Security operations and encryption status
- 📱 Launch attempts and Universal Link handling

## 🐛 Troubleshooting

### Common Issues

1. **Universal Link Not Opening App**
   - Verify associated domains are configured correctly
   - Check that E-Claims app supports Universal Links
   - Test Universal Link from Safari or another app (not from the same app)
   - Ensure the domain verification is complete

2. **App Not Launching**
   - Universal Links automatically redirect to App Store if app not installed
   - Verify Universal Link format matches expected pattern
   - Check console logs for specific error messages

3. **Authentication Failures**
   - Check token expiration
   - Verify user ID format
   - Ensure token structure is correct

4. **Encryption Errors**
   - Validate encryption key format (256-bit)
   - Check key derivation parameters
   - Verify data serialization

### Support
For integration support, contact the E-Claims development team or refer to the main project documentation.

---

**Compatible with iOS 13.0+**  
**Swift 5.0+**  
**Xcode 12.0+**
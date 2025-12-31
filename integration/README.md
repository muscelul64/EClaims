# E-Claims Native Integration

This directory contains native integration modules for embedding React Native E-Claims into native Android (Kotlin) and iOS (Swift 5) applications.

## Available Integration Modules

### Android (Kotlin)
- **EClaimsAndroidModule.kt** - Native Android bridge module
- **KotlinImplementationExample.kt** - Complete implementation example

### iOS (Swift 5)
- **EClaimsIOSModule.swift** - Native iOS bridge module
- **SwiftImplementationExample.swift** - Complete implementation example

## Documentation

For complete implementation instructions, architecture details, and configuration examples, see:

**[Native Integration Guide](./native/README.md)**

## Quick Start

### Android Integration
1. Copy `native/android/EClaimsAndroidModule.kt` to your Kotlin project
2. Implement the `EClaimsHostListener` interface
3. Follow the implementation example in `native/android/KotlinImplementationExample.kt`

### iOS Integration  
1. Copy `native/ios/EClaimsIOSModule.swift` to your Swift project
2. Implement the `EClaimsHostDelegate` protocol
3. Follow the implementation example in `native/ios/SwiftImplementationExample.swift`

## Features

- **Bi-directional Communication**: Native apps can send data to React Native and receive callbacks
- **Data Synchronization**: Real-time sync of user and vehicle data
- **Navigation Coordination**: Seamless navigation between native and React Native screens
- **Platform-Specific Optimizations**: Haptic feedback on iOS, Material Design on Android
- **File Operations**: Save and share files through native APIs
- **Permission Handling**: Request and manage platform permissions
- **Analytics Integration**: Forward events to native analytics systems

## Support

For detailed implementation guidance, troubleshooting, and best practices, refer to the [Native Integration Guide](./native/README.md).
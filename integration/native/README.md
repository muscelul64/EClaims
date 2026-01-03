# Native App Integration Guide

This guide explains how to integrate the React Native E-Claims app into native Android (Kotlin) and iOS (Swift 5) applications.

## Overview

The E-Claims app can be embedded into existing native applications as a module, allowing seamless integration with your existing user management and vehicle management systems.

**Production Configuration:**
- **App Name**: Porsche E-Claims
- **iOS Bundle ID**: `com.porsche.eclaims`
- **Android Package**: `com.porsche.eclaims`
- **Deeplink Scheme**: `porscheeclaims://`
- **Universal Links**: `https://eclaims.porsche.com/`
- **API Endpoint**: `https://api.eclaims.porsche.com`

## Architecture

```
Native Host App (Kotlin/Swift)
    ├── User Management System
    ├── Vehicle Management System  
    ├── E-Claims Integration Module
    │   ├── React Native Bridge
    │   ├── Data Synchronization
    │   └── Navigation Coordination
    └── Native UI Components
```

## Android Integration (Kotlin)

### Prerequisites

1. **React Native Setup**: Add React Native to your existing Android project
2. **Dependencies**: Add required native module dependencies
3. **Permissions**: Configure camera, location, and storage permissions

### Key Files

- [`EClaimsAndroidModule.kt`](android/EClaimsAndroidModule.kt) - Native module bridge
- [`KotlinImplementationExample.kt`](android/KotlinImplementationExample.kt) - Implementation example

### Integration Steps

1. **Add React Native Dependencies**
```gradle
// app/build.gradle
implementation "com.facebook.react:react-native:+"
implementation "org.webkit:android-jsc:+"
```

2. **Configure Application Class**
```kotlin
class MainApplication : Application(), ReactApplication {
    private val mReactNativeHost = object : ReactNativeHost(this) {
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
        override fun getPackages(): List<ReactPackage> {
            return listOf(
                MainReactPackage(),
                EClaimsReactPackage() // Your custom package
            )
        }
    }
    
    override fun getReactNativeHost(): ReactNativeHost = mReactNativeHost
}
```

3. **Initialize E-Claims Module**
```kotlin
// In your Activity
val eClaimsModule = EClaimsAndroidModule(reactContext, this)
eClaimsModule.setHostListener(this) // Implement EClaimsHostListener
```

4. **Handle Data Synchronization**
```kotlin
// Sync user data
val userData = mapOf("id" to user.id, "email" to user.email /* ... */)
eClaimsModule.updateUserData(gson.toJson(userData))

// Sync vehicle data  
val vehicleData = vehicles.map { /* convert to map */ }
eClaimsModule.updateVehicleData(gson.toJson(vehicleData))
```

### Interface Implementation

Implement `EClaimsHostListener` to handle:
- Navigation requests to native screens
- Statement submissions  
- Vehicle/user action requirements
- Data synchronization
- File operations
- Analytics events

## iOS Integration (Swift 5)

### Prerequisites

1. **React Native Setup**: Add React Native to your existing iOS project
2. **CocoaPods**: Configure pod dependencies
3. **Permissions**: Configure Info.plist for camera, location access

### Key Files

- [`EClaimsIOSModule.swift`](ios/EClaimsIOSModule.swift) - Native module bridge
- [`SwiftImplementationExample.swift`](ios/SwiftImplementationExample.swift) - Implementation example

### Integration Steps

1. **Add React Native Dependencies**
```ruby
# Podfile
pod 'React', :path => '../node_modules/react-native', :subspecs => [
  'Core',
  'CxxBridge',
  'DevSupport',
  'RCTText',
  'RCTNetwork',
  'RCTWebSocket',
  'RCTAnimation'
]
```

2. **Configure Bridge**
```swift
// In your ViewController
bridge = RCTBridge(delegate: self, launchOptions: nil)
eClaimsModule = bridge?.module(for: EClaimsIOSModule.self) as? EClaimsIOSModule
eClaimsModule?.setHostDelegate(self)
```

3. **Initialize React Native View**
```swift
reactView = RCTRootView(
    bridge: bridge!,
    moduleName: "EClaims",
    initialProperties: nil
)
view.addSubview(reactView!)
```

4. **Handle Data Synchronization**
```swift
// Sync user data
let userData = ["id": user.id, "email": user.email /* ... */]
let userDataJson = try convertToJSON(userData)
eClaimsModule?.updateUserData(userDataJson, resolver: { _ in }, rejecter: { _, _, _ in })
```

### Delegate Implementation

Implement `EClaimsHostDelegate` to handle:
- Navigation to native view controllers
- Statement submissions with haptic feedback
- Vehicle/user action requirements
- Data synchronization
- File operations
- Analytics integration

## Data Flow

### User & Vehicle Data Sync

```
Native App → E-Claims Module:
- User profile data
- Vehicle information  
- Insurance details
- Authentication tokens

E-Claims Module → Native App:
- Statement submissions
- File attachments
- Navigation requests
- Action requirements
```

### Event Handling

```
React Native Events → Native App:
- USER_UPDATED
- VEHICLES_UPDATED  
- NAVIGATION_CHANGED

Native App Events → React Native:
- Data sync requests
- Configuration updates
- Permission changes
```

## Configuration

### Android Configuration

```kotlin
val config = mapOf(
    "apiBaseUrl" to "https://api.eclaims.porsche.com",
    "environment" to if (BuildConfig.DEBUG) "development" else "production",
    "analyticsEnabled" to true,
    "masterAppScheme" to "porsche-master-app", // Production master app
    "appScheme" to "porscheeclaims",
    "universalLinkHost" to "eclaims.porsche.com",
    "theme" to mapOf(
        "primaryColor" to "#007AFF",
        "darkMode" to isSystemInDarkMode()
    ),
    "features" to mapOf(
        "offlineMode" to true,
        "autoSave" to true,
        "pushNotifications" to true
    )
)
```

### iOS Configuration

```swift
let config: [String: Any] = [
    "apiBaseUrl": "https://api.eclaims.porsche.com",
    "environment": Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") == "Debug" ? "development" : "production",
    "analyticsEnabled": true,
    "masterAppScheme": "porsche-master-app", // Production master app
    "appScheme": "porscheeclaims",
    "universalLinkHost": "eclaims.porsche.com",
    "theme": [
        "primaryColor": "#007AFF",
        "darkMode": traitCollection.userInterfaceStyle == .dark
    ],
    "features": [
        "offlineMode": true,
        "autoSave": true,
        "pushNotifications": true,
        "hapticFeedback": true
    ]
]
```

## Permissions

### Android Permissions (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Deeplink intent filter -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="porscheeclaims" />
</intent-filter>

<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="eclaims.porsche.com" />
</intent-filter>

<provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="com.porsche.eclaims.fileprovider"
    android:exported="false"
    android:grantUriPermissions="true">
    <meta-data
        android:name="android.support.FILE_PROVIDER_PATHS"
        android:resource="@xml/file_paths" />
</provider>
```

### iOS Permissions (Info.plist)

```xml
<key>NSCameraUsageDescription</key>
<string>E-Claims needs camera access to capture damage photos</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>E-Claims needs location access to record incident location</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>E-Claims needs photo library access to save damage photos</string>

<!-- URL Schemes for deeplinks -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.porsche.eclaims</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>porscheeclaims</string>
        </array>
    </dict>
</array>

<!-- Associated Domains for Universal Links -->
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:eclaims.porsche.com</string>
</array>
```

## Navigation Integration

### Android Navigation

```kotlin
override fun onNavigationRequested(screenName: String, params: Map<String, Any>?) {
    when (screenName) {
        "vehicle_management" -> {
            val intent = Intent(this, VehicleManagementActivity::class.java)
            startActivity(intent)
        }
        "user_profile" -> {
            val intent = Intent(this, UserProfileActivity::class.java)
            startActivity(intent)
        }
    }
}
```

### iOS Navigation

```swift
func navigationRequested(screenName: String, params: [String: Any]?) {
    switch screenName {
    case "vehicle_management":
        let vehicleVC = VehicleManagementViewController()
        navigationController?.pushViewController(vehicleVC, animated: true)
    case "user_profile":
        let profileVC = UserProfileViewController()
        navigationController?.pushViewController(profileVC, animated: true)
    }
}
```

## Error Handling

### Common Issues

1. **Module Registration**: Ensure native modules are properly registered in React packages
2. **Bridge Communication**: Verify JSON serialization/deserialization
3. **Threading**: UI updates must happen on main thread
4. **Memory Management**: Properly handle React Native component lifecycle

### Debug Tips

1. **Android**: Use `adb logcat` to view native module logs
2. **iOS**: Use Xcode console to view Swift module logs  
3. **React Native**: Use Metro bundler logs for JavaScript errors
4. **Bridge**: Add logging to native module methods for debugging

## Security Considerations

1. **Data Validation**: Validate all data passed between native and React Native
2. **File Access**: Use secure file providers for sharing files
3. **Permissions**: Request permissions appropriately and handle denials
4. **API Keys**: Store sensitive configuration in secure storage

## Performance Optimization

1. **Lazy Loading**: Initialize React Native bridge only when needed
2. **Memory Management**: Properly dispose of React Native components
3. **Image Optimization**: Compress images before file operations
4. **Background Tasks**: Handle long-running operations appropriately

## Testing

### Unit Tests

- Test native module interface methods
- Verify data serialization/deserialization
- Test error handling scenarios

### Integration Tests

- Test data synchronization between native and React Native
- Verify navigation flows
- Test file operations and sharing

### UI Tests

- Test complete user flows
- Verify platform-specific behavior
- Test permission handling

## Support

For implementation questions or issues:

1. Review the example implementations
2. Check the native module interfaces
3. Verify configuration and permissions
4. Test with simplified data first
5. Use debugging tools for troubleshooting
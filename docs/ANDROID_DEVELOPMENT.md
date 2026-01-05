# Android Development Setup - Porsche E-Claims

## Quick Start Commands

```bash
# Start development server for Android
npm run start:android

# Run on Android device/emulator
npm run android

# Run on specific Android device
npm run android:dev

# Build Android APK for testing
npm run build:android:preview

# Build production Android App Bundle
npm run build:android:production
```

## Prerequisites

### 1. Android Studio Setup
- Install Android Studio with Android SDK
- Install Android SDK Platform-Tools
- Setup Android Virtual Device (AVD) or connect physical device

### 2. Environment Variables
```bash
# Add to your system PATH:
ANDROID_HOME=C:\Users\{username}\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT=%ANDROID_HOME%
```

### 3. Enable Developer Mode
- On physical device: Settings > About > Build Number (tap 7 times)
- Enable USB Debugging in Developer Options

## Development Workflow

### Local Development
```bash
# 1. Start Metro bundler
npm run start:android

# 2. In another terminal, run on device
npm run android

# 3. For hot reload during development
# Code changes will automatically reload
```

### Building for Testing
```bash
# Build preview APK
npm run build:android:preview

# Download APK from EAS Build dashboard
# Install on devices for testing
```

## Android Configuration

### App Configuration (`app.json`)
- **Package Name**: `com.deactech.porscheeclaims`
- **Target SDK**: 34 (Android 14)
- **Min SDK**: 23 (Android 6.0)
- **Compile SDK**: 34

### Permissions Required
- Camera access for photo capture
- Location access for incident reporting
- Storage access for photo management
- Network access for API communication

### Intent Filters
- Custom scheme: `porscheeclaims://`
- Universal links: `https://eclaims.deactech.com/`

## Debugging

### Common Issues & Solutions

1. **Metro bundler not starting**
```bash
npx expo start --clear-cache
```

2. **Android build fails**
```bash
# Clear cache and rebuild
npm run prebuild:clean
npm run android
```

3. **Device not detected**
```bash
adb devices
adb kill-server
adb start-server
```

### Debugging Tools
- **React DevTools**: For component inspection
- **Flipper**: For network requests and app state
- **Android Studio Logcat**: For native Android logs

```bash
# View device logs
adb logcat | findstr "ReactNativeJS"
```

## Testing

### Debug Build Testing
```bash
# Install debug build on connected device
npm run android:dev
```

### Release Build Testing
```bash
# Build and test preview APK
npm run build:android:preview
```

### Device Testing Checklist
- [ ] App launches correctly
- [ ] Camera functionality works
- [ ] Location services work
- [ ] Network requests succeed
- [ ] Deeplinks open properly
- [ ] Master app integration works
- [ ] Photo capture and storage
- [ ] Form submissions work

## Master App Integration on Android

### Intent Filter Setup
Android handles deeplinks through intent filters configured in `app.json`:

```json
"intentFilters": [
  {
    "action": "VIEW",
    "data": [
      { "scheme": "porscheeclaims" },
      { "scheme": "https", "host": "eclaims.deactech.com" }
    ],
    "category": ["BROWSABLE", "DEFAULT"]
  }
]
```

### Testing Master App Integration
```bash
# Test deeplink on Android device
adb shell am start -W -a android.intent.action.VIEW -d "porscheeclaims://master-auth?token=test_token" com.deactech.porscheeclaims

# Test universal link
adb shell am start -W -a android.intent.action.VIEW -d "https://eclaims.deactech.com/master-auth?token=test_token" com.deactech.porscheeclaims
```

## Production Deployment

### EAS Build Production
```bash
# Build production App Bundle for Google Play
npm run build:android:production
```

### Google Play Console
1. Upload App Bundle (.aab file)
2. Configure app signing with Google Play
3. Set up internal testing track
4. Configure release management

### Security Configuration
- Network security config for API communication
- Certificate pinning for production APIs
- Obfuscation enabled for release builds
- ProGuard/R8 minification enabled

## Performance Optimization

### Bundle Size
- Use Hermes JavaScript engine (enabled by default)
- Enable bundle compression
- R8/ProGuard minification for release

### Runtime Performance
- Image optimization for Android densities
- Lazy loading for route-based code splitting
- Background task management
- Memory leak prevention

## Monitoring & Analytics

### Crash Reporting
```bash
# Add crash reporting (if not already present)
npx expo install @react-native-firebase/crashlytics
```

### Performance Monitoring
- Use Expo Application Services (EAS) insights
- Monitor app size and load times
- Track user engagement metrics

## Troubleshooting

### Common Android Issues

1. **Build Timeouts**
   - Increase build timeout in EAS configuration
   - Use local builds for faster iteration

2. **Memory Issues**
   - Reduce bundle size
   - Optimize image assets
   - Use memory profiling tools

3. **Network Issues**
   - Check network security config
   - Verify API endpoint accessibility
   - Test with different network conditions

### Development Tips
- Use Android Studio for native debugging
- Test on multiple Android versions
- Verify permissions are properly requested
- Test deeplink handling thoroughly
- Validate master app integration flows
# Porsche E-Claims Mobile App

A comprehensive insurance claims mobile application for Porsche vehicles, built with React Native and Expo. The app enables users to document vehicle incidents, capture photos, manage claims statements, and handle insurance processing workflows with end-to-end encryption and secure communication.

## 🚗 Features

### Core Functionality
- **Claims Management**: Create, edit, and track insurance claims
- **Vehicle Registration**: Manage multiple Porsche vehicles with VIN validation
- **Damage Assessment**: Capture and categorize vehicle damage with photos
- **Document Management**: Secure storage of insurance documents and photos
- **Emergency Services**: Quick access to emergency contacts and services

### Security & Integration
- **End-to-End Encryption**: AES-256-CBC encryption with PBKDF2 key derivation
- **Secure Deeplinks**: Encrypted communication between master apps and E-Claims
- **HMAC Signatures**: Data integrity verification with SHA-256
- **Token-based Authentication**: JWT-style secure tokens with expiration
- **Smart Format Detection**: Automatic handling of encrypted and legacy data formats

### Technical Features
- **Cross-Platform**: iOS and Android support with platform-specific optimizations
- **Offline Support**: Local SQLite database with AsyncStorage persistence
- **Multi-language**: Internationalization with English and Romanian support
- **Master App Integration**: Secure communication with Swift (iOS) and Kotlin (Android) libraries
- **Crash Reporting**: Comprehensive deobfuscation and error tracking system

## 🏗️ Architecture

### Technology Stack
- **Framework**: Expo SDK 54 with React Native new architecture
- **Navigation**: File-based routing with protected routes
- **State Management**: Zustand stores with AsyncStorage persistence
- **Database**: SQLite via expo-sqlite
- **Encryption**: CryptoJS for AES encryption and HMAC signatures
- **Build System**: EAS Build with ProGuard/R8 obfuscation

### App Configuration
- **App Name**: Porsche E-Claims
- **Version**: 10.0.0
- **Slug**: porsche-eclaims
- **Bundle ID**: com.deactech.porscheeclaims
- **Deeplink Scheme**: porscheeclaims://
- **Universal Links**: https://eclaims.porsche.com/

### Project Structure
```
app/                    # File-based routing
├── (auth)/            # Authentication screens (redirects if authenticated)
├── (main)/            # Main app functionality (requires authentication)
└── (tabs)/            # Tab navigation within main app

components/            # Reusable UI components
├── forms/            # Form components with validation
├── ui/               # UI library components
└── themed-*.tsx      # Themed components for consistent styling

stores/               # Zustand state management
├── use-vehicles-store.ts    # Vehicle management
├── use-statements-store.ts  # Claims and statements
├── use-camera-store.ts      # Photo capture and management
└── use-user-store.ts        # Authentication and user data

utils/                # Utility functions
├── secure-communication.ts  # Encryption and secure data handling
├── deeplink.ts              # Deeplink processing and routing
├── deobfuscation.ts         # Crash reporting and debugging
└── api/                     # API integration layer
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (macOS) or Android Studio
- EAS CLI for builds (`npm install -g eas-cli`)

### Installation
1. Install dependencies

   ```bash
   npm install
   ```

2. Set up environment variables

   Create `.env` file in root directory:
   ```env
   # App Configuration
   EXPO_PUBLIC_APP_ENV=development
   EXPO_PUBLIC_DEEPLINK_SCHEME=porscheeclaims
   EXPO_PUBLIC_UNIVERSAL_LINK_DOMAIN=eclaims.porsche.com

   # Security Configuration (generate your own keys)
   EXPO_PUBLIC_ENCRYPTION_KEY=your-256-bit-encryption-key
   EXPO_PUBLIC_HMAC_SECRET=your-hmac-secret-key

   # API Configuration
   EXPO_PUBLIC_API_BASE_URL=https://api.example.com
   EXPO_PUBLIC_AUTH_ENDPOINT=/api/v1/auth

   # Feature Flags
   EXPO_PUBLIC_ENABLE_CRASH_REPORTING=true
   EXPO_PUBLIC_ENABLE_DEBUG_MODE=false
   ```

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## 🔐 Security Implementation

### Encryption
- **Algorithm**: AES-256-CBC with random IV generation
- **Key Derivation**: PBKDF2 with 10,000 iterations
- **Integrity**: HMAC-SHA256 signatures for data verification
- **Format**: JSON Web Encryption (JWE) style structure

### Secure Communication Example
```typescript
import { SecureCommunication } from '@/utils/secure-communication';

// Encrypt sensitive data
const encrypted = SecureCommunication.encrypt({
  vehicleId: "vehicle123",
  vin: "WP0ZIZzP3DD001234",
  make: "Porsche"
});

// Decrypt received data with smart format detection
const decrypted = SecureCommunication.smartExtractVehicleData(encryptedPayload);
```

### Platform Integration
Generate secure communication libraries for master apps:
```bash
# Generate Swift library for iOS integration
scripts/generate-platform-code.sh swift

# Generate Kotlin library for Android integration  
scripts/generate-platform-code.sh kotlin
```

## 📱 Deeplink System

### URL Scheme
```
porscheeclaims://vehicles?vehicleData=[ENCRYPTED_DATA]&token=[AUTH_TOKEN]
```

### Testing Deeplinks
```bash
# Test with encrypted data (secure mode)
adb shell am start -W -a android.intent.action.VIEW -d "porscheeclaims://vehicles?secureData=[ENCRYPTED_PAYLOAD]" com.deactech.porscheeclaims

# Test with legacy data (base64 mode)  
adb shell am start -W -a android.intent.action.VIEW -d "porscheeclaims://vehicles?vehicleData=[BASE64_JSON]&token=[AUTH_TOKEN]" com.deactech.porscheeclaims
```

## 🏗️ Build Commands

### Development

```bash
```bash
# Development builds
npm run ios              # Run on iOS simulator
npm run android          # Run on Android emulator
npm run web              # Run in web browser
npx expo run:android
npx expo run:ios
```

### Production Builds
```bash
# EAS Build for production
eas build --platform android --profile production
eas build --platform ios --profile production
eas build --platform all --profile production
```

### Development Commands
```bash
npm run lint             # Run ESLint
npm run reset-project    # Clean starter code
```

## 🧪 Testing & Debugging

### Deeplink Testing
See `DEEPLINK-SINGLE-VEHICLE-TEST.md` for comprehensive deeplink testing procedures.

### Security Testing
```typescript
// Run security test suite
import { SecurityTestSuite } from '@/utils/security-test-suite';
SecurityTestSuite.runAllTests();
```

### Debugging Production Builds
The app includes comprehensive crash reporting and deobfuscation tools:

```bash
# Generate deobfuscation files
scripts/generate-deobfuscation.bat

# Analyze crash reports
python build/mapping/analyze-crash.py crash_report.json

# Batch analyze multiple crashes
python build/mapping/batch-analyze.py crashes_directory/
```

## 🌍 Internationalization

### Adding New Languages
1. Create translation file in `app/locales/[locale].json`
2. Add locale to supported languages in `app/i18n.ts`
3. Use `useTranslation()` hook in components:

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <Text>{t('welcome.message')}</Text>;
}
```

## 📋 API Integration

The app integrates with insurance backend systems through secure REST APIs:

- **Authentication**: Token-based with refresh mechanism
- **Claims Processing**: CRUD operations for claims and statements  
- **Document Upload**: Secure photo and document management
- **Vehicle Verification**: VIN validation and insurance lookup

See `API_INTEGRATION.md` for detailed API documentation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode conventions
- Use themed components for consistent UI
- Implement proper error handling and loading states
- Add translations for all user-facing text
- Include tests for new functionality
- Follow security best practices for sensitive data

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Review the documentation in the `/docs` folder

## 🔄 Changelog

### Version 2.6.0 (January 2026)
- ✅ Complete security implementation with AES-256 encryption
- ✅ Smart format detection for encrypted and legacy data
- ✅ Platform integration libraries for Swift and Kotlin
- ✅ Comprehensive deobfuscation and crash reporting system
- ✅ Enhanced deeplink system with secure token validation
- ✅ Production-ready build configuration with obfuscation

### Version 2.5.0 (December 2025)
- ✅ Expo SDK 54 upgrade with new architecture
- ✅ File-based routing implementation
- ✅ Zustand state management with persistence
- ✅ Multi-language support (English/Romanian)
- ✅ Vehicle and claims management functionality

---

**Built with ❤️ for Porsche vehicle owners**

## Features

- **Vehicle Management**: Add and manage Porsche vehicles
- **Claims Processing**: Create and manage insurance claims
- **Photo Documentation**: Capture and categorize damage photos
- **Deeplink Support**: Single vehicle access via deeplinks
- **Internationalization**: Multi-language support (English/Romanian)

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# Porsche E-Claims Mobile App - AI Development Guide

## Business Domain & Architecture Overview
This is an insurance claims mobile app for Porsche vehicles, built on Expo 54 React Native with file-based routing. The app enables users to document vehicle incidents, capture photos, manage claims statements, and handle insurance processing workflows.

**Core Business Entities**: ClaimStatement (accidents/damage/theft), Vehicle (with VIN/insurance details), StatementDamage (damage areas with photos), CapturePhoto (typed by use case)

## Critical App Structure & Navigation Patterns

### Route Protection & Authentication Flow
```typescript
// Route hierarchy with auth guards:
// app/_layout.tsx → Root (global providers)
//   ├── app/(auth)/_layout.tsx → Redirects authenticated users to (main)
//   ├── app/(main)/_layout.tsx → Redirects unauthenticated users to (auth)/login  
//   └── app/(tabs)/_layout.tsx → Tab navigation (within main)
```
- **Auth guards**: `(auth)` and `(main)` layouts use `useAuth()` hook for automatic redirects
- **Protected routes**: All main app functionality requires authentication
- **Modal presentations**: Camera screens use `presentation: 'modal'` in Stack.Screen options

### State Management Architecture (Zustand + AsyncStorage)
```typescript
// Pattern: All stores persist to AsyncStorage automatically
useVehiclesStore: Vehicle[] + selectedVehicle + CRUD operations
useStatementsStore: ClaimStatement[] + currentStatement + workflow management  
useCameraStore: CapturePhoto[] + photo categorization by type
useUserStore: Authentication state + profile data
```
- **Persistence**: Every store auto-saves to AsyncStorage on state changes
- **Photo typing**: CapturePhoto uses `type: 'id' | 'license' | 'registration' | 'damage' | 'general'`
- **Form patterns**: Complex multi-step forms (statements) use currentStatement + step-by-step navigation

### Internationalization & Localization
- **i18n setup**: Auto-detects device locale, falls back to English, supports Romanian
- **Usage**: `const { t } = useTranslation()` for all user-facing strings
- **Translation files**: `app/locales/` and root `locales/` (both exist, prefer app/locales/)
- **Device integration**: Uses `expo-localization` for automatic language detection

### Camera & Document Capture Workflows
```typescript
// Camera photos are categorized by business purpose:
type PhotoType = 'id' | 'license' | 'registration' | 'damage' | 'general';
// Photos include metadata: location, timestamp, vehicleId, damageArea
```
- **Modal camera**: Accessed via `camera.tsx` with modal presentation
- **Photo management**: useCameraStore handles categorization, metadata, and cleanup
- **Document types**: Driver license, vehicle registration, insurance docs, damage photos

### Development Workflows & Commands
```bash
npx expo start          # Development server with QR code
npm run ios/android     # Platform-specific builds  
npm run reset-project   # Cleans starter code (moves to app-example/)
npm run lint           # ESLint validation
```

### Component Conventions & Theming
- **Themed components**: Always use `ThemedText`, `ThemedView`, `ThemedButton` instead of base React Native
- **Icons**: `IconSymbol` component auto-maps SF Symbols (iOS) ↔ Material Icons (Android/Web)
- **Forms**: Use `components/forms/` pattern with validation, loading states, and error handling
- **Path aliases**: `@/` prefix for all imports (configured in tsconfig.json)

### Component Conventions
- Export themed variants (e.g., `ThemedText`) for consistent styling
- Include type definitions with component props extending base React Native types
- Use functional components with TypeScript interfaces for props
- Leverage custom hooks for theme-related logic (e.g., `useThemeColor`)

### Platform-Specific Code
- iOS haptic feedback in tab interactions
- SF Symbols for iOS icons with Material Icons fallback
- Platform-specific font selections in theme constants
- Cross-platform builds configured in `app.json` with platform-specific settings

### UI Component Library
Components are organized in:
- `/components` - Basic themed components (ThemedText, ThemedView, etc.)
- `/components/ui` - Reusable UI elements (IconSymbol, Collapsible)
- Leverage Expo's built-in components when possible
# Production Environment Configuration for Porsche E-Claims

## Production Configuration Applied

✅ **App Configuration**
- App name: "Porsche E-Claims" (production)
- Bundle ID (iOS): `com.deactech.porscheeclaims`
- Package name (Android): `com.deactech.porscheeclaims`
- Version: 10.0.0 (current production version)

✅ **API Configuration**
- Production API endpoint: `https://api.eclaims.deactech.com`
- Reduced network timeouts for production reliability
- Error logging disabled for performance

✅ **Deeplink Configuration**
- Production schemes: `porscheeclaims://`
- Universal links: `https://eclaims.deactech.com/`
- Legacy scheme: `deactecheclaims://` (for backward compatibility)

✅ **Build Configuration**
- EAS production profile enabled
- Auto-increment version numbers
- App bundle format for Google Play Store
- Release configuration for iOS

## Production Build Commands

```bash
# Build for production (both platforms)
npm run deploy:production

# Build Android only (production)
npm run build:android:production  

# Build iOS only (production)
npm run build:ios:production

# Run production build locally (Android)
npm run android:production

# Run production build locally (iOS)  
npm run ios:production
```

## Environment Detection

The app automatically detects the production environment based on:
- `__DEV__` flag (false in production builds)
- `process.env.EXPO_PUBLIC_ENVIRONMENT` variable
- Build configuration settings

## Security & Performance

🔒 **Security Features**
- Debug logging disabled
- Sensitive data not exposed in logs
- Production API certificates required

⚡ **Performance Optimizations**
- Minified JavaScript bundles
- Optimized asset loading
- Reduced network timeouts
- Efficient error handling

## Master App Integration

The production environment is configured to work with:
- Porsche Master App (production)
- Production authentication servers
- Live vehicle data services
- Real insurance claim systems

## Deployment Checklist

Before production deployment, ensure:
- [ ] All API endpoints point to production
- [ ] Master app integration tested
- [ ] Certificate pinning configured
- [ ] Analytics configured for production
- [ ] Push notifications configured
- [ ] App store metadata updated
- [ ] Privacy policy and terms updated

## Monitoring

Production environment includes:
- Crash reporting
- Performance monitoring
- Usage analytics
- Error tracking (without sensitive data)

---

**Note**: Switch back to development with `git checkout` and rebuild, or use environment variables to control the configuration.
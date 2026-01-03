# Environment Configuration Guide

This document explains how to set up and use environment variables in the Porsche E-Claims app.

## Quick Setup

1. **Copy the template**:
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file** with your specific values:
   ```bash
   # Required: Set your environment
   EXPO_PUBLIC_ENVIRONMENT=development

   # Required: Set a secure encryption key
   EXPO_PUBLIC_SHARED_SECRET=your-secure-32-character-key-here
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

## Environment Variables

### Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `EXPO_PUBLIC_ENVIRONMENT` | App environment | `production` | `development` |
| `EXPO_PUBLIC_SHARED_SECRET` | Encryption key for security | `porsche-eclaims-default-key-2026` | `P0rsch3-S3cur3-K3y-2026!@#` |

### API Configuration

| Variable | Description | Environment | Default |
|----------|-------------|-------------|---------|
| `EXPO_PUBLIC_API_BASE_URL_DEV` | Development API URL | Development | `https://api-dev.eclaims.porsche.com` |
| `EXPO_PUBLIC_API_BASE_URL_STAGING` | Staging API URL | Staging | `https://api-staging.eclaims.porsche.com` |
| `EXPO_PUBLIC_API_BASE_URL_PROD` | Production API URL | Production | `https://api.eclaims.porsche.com` |
| `EXPO_PUBLIC_API_TIMEOUT` | API request timeout (ms) | All | `30000` |

### Deeplink Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_APP_SCHEME_DEV` | Development app scheme | `porscheeclaims-dev` |
| `EXPO_PUBLIC_APP_SCHEME_STAGING` | Staging app scheme | `porscheeclaims-staging` |
| `EXPO_PUBLIC_APP_SCHEME_PROD` | Production app scheme | `porscheeclaims` |

### Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH` | Enable biometric authentication | `true` |
| `EXPO_PUBLIC_ENABLE_DEVELOPER_MENU` | Show developer menu | `true` (dev only) |
| `EXPO_PUBLIC_ENABLE_SECURITY_LOGGING` | Log security events | `true` |
| `EXPO_PUBLIC_ENABLE_ANALYTICS` | Enable analytics tracking | `false` |

## Environment-Specific Files

You can create environment-specific files for different setups:

- `.env` - Local development (gitignored)
- `.env.example` - Template file (committed to git)
- `.env.development` - Development environment
- `.env.staging` - Staging environment  
- `.env.production` - Production environment

## Usage in Code

### Accessing Environment Variables

```typescript
// Direct access
const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL_DEV;

// Through environment utility
import { ENV_CONFIG, ENVIRONMENT } from '@/utils/environment';

const currentApiUrl = ENV_CONFIG.API_BASE_URL;
const isDevMode = ENVIRONMENT === 'development';
```

### Security Configuration

```typescript
import { SecureCommunication } from '@/utils/secure-communication';

// Uses EXPO_PUBLIC_SHARED_SECRET from environment
const secureCom = new SecureCommunication();
```

## Security Best Practices

### Development
- Use the default shared secret provided
- Enable all logging and debugging features
- Set realistic API timeouts

### Staging
- Use environment-specific API keys
- Disable debugging features
- Enable limited logging

### Production
- **CRITICAL**: Use strong, unique shared secrets
- Disable all debugging features  
- Minimize logging
- Use secure API endpoints with proper certificates

## Common Issues

### Missing Environment Variables
```bash
# Error: Cannot read property of undefined
# Solution: Check if .env file exists and variable is set
```

### Wrong Environment Detected
```bash
# Issue: App using wrong API URL
# Solution: Verify EXPO_PUBLIC_ENVIRONMENT is set correctly
```

### Security Key Issues
```bash
# Error: Encryption/decryption failures
# Solution: Ensure EXPO_PUBLIC_SHARED_SECRET is at least 16 characters
```

## Testing Environment Setup

Run these commands to verify your environment:

```bash
# Check environment detection
npx expo start --clear

# Test security features (in development mode)
# Open app → Tap "Run Security Tests" button
```

## EAS Build Integration

For EAS builds, set environment variables in `eas.json`:

```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "development",
        "EXPO_PUBLIC_SHARED_SECRET": "dev-secret-key"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "production",
        "EXPO_PUBLIC_SHARED_SECRET": "prod-secret-key"
      }
    }
  }
}
```

Or use EAS Secret Manager for sensitive values:

```bash
# Set production secrets
eas secret:create --scope project --name EXPO_PUBLIC_SHARED_SECRET --value "your-production-key"
```

## Environment Validation

The app automatically validates environment configuration on startup:

- ✅ Required variables are present
- ✅ API URLs are accessible
- ✅ Encryption keys are valid
- ✅ Feature flags are boolean values

Check the console logs for any environment warnings or errors.
# Apple Universal Links Configuration Guide

## Overview
This guide explains how to configure Apple Universal Links for the Porsche E-Claims app across different environments.

## 🔧 Required Steps

### 1. Apple Developer Portal Configuration

1. **Log into Apple Developer Portal**
   - Go to [developer.apple.com](https://developer.apple.com)
   - Navigate to Certificates, Identifiers & Profiles

2. **Configure App Identifier**
   - Select your app identifier: `com.deactech.porscheeclaims`
   - Enable "Associated Domains" capability
   - Save changes

3. **Update Provisioning Profiles**
   - Regenerate provisioning profiles to include Associated Domains capability
   - Download and install updated profiles

### 2. Web Server Configuration

**Host Apple App Site Association files on each domain:**

#### Production: `eclaims.deactech.com`
```bash
# Upload to: https://eclaims.deactech.com/.well-known/apple-app-site-association
# Content: docs/apple-app-site-association-production.json
```

#### Staging: `staging-eclaims.deactech.com`
```bash
# Upload to: https://staging-eclaims.deactech.com/.well-known/apple-app-site-association  
# Content: docs/apple-app-site-association-staging.json
```

#### Development: `dev-eclaims.deactech.com`
```bash
# Upload to: https://dev-eclaims.deactech.com/.well-known/apple-app-site-association
# Content: docs/apple-app-site-association-development.json
```

**Important Requirements:**
- Files must be served over HTTPS
- Content-Type: `application/json`
- No file extension (just `apple-app-site-association`)
- File size limit: 128KB

### 3. Update AASA Files with Your Team ID

**CRITICAL**: Replace `TEAM_ID` in all AASA files with your actual Apple Developer Team ID:

```bash
# Find your Team ID in Apple Developer Portal → Membership
# Update all three AASA files:
sed -i 's/TEAM_ID/YOUR_ACTUAL_TEAM_ID/g' docs/apple-app-site-association-*.json
```

Example:
```json
{
  "applinks": {
    "details": [
      {
        "appIDs": [
          "ABC123DEF4.com.deactech.porscheeclaims"  // Replace ABC123DEF4 with your Team ID
        ]
      }
    ]
  }
}
```

### 4. Testing Universal Links

#### Verification Tools
```bash
# Apple's AASA Validator
https://developer.apple.com/documentation/xcode/supporting-associated-domains

# Branch.io AASA Validator  
https://branch.io/resources/aasa-validator/

# Manual curl test
curl -v https://eclaims.deactech.com/.well-known/apple-app-site-association
```

#### Test URLs
```
Production:  https://eclaims.deactech.com/vehicles?vehicleData=test
Staging:     https://staging-eclaims.deactech.com/vehicles?vehicleData=test  
Development: https://dev-eclaims.deactech.com/vehicles?vehicleData=test
```

#### iOS Testing
1. **Notes App Test**: Paste Universal Link in Notes app, long press → should show "Open in Porsche E-Claims"
2. **Safari Test**: Open Universal Link in Safari → should redirect to app
3. **Messages Test**: Send Universal Link via iMessage → tap should open app

### 5. Troubleshooting

#### Common Issues
- **AASA file not found**: Check HTTPS hosting and file path
- **Team ID mismatch**: Verify Team ID in AASA files matches Apple Developer Portal
- **App not opening**: Ensure Associated Domains capability is enabled
- **Custom scheme fallback**: If Universal Links fail, custom schemes still work

#### Debug Commands
```bash
# Check AASA file content
curl -s https://eclaims.deactech.com/.well-known/apple-app-site-association | jq .

# Validate JSON format
cat docs/apple-app-site-association-production.json | jq .

# Check app configuration
npx expo config --type public | jq .expo.ios.associatedDomains
```

## ✅ Current Configuration Status

### App Configuration
- ✅ **Associated Domains**: `applinks:eclaims.deactech.com`, `staging-eclaims.deactech.com`, `dev-eclaims.deactech.com`
- ✅ **Bundle Identifier**: `com.deactech.porscheeclaims`
- ✅ **Custom Scheme Fallback**: `porscheeclaims://`

### URL Parsing
- ✅ **Environment-aware**: Uses `ENV_CONFIG.UNIVERSAL_LINK_HOST`
- ✅ **Parameter Support**: `vehicleData`, `secureData`, `token`
- ✅ **Route Handlers**: `/vehicles`, `/damage`, `/statements`, `/camera`

### Platform Integration
- ✅ **iOS Swift Library**: Generates Universal Links by default
- ✅ **Android Kotlin Library**: Generates App Links by default
- ✅ **React Native Parser**: Handles all Universal Link formats

## 🚀 Next Steps

1. **Get Apple Team ID** from Apple Developer Portal
2. **Update AASA files** with your Team ID  
3. **Upload AASA files** to web servers at `/.well-known/apple-app-site-association`
4. **Enable Associated Domains** in Apple Developer Portal
5. **Test Universal Links** using the verification methods above

Your app is now configured to support Universal Links across all environments! 🎉
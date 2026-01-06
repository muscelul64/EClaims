# Android App Links Configuration Guide

## Problem
Android Universal Links (App Links) open the website instead of the app because Android requires **Digital Asset Links** for domain verification.

## Solution Overview
Android App Links require two components:
1. **Intent Filters** in app.json (✅ Already configured)
2. **Digital Asset Links** file hosted on your domains (❌ Missing)

## Current Status
- ✅ Intent filters configured in app.json for all domains
- ❌ Digital Asset Links file (assetlinks.json) missing
- ❌ Server-side hosting not configured

## Steps to Fix

### 1. Get Your Certificate Fingerprints

#### For Development (Debug Certificate):
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

#### For Production (Release Certificate):
```bash
keytool -list -v -keystore path/to/your/release.keystore -alias your_alias
```

#### For EAS Builds:
```bash
eas credentials
```

Look for the **SHA256** fingerprint (not SHA1) - it should look like:
`AB:CD:EF:12:34:56:...` (with colons, uppercase)

### 2. Update assetlinks.json

The file is located at: `docs/assetlinks.json`

Replace `REPLACE_WITH_YOUR_SHA256_FINGERPRINT` with your actual SHA256 fingerprint:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.deactech.porscheeclaims",
      "sha256_cert_fingerprints": [
        "YOUR_ACTUAL_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

### 3. Upload to Your Domains

The assetlinks.json file must be accessible at:
- `https://eclaims.deactech.com/.well-known/assetlinks.json`
- `https://staging-eclaims.deactech.com/.well-known/assetlinks.json`
- `https://dev-eclaims.deactech.com/.well-known/assetlinks.json`

#### Server Configuration Requirements:
- **Content-Type**: `application/json`
- **HTTPS**: Required (HTTP will not work)
- **No redirects**: Direct access required
- **Accessible**: No authentication required

### 4. Verify Configuration

#### Test with Google's Tool:
1. Go to: https://developers.google.com/digital-asset-links/tools/generator
2. Enter your domain: `eclaims.deactech.com`
3. Enter package name: `com.deactech.porscheeclaims`
4. Enter SHA256 fingerprint
5. Click "Generate Statement" and verify

#### Test with adb:
```bash
# First verify the assetlinks.json is accessible
curl https://eclaims.deactech.com/.well-known/assetlinks.json

# Test the deeplink
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "https://eclaims.deactech.com/vehicles?vehicleData=eyJ2aW4iOiJXT...=" \
  com.deactech.porscheeclaims
```

### 5. Test App Links

After uploading assetlinks.json and rebuilding your app:

1. **Install app** on Android device
2. **Clear app data** (important for verification refresh)
3. **Open link** in browser or another app
4. **Should prompt** to open in your app

### Troubleshooting

#### Link opens in browser instead of app:
- Verify assetlinks.json is accessible via HTTPS
- Check SHA256 fingerprint matches your build certificate
- Clear app data and reinstall
- Wait up to 5 minutes for Android to verify domain

#### Verification failed:
- Check server returns `Content-Type: application/json`
- Ensure no redirects in the path
- Verify JSON syntax is valid
- Check certificate fingerprint format (uppercase with colons)

#### Domain verification status:
```bash
# Check domain verification (Android 6+)
adb shell pm get-app-links com.deactech.porscheeclaims
```

### Multiple Environments

For different environments, you may need different certificates:
- **Development**: Debug certificate fingerprint
- **Staging**: Release certificate fingerprint  
- **Production**: Production certificate fingerprint

Update assetlinks.json with all required fingerprints:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.deactech.porscheeclaims",
      "sha256_cert_fingerprints": [
        "DEBUG_CERTIFICATE_SHA256_FINGERPRINT",
        "RELEASE_CERTIFICATE_SHA256_FINGERPRINT",
        "PRODUCTION_CERTIFICATE_SHA256_FINGERPRINT"
      ]
    }
  }
]
```

## Key Differences: iOS vs Android

| Aspect | iOS (Universal Links) | Android (App Links) |
|--------|----------------------|---------------------|
| **Verification File** | apple-app-site-association | assetlinks.json |
| **Location** | `.well-known/` or root | `.well-known/` only |
| **Certificate** | Team ID | SHA256 fingerprint |
| **Validation** | App Store validation | Google Play validation |
| **Fallback** | Opens Safari | Opens default browser |

## Next Steps

1. **Run the keytool command** to get your SHA256 fingerprint
2. **Update docs/assetlinks.json** with the real fingerprint
3. **Upload to your web servers** at the /.well-known/ path
4. **Test with Google's tool** to verify configuration
5. **Rebuild your app** and test the deep links
6. **Clear app data** before testing to refresh domain verification
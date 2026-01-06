# Android App Links - Ready to Deploy

## ✅ Configuration Complete

Your Android App Links configuration is now ready! Here's what has been set up:

### Files Created:
1. **`docs/assetlinks.json`** - Digital Asset Links file with your production certificate
2. **`docs/ANDROID_APP_LINKS_SETUP.md`** - Complete setup guide
3. **`scripts/setup-android-applinks-simple.ps1`** - Helper script

### Certificate Information:
- **Package**: com.deactech.porscheeclaims
- **SHA256 Fingerprint**: `38:C5:ED:13:26:32:A0:BB:56:C4:97:31:44:B3:DC:64:6F:69:5A:C5:57:2F:C6:C7:12:5D:84:70:29:3C:25:75`

## 🚀 Next Steps (Critical)

### 1. Upload assetlinks.json to Your Web Server

Upload the `docs/assetlinks.json` file to these locations:

```
https://eclaims.deactech.com/.well-known/assetlinks.json
https://staging-eclaims.deactech.com/.well-known/assetlinks.json  
https://dev-eclaims.deactech.com/.well-known/assetlinks.json
```

**Important**: 
- Must be accessible via **HTTPS**
- Must return **Content-Type: application/json**
- Must be in the **/.well-known/** directory
- No authentication required
- No redirects allowed

### 2. Verify Upload

Test that the file is accessible:
```bash
curl https://eclaims.deactech.com/.well-known/assetlinks.json
```

Should return your JSON content with proper headers.

### 3. Validate with Google's Tool

1. Go to: https://developers.google.com/digital-asset-links/tools/generator
2. Site: `eclaims.deactech.com`
3. App package name: `com.deactech.porscheeclaims`
4. SHA256 fingerprint: `38:C5:ED:13:26:32:A0:BB:56:C4:97:31:44:B3:DC:64:6F:69:5A:C5:57:2F:C6:C7:12:5D:84:70:29:3C:25:75`
5. Click "Test statement"

### 4. Test App Links

After uploading:

1. **Build and install** your Android app
2. **Clear app data** (important for domain verification refresh)  
3. **Test the deeplink**:
   ```bash
   adb shell am start -W -a android.intent.action.VIEW \
   -d "https://eclaims.deactech.com/vehicles?vehicleData=eyJ2aW4iOiJXT..." \
   com.deactech.porscheeclaims
   ```

## ✅ What's Already Configured

### Intent Filters (app.json)
Your app.json already has the correct Android intent filters for:
- `eclaims.deactech.com`
- `staging-eclaims.deactech.com`
- `dev-eclaims.deactech.com`

### URL Patterns Supported
- `https://*/vehicles`
- `https://*/vehicles?vehicleData=...`

## 🔧 Troubleshooting

### If links still open in browser:
1. Verify assetlinks.json is accessible via HTTPS
2. Clear app data and reinstall app
3. Wait 5 minutes for Android domain verification
4. Check server returns proper JSON content-type

### Check domain verification status:
```bash
adb shell pm get-app-links com.deactech.porscheeclaims
```

## 📋 File Contents

### assetlinks.json (Ready to upload):
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.deactech.porscheeclaims",
      "sha256_cert_fingerprints": [
        "38:C5:ED:13:26:32:A0:BB:56:C4:97:31:44:B3:DC:64:6F:69:5A:C5:57:2F:C6:C7:12:5D:84:70:29:3C:25:75"
      ]
    }
  }
]
```

**The main issue was missing Digital Asset Links verification. Once you upload this file to your domains, Android will recognize your app as the handler for these URLs instead of opening them in the browser.**
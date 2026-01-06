# Android App Links Setup Script
# This script helps you configure Digital Asset Links for Android App Links

Write-Host "Android App Links Configuration Helper" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

Write-Host "1. Get Debug Certificate SHA256 Fingerprint:" -ForegroundColor Yellow
Write-Host "   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android"
Write-Host ""

Write-Host "2. Get Release Certificate SHA256 Fingerprint:" -ForegroundColor Yellow
Write-Host "   keytool -list -v -keystore path/to/your/release.keystore -alias your_alias"
Write-Host ""

Write-Host "3. For EAS Build, check your build credentials:" -ForegroundColor Yellow
Write-Host "   eas credentials"
Write-Host ""

Write-Host "4. The assetlinks.json file must be uploaded to:" -ForegroundColor Cyan
Write-Host "   https://eclaims.deactech.com/.well-known/assetlinks.json"
Write-Host "   https://staging-eclaims.deactech.com/.well-known/assetlinks.json"
Write-Host "   https://dev-eclaims.deactech.com/.well-known/assetlinks.json"
Write-Host ""

Write-Host "5. Test the configuration with Google's tool:" -ForegroundColor Cyan
Write-Host "   https://developers.google.com/digital-asset-links/tools/generator"
Write-Host ""

Write-Host "6. Current app.json Android configuration:" -ForegroundColor Magenta
Write-Host "   Intent filters are already configured for Android App Links"
Write-Host "   Package: com.deactech.porscheeclaims"
Write-Host ""

# Check if running from project directory
$currentDir = Get-Location
$appJsonPath = Join-Path $currentDir "app.json"

if (Test-Path $appJsonPath) {
    Write-Host "Found app.json - checking Android configuration..." -ForegroundColor Green
    
    $appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
    $androidIntentFilters = $appJson.expo.android.intentFilters
    
    if ($androidIntentFilters) {
        Write-Host "✓ Android intent filters configured" -ForegroundColor Green
        Write-Host "Configured domains:"
        foreach ($filter in $androidIntentFilters) {
            foreach ($data in $filter.data) {
                Write-Host "  - $($data.scheme)://$($data.host)" -ForegroundColor Cyan
            }
        }
    } else {
        Write-Host "✗ Android intent filters not found" -ForegroundColor Red
    }
} else {
    Write-Host "Run this script from your project root directory" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Get your certificate SHA256 fingerprint using keytool command above"
Write-Host "2. Replace REPLACE_WITH_YOUR_SHA256_FINGERPRINT in docs/assetlinks.json"
Write-Host "3. Upload assetlinks.json to your domains /.well-known/ directory"
Write-Host "4. Test the configuration"
Write-Host "5. Rebuild and test your Android app"
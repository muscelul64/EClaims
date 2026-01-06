# Universal Links Test Script
# Run these commands after the app is installed to verify Universal Links work correctly

Write-Host "Universal Links Test Suite" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""

Write-Host "1. Testing Basic Universal Link:" -ForegroundColor Yellow
Write-Host "adb shell am start -W -a android.intent.action.VIEW -d 'https://eclaims.deactech.com/vehicles' com.deactech.porscheeclaims"
Write-Host ""

Write-Host "2. Testing Universal Link with Vehicle Data:" -ForegroundColor Yellow
Write-Host "adb shell am start -W -a android.intent.action.VIEW -d 'https://eclaims.deactech.com/vehicles?vehicleData=eyJ2aW4iOiJXT1haMTFaMDBQSDAwNjE4MSIsImZvciI6IlBvcnNjaGUiLCJtb2RlbCI6IjkxMSIsInllYXIiOjIwMjIsInBsYXRlTnVtYmVyIjoiQUItMTIzLUtMIiwiaW5zdXJlciI6IlVuaWNhIEFzaWd1cmFyaSIsInBvbGljeSI6Ik1JLTEyMy00NTYiLCJwaG9uZSI6IisxMjM0NTY3ODkwIn0' com.deactech.porscheeclaims"
Write-Host ""

Write-Host "3. Testing Custom Scheme (Should NOT work):" -ForegroundColor Red
Write-Host "adb shell am start -W -a android.intent.action.VIEW -d 'porscheeclaims://vehicles' com.deactech.porscheeclaims"
Write-Host ""

Write-Host "Expected Results:" -ForegroundColor Cyan
Write-Host "✅ Universal Links (1 & 2): Should open the app successfully" -ForegroundColor Green
Write-Host "❌ Custom Scheme (3): Should fail with 'unable to resolve Intent'" -ForegroundColor Red
Write-Host ""

Write-Host "App Status Check:" -ForegroundColor Magenta
$packages = adb shell pm list packages | Select-String "porscheeclaims"
if ($packages) {
    Write-Host "✅ App is installed: $packages" -ForegroundColor Green
} else {
    Write-Host "❌ App is NOT installed. Please build and install the app first." -ForegroundColor Red
    Write-Host ""
    Write-Host "To install the app, you can:" -ForegroundColor Yellow
    Write-Host "1. Build with EAS: eas build --platform android --profile development" -ForegroundColor White
    Write-Host "2. Download and install the APK from EAS dashboard" -ForegroundColor White
    Write-Host "3. Or use: expo run:android (after fixing Android SDK configuration)" -ForegroundColor White
}
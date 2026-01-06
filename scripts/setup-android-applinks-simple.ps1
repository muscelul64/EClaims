# Android App Links Setup Helper
Write-Host "Android App Links Configuration Helper" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

Write-Host "1. Get Debug Certificate SHA256 Fingerprint:" -ForegroundColor Yellow
Write-Host "   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android" -ForegroundColor White
Write-Host ""

Write-Host "2. Get Release Certificate SHA256 Fingerprint:" -ForegroundColor Yellow
Write-Host "   keytool -list -v -keystore path/to/your/release.keystore -alias your_alias" -ForegroundColor White
Write-Host ""

Write-Host "3. For EAS Build, check your build credentials:" -ForegroundColor Yellow
Write-Host "   eas credentials" -ForegroundColor White
Write-Host ""

Write-Host "4. Upload assetlinks.json to these domains:" -ForegroundColor Cyan
Write-Host "   https://eclaims.deactech.com/.well-known/assetlinks.json" -ForegroundColor White
Write-Host "   https://staging-eclaims.deactech.com/.well-known/assetlinks.json" -ForegroundColor White
Write-Host "   https://dev-eclaims.deactech.com/.well-known/assetlinks.json" -ForegroundColor White
Write-Host ""

Write-Host "5. Test with Google Digital Asset Links tool:" -ForegroundColor Cyan
Write-Host "   https://developers.google.com/digital-asset-links/tools/generator" -ForegroundColor White
Write-Host ""

Write-Host "Package: com.deactech.porscheeclaims" -ForegroundColor Magenta
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Get your certificate SHA256 fingerprint using keytool command above" -ForegroundColor White
Write-Host "2. Replace REPLACE_WITH_YOUR_SHA256_FINGERPRINT in docs/assetlinks.json" -ForegroundColor White
Write-Host "3. Upload assetlinks.json to your domains /.well-known/ directory" -ForegroundColor White
Write-Host "4. Test the configuration with Google tool" -ForegroundColor White
Write-Host "5. Rebuild and test your Android app" -ForegroundColor White
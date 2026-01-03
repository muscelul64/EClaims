# Deeplink Test - Single Vehicle Implementation

## Test URLs for Single Vehicle Support

### 1. Basic vehicle deeplink with token
```
porscheeclaims://vehicles/eyJ2ZWhpY2xlSWQiOiJ2ZWhpY2xlMTIzIiwidmluIjoiV1AwWklaelAzREQwMDEyMzQiLCJtYWtlIjoiUG9yc2NoZSIsIm1vZGVsIjoiOTExIENhcnJlcmEifQ==?token=eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJleHBpcmVzQXQiOjE3Mzk5OTk5OTksInNlc3Npb25JZCI6InRlc3Qtc2Vzc2lvbiJ9
```

### 2. Vehicle deeplink with vehicleData query parameter  
```
porscheeclaims://vehicles?vehicleData=eyJ2ZWhpY2xlSWQiOiJ2ZWhpY2xlMTIzIiwidmluIjoiV1AwWklaelAzREQwMDEyMzQiLCJtYWtlIjoiUG9yc2NoZSIsIm1vZGVsIjoiOTExIENhcnJlcmEifQ==&token=eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJleHBpcmVzQXQiOjE3Mzk5OTk5OTksInNlc3Npb25JZCI6InRlc3Qtc2Vzc2lvbiJ9
```

### 3. Universal link format
```
https://eclaims.deactech.com/vehicles/eyJ2ZWhpY2xlSWQiOiJ2ZWhpY2xlMTIzIiwidmluIjoiV1AwWklaelAzREQwMDEyMzQiLCJtYWtlIjoiUG9yc2NoZSIsIm1vZGVsIjoiOTExIENhcnJlcmEifQ==?token=eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJleHBpcmVzQXQiOjE3Mzk5OTk5OTksInNlc3Npb25JZCI6InRlc3Qtc2Vzc2lvbiJ9
```

## Expected Behavior

When a user opens any of these links:
1. **With valid token**: App should authenticate the user, decode the vehicle data, clear all existing vehicles, and add only the specified vehicle
2. **Vehicle processing**: Clear entire vehicle database, add only the deeplink vehicle, then show it
3. **Single vehicle mode**: Database should contain exactly one vehicle (the one from deeplink)
4. **Without token**: App should require login and show all vehicles normally
5. **Invalid token**: App should show error message and redirect to login
6. **Invalid vehicle data**: App should show error for malformed base64 or invalid vehicle JSON

## Changes Made

1. **URL Parsing**: Changed from `vehicleId` string to `vehicleData` base64-encoded vehicle object
2. **User Store**: Updated to store decoded vehicle data object instead of simple ID
3. **Vehicle Database**: Clear all existing vehicles and add only the deeplink vehicle
4. **Restriction Banner**: Updated to show vehicle make/model from decoded data
5. **Auth Hook**: Added base64 decoding and JSON parsing for vehicle data
6. **Validation**: Added error handling for malformed base64 and invalid JSON
7. **Database Reset**: Clear entire vehicles table before adding deeplink vehicle
8. **Single Vehicle Mode**: Ensure database contains exactly one vehicle

## URL Parameter Mapping

| Old Format | New Format |
|------------|------------|
| `vehicleIds=id1,id2,id3` | `vehicleData=eyJ2ZWhpY2xlSWQ...` (base64) |
| `porscheeclaims://vehicles/id1,id2,id3` | `porscheeclaims://vehicles/eyJ2ZWhpY2xlSWQ...` |
| Array handling in stores | Base64 decode + JSON parse |

## Implementation Flow

```typescript
// Deeplink processing flow
1. Parse deeplink URL and extract vehicleData parameter
2. Decode base64 to get vehicle JSON object
3. Validate vehicle data structure
4. Clear all existing vehicles from database
5. Add the single vehicle from deeplink data
6. Update vehicles store with single vehicle
7. Set vehicle restriction in user store (optional since only one exists)
8. Navigate to vehicles screen (single vehicle view)
```

## Vehicle Data Format (before base64 encoding)

```json
{
  "vehicleId": "vehicle123",
  "vin": "WP0ZZZ99ZDD001234",
  "make": "Porsche",
  "model": "911 Carrera",
  "year": 2024,
  "licensePlate": "ABC123"
}
```

## Testing Steps

### Basic Flow
1. Install app and add multiple test vehicles
2. Send test deeplink via ADB or messaging app
3. Verify all previous vehicles are cleared from database
4. Confirm only the deeplink vehicle exists in database
5. Check that vehicle list shows exactly one vehicle
6. Verify restriction banner is not needed (only one vehicle exists)

### Database State Testing
1. **Test with existing vehicles**: Start with multiple vehicles in database
   - Should clear all existing vehicles
   - Should add only the deeplink vehicle
2. **Test vehicle replacement**: Send different deeplink after first one
   - Should replace the current vehicle with new one
   - Database should still contain exactly one vehicle
3. **Test normal app usage**: Open app normally after deeplink usage
   - Should show all user's vehicles (normal database state)
   - Deeplink mode should be temporary
4. **Test data validation**: Send deeplink with incomplete vehicle data
   - Should not clear existing vehicles if validation fails
   - Should show appropriate error messages
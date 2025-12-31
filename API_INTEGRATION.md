# Statement Submission API Integration

## API Endpoint
```
POST http://drivesafewabapi.deactec.com/statements
```

## Headers
```
Content-Type: application/json
Authorization: Bearer <token> (if available)
```

## Complete Payload Example

```json
{
  "id": "statement_1735689600000",
  "type": "accident",
  "status": "submitted",
  "incidentDate": "2024-12-31T10:30:00.000Z",
  "description": "Collision at intersection while making left turn",
  "location": {
    "latitude": 44.4268,
    "longitude": 26.1025,
    "address": "Piața Victoriei, București, Romania",
    "timestamp": "2024-12-31T10:30:00.000Z"
  },
  "vehicle": {
    "id": "vehicle_123",
    "make": "Porsche",
    "model": "911 Carrera",
    "year": 2023,
    "licensePlate": "B123ABC",
    "vin": "WP0AB2A98NS123456",
    "color": "Guards Red",
    "fuelType": "gasoline",
    "insuranceCompany": "Allianz Romania",
    "policyNumber": "POL123456789"
  },
  "damages": [
    {
      "id": "damage_001",
      "area": "front_bumper",
      "severity": "moderate",
      "description": "Scratches and dent on front bumper",
      "photoCount": 3
    },
    {
      "id": "damage_002",
      "area": "headlight_left",
      "severity": "severe",
      "description": "Broken left headlight",
      "photoCount": 2
    }
  ],
  "photos": [
    {
      "id": "photo_001",
      "type": "damage",
      "timestamp": "2024-12-31T10:35:00.000Z",
      "location": {
        "latitude": 44.4268,
        "longitude": 26.1025
      }
    },
    {
      "id": "photo_002",
      "type": "license",
      "timestamp": "2024-12-31T10:37:00.000Z",
      "location": {
        "latitude": 44.4268,
        "longitude": 26.1025
      }
    },
    {
      "id": "photo_003",
      "type": "id",
      "timestamp": "2024-12-31T10:38:00.000Z"
    }
  ],
  "involvedParties": [
    {
      "type": "driver",
      "name": "Ion Popescu",
      "phone": "+40712345678",
      "isInsured": true,
      "insuranceCompany": "Generali Romania"
    }
  ],
  "circumstances": {
    "type": "intersection_collision",
    "weather": ["clear", "dry"],
    "roadConditions": ["good", "urban"],
    "speed": "30-50 km/h",
    "description": "Other driver ran red light while I was making a legal left turn"
  },
  "isEmergencyServicesInvolved": true,
  "policeReportNumber": "POL2024123456",
  "witnessInfo": [
    {
      "name": "Maria Ionescu",
      "phone": "+40723456789",
      "statement": "I saw the other car run the red light"
    }
  ],
  "createdAt": "2024-12-31T10:30:00.000Z",
  "updatedAt": "2024-12-31T11:00:00.000Z",
  "submittedAt": "2024-12-31T11:00:00.000Z",
  "deviceInfo": {
    "platform": "react-native",
    "version": "1.0.0",
    "appVersion": "1.0.0"
  }
}
```

## Expected Response

### Success Response (200)
```json
{
  "statementId": "statement_1735689600000",
  "status": "received",
  "confirmationNumber": "CONF-2024-001234",
  "message": "Statement received successfully",
  "estimatedProcessingTime": "2-3 business days",
  "nextSteps": [
    "Photos will be processed within 24 hours",
    "Insurance assessment will be scheduled",
    "You will receive updates via SMS/email"
  ]
}
```

### Error Response (400/500)
```json
{
  "error": true,
  "message": "Invalid vehicle VIN format",
  "code": "INVALID_VIN",
  "details": {
    "field": "vehicle.vin",
    "received": "INVALID_VIN",
    "expected": "17-character VIN"
  }
}
```

## Photo Upload Endpoint
```
POST http://drivesafewabapi.deactec.com/statements/{statementId}/photos
Content-Type: multipart/form-data
```

### Form Data Structure:
- `statementId`: Statement ID
- `photos`: Array of image files
- `photoData_{index}`: JSON metadata for each photo

## Implementation Notes

1. **Date Formats**: All dates are converted to ISO 8601 format (UTC)
2. **Photo Handling**: Photos are uploaded separately after statement submission
3. **Error Handling**: API errors are caught and handled with user-friendly messages
4. **Retry Logic**: Automatic retry on network failures
5. **Offline Support**: Statements are saved locally and retried when connection is restored

## Usage in App

The statement submission is now integrated into the existing store:

```typescript
// In your component
const { submitStatement, isLoading, currentStatement } = useStatementsStore();

try {
  const result = await submitStatement();
  console.log('Confirmation:', result.confirmationNumber);
} catch (error) {
  console.error('Submission failed:', error.message);
}
```
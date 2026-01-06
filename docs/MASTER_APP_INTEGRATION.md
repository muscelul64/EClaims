# Master App Integration Documentation

## Overview

The Porsche E-Claims mobile app is designed to integrate seamlessly with a master Porsche app that handles user authentication. This integration allows users to authenticate once in the master app and access E-Claims without additional login requirements.

## Architecture

### Authentication Flow
1. **Master App Launch**: The master app launches E-Claims with authentication tokens
2. **Token Validation**: E-Claims validates the received token with the backend
3. **Session Management**: The app maintains the authenticated session and handles token refresh
4. **Secure Communication**: All communication between apps uses secure deeplinks

### Components

#### 1. Master App Integration (`utils/master-app-integration.ts`)
Central coordinator for master app communication:
- Handles authentication callbacks from master app
- Manages token refresh requests
- Provides session synchronization
- Validates and processes authentication tokens

#### 2. Enhanced User Store (`stores/use-user-store.ts`)
Extended to support external authentication:
- `setExternalAuth()`: Authenticate with master app token
- `validateToken()`: Check token validity with expiration buffer
- `refreshTokenIfNeeded()`: Automatic token refresh management
- Enhanced User interface with token and session data

#### 3. Enhanced Auth Hook (`hooks/use-auth.ts`)
Updated authentication hook:
- `loginWithExternalToken()`: Master app token authentication
- `tokenValid`: Real-time token validity status
- Automatic token refresh monitoring
- Universal Link authentication integration

#### 4. Enhanced API Layer (`utils/api/base.ts`, `utils/api/auth.ts`)
Backend communication with token support:
- Automatic token inclusion in API requests
- Master app authentication headers
- Token validation endpoints
- Token refresh capabilities

## Universal Link Protocols

### Authentication Universal Links
```
https://eclaims.deactech.com/master-auth?token=<JWT_TOKEN>&userInfo=<BASE64_USER_DATA>
```
**Purpose**: Receive authentication from master app
**Parameters**:
- `token`: JWT or encoded authentication token
- `userInfo`: Base64 encoded user information (optional)
- `sessionId`: Master app session identifier (optional)

### Token Refresh Universal Links
```
https://eclaims.deactech.com/token-refresh?token=<NEW_TOKEN>&userInfo=<USER_DATA>
```
**Purpose**: Receive refreshed tokens from master app
**Parameters**:
- `token`: New authentication token
- `userInfo`: Updated user information (optional)

### Session Sync Universal Links
```
https://eclaims.deactech.com/session-sync
```
**Purpose**: Synchronize session state with master app
**Response**: Returns current session data to master app

## Master App Communication

### Request Authentication
```typescript
// E-Claims requests authentication from master app
const url = 'porsche-master-app://request-auth?requestingApp=deactech-eclaims&context=login';
await Linking.openURL(url);
```

### Request Token Refresh
```typescript
// E-Claims requests token refresh
const url = 'porsche-master-app://refresh-token?sessionId=<SESSION_ID>&currentToken=<TOKEN>';
await Linking.openURL(url);
```

### Callback Notifications
```typescript
// E-Claims notifies master app of events
const url = 'porsche-master-app://eclaims-callback?action=auth-success&data=<BASE64_DATA>';
await Linking.openURL(url);
```

## Token Format

### JWT Token Structure
```json
{
  \"sub\": \"user-id\",
  \"iat\": 1641024000,
  \"exp\": 1641110400,
  \"scope\": \"claims:read claims:write vehicles:read\",
  \"sessionId\": \"session_123456789\",
  \"masterApp\": \"porsche-master-v1.0\"
}
```

### Custom Token Format
```json
{
  \"userId\": \"user-id\",
  \"expiresAt\": 1641110400000,
  \"issuedAt\": 1641024000000,
  \"scope\": [\"claims:read\", \"claims:write\", \"vehicles:read\"],
  \"sessionId\": \"session_123456789\"
}
```

## Configuration

### App Configuration (`app.json`)
```json
{
  "expo": {
    "ios": {
      "associatedDomains": ["applinks:eclaims.deactech.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            { "scheme": "https", "host": "eclaims.deactech.com" }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Master App Integration Setup
```typescript
// Initialize in app root layout
masterAppIntegration.configure({
  masterAppScheme: 'porsche-master-app',
  callbackAction: 'eclaims-callback',
  requiresTokenValidation: true,
});
masterAppIntegration.initialize();
```

## Usage Examples

### 1. Handle Master App Authentication
```typescript
import { useAuth } from '@/hooks/use-auth';

const { loginWithExternalToken } = useAuth();

// In Universal Link handler
const result = await loginWithExternalToken(token, userInfo);
if (result.success) {
  console.log('Authenticated via master app');
}
```

### 2. Check Master App Availability
```typescript
import { isMasterAppAvailable } from '@/utils/master-app-integration';

const available = await isMasterAppAvailable();
if (available) {
  // Show master app login option
}
```

### 3. Request Authentication
```typescript
import { requestMasterAppAuth } from '@/utils/master-app-integration';

// Request authentication from master app
await requestMasterAppAuth('login');
```

### 4. Monitor Token Validity
```typescript
import { useAuth } from '@/hooks/use-auth';

const { tokenValid, refreshTokenIfNeeded } = useAuth();

// Check token status
if (!tokenValid) {
  const refreshed = await refreshTokenIfNeeded();
  if (!refreshed) {
    // Handle authentication failure
  }
}
```

## Security Considerations

1. **Token Validation**: All tokens are validated with the backend before acceptance
2. **Expiration Handling**: Tokens include expiration times with buffer validation
3. **Secure Transmission**: All sensitive data is base64 encoded in deeplinks
4. **Session Tracking**: Each session has unique identifiers for audit trails
5. **Scope Limitations**: Tokens include scope restrictions for permission control

## Error Handling

### Authentication Errors
- Invalid token format
- Expired tokens
- Backend validation failures
- Master app communication failures

### Fallback Mechanisms
- Manual login when master app unavailable
- Token refresh via master app
- Graceful degradation to standard authentication

## Testing

### Integration Testing
1. Test master app authentication flow
2. Verify token validation with backend
3. Test token refresh scenarios
4. Validate session synchronization
5. Test error handling and fallbacks

### Deeplink Testing
```bash
# Test authentication deeplink
adb shell am start -W -a android.intent.action.VIEW -d \"porscheeclaims://master-auth?token=test_token\" com.porsche.eclaims

# Test iOS universal link
xcrun simctl openurl booted \"https://eclaims.deactech.com/master-auth?token=test_token\"
```
### Integration Testing Components

#### Master App Test Screen (`app/master-app-test.tsx`)
Interactive testing interface for master app integration:

**Features:**
- Master app availability detection
- Authentication flow testing
- Token refresh simulation
- Manual token authentication testing
- Real-time status monitoring

**Usage:**
```typescript
// Navigate to test screen (development only)
router.push('/master-app-test');
```

**Test Scenarios:**
1. **Master App Detection**: Check if master app is installed
2. **Authentication Request**: Request auth from master app
3. **Token Refresh**: Test token renewal process
4. **Manual Token**: Test with custom token data
5. **Session Sync**: Verify session synchronization

#### Example Test Flow:
```javascript
// 1. Check master app availability
const available = await isMasterAppAvailable();
console.log('Master app available:', available);

// 2. Request authentication
if (available) {
  await requestMasterAppAuth('test');
  // Master app should callback with token
}

// 3. Test manual authentication
const testToken = btoa(JSON.stringify({
  userId: 'test-user',
  expiresAt: Date.now() + 3600000,
  sessionId: 'test-session'
}));

const result = await loginWithExternalToken(testToken, {
  id: 'test-user',
  name: 'Test User',
  email: 'test@porsche.com'
});

// 4. Verify API calls work with token
const statement = { /* statement data */ };
const apiResult = await submitStatement(statement);
```
## Production Checklist

- [ ] Backend token validation endpoint implemented
- [ ] Master app communication protocols tested
- [ ] Token refresh mechanism verified
- [ ] Error handling scenarios tested
- [ ] Security audit completed
- [ ] Performance testing with token operations
- [ ] Documentation updated for master app team
- [ ] Monitoring and logging configured

## API Integration with Master App Authentication

### Statements API (`utils/api/statements.ts`)
The statements API is fully integrated with the master app authentication system:

**Key Features:**
- Automatic authentication token inclusion from storage
- Master app session tracking in API headers
- Secure statement submission with user context
- Photo upload with authenticated access

**API Endpoints:**
```typescript
// Submit insurance statement
submitStatement(statement, parties, circumstances, token?) 
-> POST /statements with Bearer token

// Get statement processing status  
getStatementStatus(statementId, token?)
-> GET /statements/{id}/status with Bearer token

// Upload statement photos
uploadStatementPhotos(statementId, photos, token?)
-> POST /statements/{id}/photos with Bearer token and FormData
```

**Authentication Headers:**
```
Authorization: Bearer {master_app_token}
X-Master-App-Auth: true
Content-Type: application/json
User-Agent: deactech-eclaims-mobile/{platform}
```

### Automatic Token Management
All API calls automatically include authentication tokens from the master app:

```typescript
// Tokens are automatically retrieved from storage
const headers = await createApiHeaders(customToken);

// Headers include:
// - Bearer token from master app
// - Master app authentication flag
// - Platform identification
// - Content type for JSON/FormData
```

### Backend Validation Requirements
The backend must validate master app tokens:

```json
// Token validation request
POST /Auth/ValidateExternalToken
{
  "token": "jwt_or_encoded_token",
  "masterAppUserId": "user_id_from_master_app"
}

// Expected response
{
  "valid": true,
  "user": {
    "id": "user_id",
    "email": "user@porsche.com", 
    "name": "User Name",
    "profile": { ... }
  },
  "expiresAt": 1641110400000,
  "permissions": ["claims:read", "claims:write"]
}
```

### Error Handling
API calls handle authentication errors gracefully:

- **401 Unauthorized**: Token expired or invalid → Trigger token refresh
- **403 Forbidden**: Insufficient permissions → Show permission error
- **Network Errors**: Connection issues → Retry with exponential backoff
- **Master App Unavailable**: Fallback to manual authentication

### Usage Examples

**Submit Statement with Master App Token:**
```typescript
import { submitStatement } from '@/utils/api/statements';
import { useAuth } from '@/hooks/use-auth';

const { authToken } = useAuth();
const result = await submitStatement(statement, parties, circumstances, authToken);
```

**Automatic Token from Storage:**
```typescript
// Token is automatically retrieved from AsyncStorage
const result = await submitStatement(statement, parties, circumstances);
// No need to pass token explicitly
```

**Manual Token Override:**
```typescript
// Use specific token (e.g., for testing)
const result = await submitStatement(statement, parties, circumstances, customToken);
```
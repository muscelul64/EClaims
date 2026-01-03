# Authentication Token DeepLink System

This document explains how to use the authentication token system for secure deeplinks in the Porsche E-Claims mobile app.

## Overview

The authentication token system allows you to create secure deeplinks that:
- Automatically authenticate users when they click the link
- Have time-limited access (configurable expiration)
- Include scoped permissions (read/write controls)
- Validate the target user identity
- Provide seamless user experience without manual login

## Quick Start

### 1. Basic Secure Link Creation

```typescript
import { createSecureUniversalLink } from '@/utils/auth-token';

// Create a secure link for a specific user
const secureLink = createSecureUniversalLink(
  'statement',           // Action/route
  'targetUserId',        // User ID who will use this link
  { statementId: '123' },// Parameters
  {                      // Options
    expiresInMinutes: 120,
    scope: ['statement:read']
  }
);
```

### 2. Using the Secure Share Manager

```typescript
import { secureShareManager } from '@/utils/secure-share';

// Share a statement with authentication required
const success = await secureShareManager.shareStatement(
  'statement-123',
  'view',
  {
    requireAuth: true,
    expiresInMinutes: 60,
    scope: ['statement:read']
  }
);
```

## Core Components

### AuthTokenManager (`utils/auth-token.ts`)

The main class responsible for token generation, validation, and authentication.

#### Key Methods:

- `generateSecureToken()` - Create a new authentication token
- `createSecureDeepLink()` - Generate secure custom scheme URL
- `createSecureUniversalLink()` - Generate secure universal link
- `parseTokenFromUrl()` - Extract and parse token from URL

#### Token Structure:

```typescript
interface AuthToken {
  token: string;        // The actual token value
  userId: string;       // Target user identifier
  expiresAt: number;    // Expiration timestamp
  scope?: string[];     // Permission scopes
}
```

### SecureShareManager (`utils/secure-share.ts`)

High-level sharing utilities with built-in authentication support.

#### Available Methods:

- `shareStatement()` - Share insurance statements
- `shareVehicle()` - Share vehicle information
- `shareSecureLogin()` - Send login invitations
- `shareDamageAssessmentSecure()` - Share damage assessments
- `shareEmergencyInfoSecure()` - Share emergency contacts

## Usage Examples

### Example 1: Sharing a Statement with Time Limit

```typescript
import { secureShareManager } from '@/utils/secure-share';

// Share a statement that expires in 2 hours
const shareStatement = async () => {
  await secureShareManager.shareStatement(
    'statement-456',
    'edit',
    {
      requireAuth: true,
      expiresInMinutes: 120,       // 2 hours
      scope: ['statement:read', 'statement:write']
    }
  );
};
```

### Example 2: Inviting a User with Secure Login

```typescript
// Send a secure login invitation
const inviteUser = async () => {
  await secureShareManager.shareSecureLogin(
    'newuser@example.com',
    {
      expiresInMinutes: 24 * 60,   // 24 hours
      scope: ['login', 'profile:read']
    }
  );
};
```

### Example 3: Custom Secure Link Generation

```typescript
import { createSecureUniversalLink, generateSecureToken } from '@/utils/auth-token';

// Generate a custom secure link
const createCustomLink = (targetUserId: string) => {
  return createSecureUniversalLink(
    'damage-assessment',
    targetUserId,
    {
      vehicleId: 'vehicle-789',
      type: 'comprehensive',
      priority: 'high'
    },
    {
      expiresInMinutes: 180,       // 3 hours
      scope: [
        'damage:read',
        'damage:write',
        'photos:upload',
        'reports:generate'
      ]
    }
  );
};
```

### Example 4: QR Code Generation with Authentication

```typescript
import { secureShareManager } from '@/utils/secure-share';

// Generate QR code data for secure sharing
const generateQRCode = (targetUserId: string) => {
  const qrData = secureShareManager.generateSecureQRData(
    'emergency-info',
    targetUserId,
    { location: 'roadside' },
    {
      expiresInMinutes: 7 * 24 * 60, // 1 week
      scope: ['emergency:read']
    }
  );
  
  // Use qrData with your QR code library
  return qrData;
};
```

## URL Format Examples

### Custom Scheme with Token
```
porscheeclaims://statement/statementId/123/mode/view?token=valid_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Universal Link with Token
```
https://eclaims.porsche.com/vehicle/vehicleId/456/action/edit?token=valid_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Login Invitation Link
```
https://eclaims.porsche.com/login/userId/newuser@example.com/invitedBy/admin?token=valid_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Permission Scopes

The system supports granular permission scopes:

### Available Scopes:

- `login` - Allow authentication
- `profile:read` - Read user profile
- `profile:write` - Modify user profile
- `statement:read` - View insurance statements
- `statement:write` - Create/edit statements
- `vehicle:read` - View vehicle information
- `vehicle:write` - Create/edit vehicles
- `damage:read` - View damage assessments
- `damage:write` - Create/edit damage reports
- `photos:upload` - Upload photos
- `emergency:read` - Access emergency contacts
- `reports:generate` - Generate reports

### Scope Usage Example:

```typescript
const link = createSecureUniversalLink(
  'vehicle',
  'user123',
  { vehicleId: '456' },
  {
    scope: [
      'vehicle:read',      // Can view vehicle
      'damage:read',       // Can view damage info
      'photos:upload'      // Can upload photos
      // Notably missing 'vehicle:write' - read-only access
    ]
  }
);
```

## Security Considerations

### Token Expiration
- Always set reasonable expiration times
- Use shorter expirations for sensitive operations
- Default expiration is 24 hours if not specified

### Scope Limitations
- Only grant minimum necessary permissions
- Use read-only scopes when possible
- Validate scopes on the backend

### Token Validation
- Tokens are validated on both client and server
- Expired tokens are automatically rejected
- Invalid tokens redirect to login

### Backend Integration

In production, replace the mock validation with actual API calls:

```typescript
// In utils/auth-token.ts, replace validateTokenWithBackend()
private async validateTokenWithBackend(token: AuthToken) {
  const response = await fetch('/api/auth/validate-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token.token })
  });
  
  return response.json();
}
```

## Testing

### Using the Demo Component

The app includes a demo component (`AuthDeepLinkDemo`) that shows all authentication token features:

1. Navigate to the main screen
2. Find the "Secure Sharing Features" section
3. Test different sharing scenarios
4. View generated secure links

### Using the Test Screen

Access the dedicated test screen:

```
porscheeclaims://auth-deeplink-test
```

This screen provides:
- Token generation testing
- Secure link creation
- URL parsing validation
- Expiration testing

## Troubleshooting

### Common Issues:

1. **"Authentication Required" errors**
   - Ensure user is logged in before creating secure links
   - Check user store authentication state

2. **Token validation failures**
   - Verify token hasn't expired
   - Check token format and structure
   - Ensure backend validation is working

3. **Permission denied errors**
   - Verify user has required scopes
   - Check scope definitions match backend

4. **Links not working**
   - Test URL parsing with test utilities
   - Verify app.json configuration
   - Check deeplink handler registration

### Debug Mode:

Enable detailed logging:

```typescript
console.log('Token validation:', token);
console.log('User authentication:', user?.authenticated);
console.log('Generated link:', secureLink);
```

## Integration with Existing Features

### Adding Authentication to Existing Shares

1. **Update existing share calls:**

```typescript
// Before
shareManager.shareStatement('123', 'view');

// After
secureShareManager.shareStatement('123', 'view', {
  requireAuth: true,
  expiresInMinutes: 60
});
```

2. **Add secure options to forms:**

```typescript
const [requireAuth, setRequireAuth] = useState(false);
const [expiryMinutes, setExpiryMinutes] = useState(60);

// Use in share calls
if (requireAuth) {
  await secureShareManager.shareStatement(id, mode, {
    requireAuth: true,
    expiresInMinutes: expiryMinutes
  });
} else {
  await shareManager.shareStatement(id, mode);
}
```

## Best Practices

1. **Always use HTTPS** for universal links in production
2. **Implement proper backend validation** for all tokens
3. **Use minimal scopes** for each sharing scenario
4. **Set appropriate expiration times** based on use case
5. **Log security events** for monitoring and debugging
6. **Validate user permissions** before generating tokens
7. **Handle token expiration gracefully** with user feedback
8. **Test thoroughly** with different user scenarios

## Future Enhancements

- JWT token support with proper signing
- Refresh token mechanism
- Token revocation system
- Advanced permission hierarchy
- Audit logging for security events
- Multi-factor authentication support
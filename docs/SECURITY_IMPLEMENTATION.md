# Security Implementation Guide
## Secure Communication for Deeplinks and Authentication

This document outlines the security measures implemented for protecting sensitive data in deeplink communication between the Master App and Porsche E-Claims app.

## Overview

The security implementation provides encryption for:
- Authentication tokens passed via deeplinks
- Vehicle data transmitted between applications
- Payload integrity verification
- Token expiration and validation

## Components

### 1. SecureCommunication Class
Located: `utils/secure-communication.ts`

**Purpose**: Handles AES-256 encryption/decryption for sensitive data transmission.

**Features**:
- AES-256 encryption with random IV generation
- PBKDF2 key derivation for enhanced security
- HMAC-SHA256 signatures for data integrity
- Timestamp validation to prevent replay attacks
- Base64 encoding for URL-safe transmission

**Usage**:
```typescript
import { secureCommunication } from '@/utils/secure-communication';

// Encrypt vehicle data for deeplink
const secureVehicleData = secureCommunication.secureVehicleData(vehicleInfo);

// Decrypt received data
const vehicleData = secureCommunication.extractVehicleData(encryptedData);
```

### 2. SecureJWTManager Class
Located: `utils/secure-communication.ts`

**Purpose**: Creates and validates encrypted JWT-style tokens for authentication.

**Features**:
- Encrypted header and payload
- HMAC signature verification
- Expiration time validation
- Issuer verification

**Usage**:
```typescript
import { secureJWT } from '@/utils/secure-communication';

// Create secure token
const token = secureJWT.createToken({ userId: '123', role: 'user' });

// Verify token
const result = secureJWT.verifyToken(token);
if (result) {
  console.log('User ID:', result.payload.userId);
}
```

### 3. Enhanced Deeplink Handler
Located: `utils/deeplink.ts`

**Purpose**: Processes secure and legacy deeplinks with automatic fallback.

**Features**:
- Secure token parsing with fallback to legacy methods
- Encrypted vehicle data processing
- Backward compatibility with existing implementations
- Error handling and security validation

## Security Mechanisms

### 1. Encryption Process

```typescript
// Data encryption flow:
1. Generate random IV (16 bytes)
2. Derive encryption key using PBKDF2(sharedSecret, IV, 1000 iterations)
3. Encrypt JSON data using AES-256-CBC
4. Create HMAC-SHA256 signature for integrity
5. Package data, IV, timestamp, and signature
6. Encode as Base64 for URL transmission
```

### 2. Decryption Process

```typescript
// Data decryption flow:
1. Decode Base64 payload
2. Validate timestamp (max age: 5 minutes)
3. Verify HMAC signature
4. Recreate encryption key using stored shared secret and IV
5. Decrypt data using AES-256-CBC
6. Parse and return JSON data
```

### 3. Token Security

**Secure Token Structure**:
```typescript
{
  header: { alg: 'AES256', typ: 'SEJWT', created: timestamp },
  payload: { userId, exp, iat, iss: 'porsche-eclaims', ...data },
  signature: HMAC-SHA256(encryptedHeader + encryptedPayload, sharedSecret)
}
```

## Configuration

### Environment Variables
Create or update your environment configuration:

```bash
# .env or app.config.js
EXPO_PUBLIC_SHARED_SECRET=your-secure-shared-secret-key-here-2026

# For production, use a strong, randomly generated key
EXPO_PUBLIC_SHARED_SECRET=A8mK9$pQrS3tUvWxYz2B5cDfGhJkLmNpQrStUvWxYz2B5c
```

### Shared Secret Management
**Development**: Use a default key defined in the configuration
**Production**: Use environment-specific secrets stored securely
**Key Rotation**: Implement key versioning for seamless rotation

## Implementation Examples

### 1. Secure Vehicle Data Transmission

**Master App (Sender)**:
```typescript
import { secureCommunication } from './secure-communication';

const vehicleData = {
  make: 'Porsche',
  model: '911',
  year: 2024,
  vin: 'WP0CA2A89KS123456'
};

const encryptedData = secureCommunication.secureVehicleData(vehicleData);
const deeplinkUrl = `porscheeclaims://vehicles?vehicleData=${encryptedData}`;

// Launch E-Claims app
Linking.openURL(deeplinkUrl);
```

**E-Claims App (Receiver)**:
```typescript
// Automatic handling in deeplink processor
// Secure decryption with fallback to legacy base64
const vehicleData = secureCommunication.extractVehicleData(params.vehicleData);
```

### 2. Secure Authentication Token

**Master App**:
```typescript
import { secureJWT } from './secure-communication';

const authPayload = {
  userId: 'user123',
  role: 'premium',
  permissions: ['view', 'edit', 'create']
};

const secureToken = secureJWT.createToken(authPayload, 24); // 24 hours
const deeplinkUrl = `porscheeclaims://home?token=${secureToken}`;

Linking.openURL(deeplinkUrl);
```

**E-Claims App**:
```typescript
// Automatic token validation in deeplink handler
// Supports both secure and legacy token formats
```

## Migration Strategy

### Phase 1: Dual Support (Current)
- Implement secure encryption alongside existing base64 encoding
- Deeplink handler tries secure decryption first, falls back to legacy
- Maintain backward compatibility with existing integrations

### Phase 2: Security Validation
- Add security warnings for unencrypted data
- Log security events for monitoring
- Validate production encryption usage

### Phase 3: Full Security (Future)
- Remove legacy base64 fallback
- Require encryption for all sensitive data
- Implement certificate pinning for additional security

## Security Best Practices

### 1. Key Management
- Use different keys for different environments (dev/staging/prod)
- Rotate keys regularly (recommended: every 6 months)
- Store keys securely (environment variables, secure vaults)
- Never commit keys to source control

### 2. Data Protection
- Encrypt all sensitive data in deeplinks
- Use short token expiration times (max 24 hours)
- Validate timestamps to prevent replay attacks
- Implement proper error handling without exposing internals

### 3. Monitoring
- Log security events (encryption failures, invalid tokens)
- Monitor for unusual deeplink patterns
- Track token usage and expiration
- Alert on security violations

## Testing

### 1. Security Testing Commands

```bash
# Test secure vehicle data
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "porscheeclaims://vehicles?vehicleData=ENCRYPTED_DATA_HERE" \
  com.deactech.porscheeclaims

# Test secure token
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "porscheeclaims://home?token=SECURE_JWT_TOKEN_HERE" \
  com.deactech.porscheeclaims
```

### 2. Security Validation

```typescript
// Test encryption/decryption
import { secureCommunication } from '@/utils/secure-communication';

const testData = { make: 'Porsche', model: '911' };
const encrypted = secureCommunication.encryptData(testData);
const decrypted = secureCommunication.decryptData(encrypted);

console.log('Original:', testData);
console.log('Encrypted:', encrypted);
console.log('Decrypted:', decrypted);
console.log('Match:', JSON.stringify(testData) === JSON.stringify(decrypted));
```

## Troubleshooting

### Common Issues

1. **Decryption Failures**
   - Check shared secret configuration
   - Verify environment variables are set
   - Ensure Base64 encoding is valid

2. **Token Validation Errors**
   - Check token expiration times
   - Verify signature with correct shared secret
   - Validate token format structure

3. **Legacy Compatibility**
   - Secure decryption will fail gracefully to legacy base64
   - Monitor logs for fallback usage
   - Plan migration timeline for full security

## Performance Considerations

- Encryption adds ~50-100ms processing time
- Encrypted payloads are ~30% larger than plain text
- PBKDF2 key derivation adds security but requires more CPU
- Consider caching encryption keys for better performance

## Security Audit Checklist

- [ ] Shared secrets configured for all environments
- [ ] Token expiration times appropriate for use case
- [ ] Error handling doesn't expose sensitive information
- [ ] Logging captures security events without exposing keys
- [ ] Legacy fallback is temporary and monitored
- [ ] Production keys are properly secured and rotated
- [ ] All sensitive deeplink data is encrypted
- [ ] Token signature verification is working correctly
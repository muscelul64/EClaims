import Foundation
import CryptoKit
import CommonCrypto

/**
 * Secure Communication Utility for iOS Master App
 * Matches the encryption implementation in Porsche E-Claims React Native app
 */

public class SecureCommunication {
    
    // MARK: - Configuration
    
    private let sharedSecret: String
    private let iterations: Int = 1000
    
    public init(sharedSecret: String = "P0rsch3-ECl41ms-S3cur3-K3y-D3v3l0pm3nt-2026!@#") {
        self.sharedSecret = sharedSecret
    }
    
    // MARK: - Public Methods
    
    /**
     * Encrypt vehicle data for secure deeplink transmission
     */
    public func encryptVehicleData(_ vehicleData: [String: Any]) throws -> String {
        let payload = [
            "vehicleData": vehicleData,
            "source": "master-app",
            "version": "1.0"
        ]
        
        return try encryptData(payload)
    }
    
    /**
     * Create secure authentication token
     */
    public func createSecureAuthToken(userId: String, expirationMinutes: Int = 60) throws -> String {
        let authData: [String: Any] = [
            "userId": userId,
            "expiresAt": Date().timeIntervalSince1970 * 1000 + Double(expirationMinutes * 60 * 1000),
            "issuedAt": Date().timeIntervalSince1970 * 1000,
            "nonce": UUID().uuidString,
            "iss": "porsche-master-app"
        ]
        
        return try encryptData(authData)
    }
    
    /**
     * Generate secure deeplink URL
     */
    public func generateSecureDeeplink(vehicleData: [String: Any], authToken: String? = nil) throws -> URL {
        let encryptedVehicleData = try encryptVehicleData(vehicleData)
        
        var components = URLComponents()
        components.scheme = "porscheeclaims"
        components.host = "vehicles"
        
        var queryItems = [
            URLQueryItem(name: "vehicleData", value: encryptedVehicleData)
        ]
        
        if let authToken = authToken {
            queryItems.append(URLQueryItem(name: "token", value: authToken))
        }
        
        components.queryItems = queryItems
        
        guard let url = components.url else {
            throw SecureCommunicationError.urlGenerationFailed
        }
        
        return url
    }
    
    // MARK: - Private Methods
    
    /**
     * Encrypt data using AES-256-CBC with PBKDF2 key derivation
     */
    private func encryptData(_ data: [String: Any]) throws -> String {
        let jsonData = try JSONSerialization.data(withJSONObject: data, options: [])
        let timestamp = Int64(Date().timeIntervalSince1970 * 1000)
        
        // Generate random IV
        let iv = Data((0..<16).map { _ in UInt8.random(in: 0...255) })
        
        // Derive key using PBKDF2
        let key = try deriveKey(password: sharedSecret, salt: iv)
        
        // Encrypt data
        let encryptedData = try aesEncrypt(data: jsonData, key: key, iv: iv)
        
        // Create signature
        let signature = try createSignature(data: encryptedData.base64EncodedString(), timestamp: timestamp)
        
        // Create payload
        let payload: [String: Any] = [
            "data": encryptedData.base64EncodedString(),
            "iv": iv.base64EncodedString(),
            "timestamp": timestamp,
            "signature": signature
        ]
        
        let payloadData = try JSONSerialization.data(withJSONObject: payload, options: [])
        return payloadData.base64EncodedString()
    }
    
    /**
     * Derive encryption key using PBKDF2
     */
    private func deriveKey(password: String, salt: Data) throws -> Data {
        guard let passwordData = password.data(using: .utf8) else {
            throw SecureCommunicationError.invalidPassword
        }
        
        var derivedKey = Data(count: 32) // 256 bits
        let result = derivedKey.withUnsafeMutableBytes { derivedKeyBytes in
            salt.withUnsafeBytes { saltBytes in
                CCKeyDerivationPBKDF(
                    CCPBKDFAlgorithm(kCCPBKDF2),
                    passwordData.withUnsafeBytes { $0.baseAddress?.assumingMemoryBound(to: Int8.self) },
                    passwordData.count,
                    saltBytes.baseAddress?.assumingMemoryBound(to: UInt8.self),
                    salt.count,
                    CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256),
                    UInt32(iterations),
                    derivedKeyBytes.baseAddress?.assumingMemoryBound(to: UInt8.self),
                    derivedKey.count
                )
            }
        }
        
        guard result == kCCSuccess else {
            throw SecureCommunicationError.keyDerivationFailed
        }
        
        return derivedKey
    }
    
    /**
     * AES-256-CBC encryption
     */
    private func aesEncrypt(data: Data, key: Data, iv: Data) throws -> Data {
        var encryptedData = Data(count: data.count + kCCBlockSizeAES128)
        var encryptedDataLength: size_t = 0
        
        let status = encryptedData.withUnsafeMutableBytes { encryptedBytes in
            data.withUnsafeBytes { dataBytes in
                key.withUnsafeBytes { keyBytes in
                    iv.withUnsafeBytes { ivBytes in
                        CCCrypt(
                            CCOperation(kCCEncrypt),
                            CCAlgorithm(kCCAlgorithmAES),
                            CCOptions(kCCOptionPKCS7Padding),
                            keyBytes.baseAddress,
                            key.count,
                            ivBytes.baseAddress,
                            dataBytes.baseAddress,
                            data.count,
                            encryptedBytes.baseAddress,
                            encryptedData.count,
                            &encryptedDataLength
                        )
                    }
                }
            }
        }
        
        guard status == kCCSuccess else {
            throw SecureCommunicationError.encryptionFailed
        }
        
        return encryptedData.prefix(encryptedDataLength)
    }
    
    /**
     * Create HMAC-SHA256 signature
     */
    private func createSignature(data: String, timestamp: Int64) throws -> String {
        let message = "\(data):\(timestamp)"
        guard let messageData = message.data(using: .utf8),
              let keyData = sharedSecret.data(using: .utf8) else {
            throw SecureCommunicationError.signatureCreationFailed
        }
        
        let signature = HMAC<SHA256>.authenticationCode(for: messageData, using: SymmetricKey(data: keyData))
        return Data(signature).map { String(format: "%02hhx", $0) }.joined()
    }
}

// MARK: - Convenience Extensions

public extension SecureCommunication {
    
    /**
     * Create deeplink for Porsche vehicle
     */
    func createPorscheVehicleDeeplink(
        make: String = "Porsche",
        model: String,
        year: Int,
        vin: String,
        licensePlate: String? = nil,
        color: String? = nil,
        insuranceCompany: String? = nil,
        policyNumber: String? = nil,
        userId: String? = nil
    ) throws -> URL {
        
        var vehicleData: [String: Any] = [
            "make": make,
            "model": model,
            "year": year,
            "vin": vin
        ]
        
        if let licensePlate = licensePlate { vehicleData["licensePlate"] = licensePlate }
        if let color = color { vehicleData["color"] = color }
        if let insuranceCompany = insuranceCompany { vehicleData["insuranceCompany"] = insuranceCompany }
        if let policyNumber = policyNumber { vehicleData["policyNumber"] = policyNumber }
        
        let authToken = try userId.map { try createSecureAuthToken(userId: $0) }
        
        return try generateSecureDeeplink(vehicleData: vehicleData, authToken: authToken)
    }
}

// MARK: - Error Types

public enum SecureCommunicationError: Error, LocalizedError {
    case invalidPassword
    case keyDerivationFailed
    case encryptionFailed
    case signatureCreationFailed
    case urlGenerationFailed
    
    public var errorDescription: String? {
        switch self {
        case .invalidPassword:
            return "Invalid password for encryption"
        case .keyDerivationFailed:
            return "Failed to derive encryption key"
        case .encryptionFailed:
            return "Failed to encrypt data"
        case .signatureCreationFailed:
            return "Failed to create signature"
        case .urlGenerationFailed:
            return "Failed to generate URL"
        }
    }
}

// MARK: - Usage Example

/*
// Example usage in iOS Master App:

let secureCom = SecureCommunication()

do {
    // Create secure deeplink for Porsche vehicle
    let deeplinkURL = try secureCom.createPorscheVehicleDeeplink(
        model: "911 Carrera",
        year: 2024,
        vin: "WP0CA2A89KS123456",
        licensePlate: "P-EC 123",
        color: "Guards Red",
        userId: "user123"
    )
    
    // Open E-Claims app with secure deeplink
    if UIApplication.shared.canOpenURL(deeplinkURL) {
        UIApplication.shared.open(deeplinkURL, options: [:], completionHandler: nil)
    }
    
} catch {
    print("Failed to create secure deeplink: \(error.localizedDescription)")
}

// Manual vehicle data creation:
let vehicleData = [
    "make": "Porsche",
    "model": "Taycan",
    "year": 2024,
    "vin": "WP0ZZZ9999S123456"
] as [String : Any]

do {
    let authToken = try secureCom.createSecureAuthToken(userId: "demo-user", expirationMinutes: 30)
    let secureURL = try secureCom.generateSecureDeeplink(vehicleData: vehicleData, authToken: authToken)
    
    UIApplication.shared.open(secureURL)
} catch {
    print("Error: \(error)")
}
*/
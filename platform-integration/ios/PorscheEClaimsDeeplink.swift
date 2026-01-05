//
//  PorscheEClaimsDeeplink.swift
//  Porsche E-Claims iOS Integration
//
//  Created on January 4, 2026.
//  Copyright © 2026 Porsche AG. All rights reserved.
//

import Foundation
import CryptoKit
import UIKit

/**
 * iOS Swift integration library for generating deeplinks to Porsche E-Claims app
 * Use this in your iOS master app to securely launch E-Claims with vehicle data
 */
public class PorscheEClaimsDeeplink {
    
    // MARK: - Constants
    private static let APP_SCHEME = "porscheeclaims"
    private static let UNIVERSAL_LINK_BASE = "https://eclaims.deactech.com"
    
    // Universal Links are the preferred method for iOS integration
    private static let DEFAULT_USE_UNIVERSAL_LINKS = true
    
    // MARK: - Vehicle Data Structure
    public struct VehicleData {
        public let vehicleId: String
        public let vin: String
        public let make: String
        public let model: String
        public let year: Int?
        public let licensePlate: String?
        public let color: String?
        public let fuelType: String?
        public let insuranceCompany: String?
        public let policyNumber: String?
        
        public init(vehicleId: String, vin: String, make: String, model: String, 
                   year: Int? = nil, licensePlate: String? = nil, color: String? = nil,
                   fuelType: String? = nil, insuranceCompany: String? = nil, policyNumber: String? = nil) {
            self.vehicleId = vehicleId
            self.vin = vin
            self.make = make
            self.model = model
            self.year = year
            self.licensePlate = licensePlate
            self.color = color
            self.fuelType = fuelType
            self.insuranceCompany = insuranceCompany
            self.policyNumber = policyNumber
        }
    }
    
    // MARK: - Authentication Token Structure
    public struct AuthToken {
        public let userId: String
        public let expiresAt: TimeInterval
        public let sessionId: String?
        public let scope: [String]?
        
        public init(userId: String, expiresAt: TimeInterval, sessionId: String? = nil, scope: [String]? = nil) {
            self.userId = userId
            self.expiresAt = expiresAt
            self.sessionId = sessionId
            self.scope = scope
        }
    }
    
    // MARK: - Deeplink Generation
    
    /**
     * Generate a universal link URL to launch E-Claims with vehicle data
     * Universal Links are preferred on iOS for better user experience and security
     * - Parameter vehicleData: Vehicle information to pass to E-Claims
     * - Parameter authToken: Optional authentication token for secure access
     * - Parameter useUniversalLink: Whether to use universal link (default: true, recommended)
     * - Parameter encrypt: Whether to encrypt the vehicle data (requires encryption key)
     * - Parameter encryptionKey: AES encryption key (required if encrypt = true)
     * - Returns: Complete universal link URL as String
     */
    public static func generateVehicleDeeplink(
        vehicleData: VehicleData,
        authToken: AuthToken? = nil,
        useUniversalLink: Bool = DEFAULT_USE_UNIVERSAL_LINKS,
        encrypt: Bool = false,
        encryptionKey: String? = nil
    ) -> String? {
        
        // Convert vehicle data to dictionary
        var vehicleDict: [String: Any] = [
            "vehicleId": vehicleData.vehicleId,
            "vin": vehicleData.vin,
            "make": vehicleData.make,
            "model": vehicleData.model
        ]
        
        if let year = vehicleData.year { vehicleDict["year"] = year }
        if let licensePlate = vehicleData.licensePlate { vehicleDict["licensePlate"] = licensePlate }
        if let color = vehicleData.color { vehicleDict["color"] = color }
        if let fuelType = vehicleData.fuelType { vehicleDict["fuelType"] = fuelType }
        if let insuranceCompany = vehicleData.insuranceCompany { vehicleDict["insuranceCompany"] = insuranceCompany }
        if let policyNumber = vehicleData.policyNumber { vehicleDict["policyNumber"] = policyNumber }
        
        // Serialize to JSON
        guard let jsonData = try? JSONSerialization.data(withJSONObject: vehicleDict, options: []),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            print("❌ Failed to serialize vehicle data")
            return nil
        }
        
        // Encode vehicle data
        let vehicleDataParam: String
        if encrypt, let encryptionKey = encryptionKey {
            // Use encrypted format
            guard let encryptedData = encryptVehicleData(jsonString, key: encryptionKey) else {
                print("❌ Failed to encrypt vehicle data")
                return nil
            }
            vehicleDataParam = "secureData=\(encryptedData)"
        } else {
            // Use legacy base64 format
            let base64Data = Data(jsonString.utf8).base64EncodedString()
            vehicleDataParam = "vehicleData=\(base64Data)"
        }
        
        // Generate auth token parameter if provided
        let tokenParam: String
        if let authToken = authToken {
            let tokenData = generateAuthTokenData(authToken)
            tokenParam = "&token=\(tokenData)"
        } else {
            tokenParam = ""
        }
        
        // Build Universal Link URL (preferred) or fallback to custom scheme
        let baseUrl = useUniversalLink ? UNIVERSAL_LINK_BASE : "\(APP_SCHEME)://"
        let path = useUniversalLink ? "/vehicles" : "vehicles"
        
        let finalUrl = "\(baseUrl)\(path)?\(vehicleDataParam)\(tokenParam)"
        
        if useUniversalLink {
            print("✅ Generated Universal Link: \(finalUrl)")
        } else {
            print("⚠️ Generated custom scheme URL: \(finalUrl)")
        }
        
        return finalUrl
    }
    
    /**
     * Generate a universal link to start damage assessment
     * - Parameter vehicleId: ID of the vehicle for damage assessment
     * - Parameter authToken: Authentication token for secure access
     * - Parameter useUniversalLink: Whether to use universal link (default: true, recommended)
     * - Returns: Complete universal link URL as String
     */
    public static func generateDamageAssessmentDeeplink(
        vehicleId: String,
        authToken: AuthToken,
        useUniversalLink: Bool = DEFAULT_USE_UNIVERSAL_LINKS
    ) -> String {
        let tokenParam = generateAuthTokenData(authToken)
        let baseUrl = useUniversalLink ? UNIVERSAL_LINK_BASE : "\(APP_SCHEME)://"
        let path = useUniversalLink ? "/damage" : "damage"
        
        return "\(baseUrl)\(path)?vehicleId=\(vehicleId)&token=\(tokenParam)"
    }
    
    /**
     * Launch E-Claims app with the generated universal link
     * Universal Links provide better user experience and work even if app is not installed
     * - Parameter url: Universal link or custom scheme URL to open
     * - Parameter completion: Completion handler with success/failure result
     */
    public static func launchEClaims(url: String, completion: @escaping (Bool) -> Void) {
        guard let linkUrl = URL(string: url) else {
            print("❌ Invalid URL format: \(url)")
            completion(false)
            return
        }
        
        // Universal Links work differently than custom schemes
        let isUniversalLink = url.hasPrefix("https://")
        
        if isUniversalLink {
            // Universal Link - always works, redirects to App Store if app not installed
            UIApplication.shared.open(linkUrl, options: [:]) { success in
                if success {
                    print("✅ Universal Link opened successfully")
                } else {
                    print("❌ Failed to open Universal Link")
                }
                completion(success)
            }
        } else {
            // Custom scheme - check if app is installed first
            if UIApplication.shared.canOpenURL(linkUrl) {
                UIApplication.shared.open(linkUrl, options: [:]) { success in
                    if success {
                        print("✅ E-Claims app launched via custom scheme")
                    } else {
                        print("❌ Failed to launch E-Claims app")
                    }
                    completion(success)
                }
            } else {
                // App not installed, redirect to App Store
                print("⚠️ E-Claims app not installed, redirecting to App Store")
                let appStoreUrl = "https://apps.apple.com/app/porsche-eclaims/id123456789" // Replace with actual App Store ID
                if let storeUrl = URL(string: appStoreUrl) {
                    UIApplication.shared.open(storeUrl, options: [:]) { _ in
                        completion(false) // App not installed
                    }
                } else {
                    completion(false)
                }
            }
        }
    }
    
    // MARK: - Private Helper Methods
    
    private static func generateAuthTokenData(_ authToken: AuthToken) -> String {
        var tokenDict: [String: Any] = [
            "userId": authToken.userId,
            "expiresAt": authToken.expiresAt
        ]
        
        if let sessionId = authToken.sessionId { tokenDict["sessionId"] = sessionId }
        if let scope = authToken.scope { tokenDict["scope"] = scope }
        
        guard let tokenJson = try? JSONSerialization.data(withJSONObject: tokenDict, options: []),
              let tokenString = String(data: tokenJson, encoding: .utf8) else {
            return ""
        }
        
        return Data(tokenString.utf8).base64EncodedString()
    }
    
    private static func encryptVehicleData(_ data: String, key: String) -> String? {
        // AES-256-CBC encryption implementation
        guard let keyData = key.data(using: .utf8),
              let dataToEncrypt = data.data(using: .utf8) else {
            return nil
        }
        
        // Generate random IV
        var iv = Data(count: 16)
        _ = iv.withUnsafeMutableBytes { bytes in
            SecRandomCopyBytes(kSecRandomDefault, 16, bytes.bindMemory(to: UInt8.self).baseAddress!)
        }
        
        // Derive key using PBKDF2
        let saltData = "PorscheEClaims2026".data(using: .utf8)!
        guard let derivedKey = deriveKey(from: keyData, salt: saltData) else {
            return nil
        }
        
        do {
            // Encrypt data
            let sealedBox = try AES.GCM.seal(dataToEncrypt, using: SymmetricKey(data: derivedKey))
            
            // Create JWE-style structure
            let encryptedData: [String: Any] = [
                "protected": Data("{}".utf8).base64EncodedString(),
                "iv": iv.base64EncodedString(),
                "ciphertext": sealedBox.ciphertext.base64EncodedString(),
                "tag": sealedBox.tag.base64EncodedString()
            ]
            
            guard let jsonData = try? JSONSerialization.data(withJSONObject: encryptedData, options: []) else {
                return nil
            }
            
            return jsonData.base64EncodedString()
        } catch {
            print("❌ Encryption failed: \(error)")
            return nil
        }
    }
    
    private static func deriveKey(from password: Data, salt: Data) -> Data? {
        var derivedKey = Data(count: 32) // 256 bits
        let result = derivedKey.withUnsafeMutableBytes { derivedKeyBytes in
            password.withUnsafeBytes { passwordBytes in
                salt.withUnsafeBytes { saltBytes in
                    CCKeyDerivationPBKDF(
                        CCPBKDFAlgorithm(kCCPBKDF2),
                        passwordBytes.bindMemory(to: Int8.self).baseAddress!,
                        password.count,
                        saltBytes.bindMemory(to: UInt8.self).baseAddress!,
                        salt.count,
                        CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256),
                        10000, // iterations
                        derivedKeyBytes.bindMemory(to: UInt8.self).baseAddress!,
                        32
                    )
                }
            }
        }
        
        return result == kCCSuccess ? derivedKey : nil
    }
}

// MARK: - Usage Example

/**
 Example usage in your iOS master app:

 ```swift
 // 1. Create vehicle data
 let vehicleData = PorscheEClaimsDeeplink.VehicleData(
     vehicleId: "vehicle123",
     vin: "WP0ZIZzP3DD001234", 
     make: "Porsche",
     model: "911 Carrera",
     year: 2023,
     licensePlate: "ABC123",
     insuranceCompany: "Test Insurance Co",
     policyNumber: "POL-2024-001234"
 )
 
 // 2. Create authentication token
 let authToken = PorscheEClaimsDeeplink.AuthToken(
     userId: "user123",
     expiresAt: Date().addingTimeInterval(3600).timeIntervalSince1970, // 1 hour from now
     sessionId: "session456"
 )
 
 // 3. Generate Universal Link (recommended approach)
 if let universalLink = PorscheEClaimsDeeplink.generateVehicleDeeplink(
     vehicleData: vehicleData,
     authToken: authToken,
     // useUniversalLink defaults to true for iOS
     encrypt: true,
     encryptionKey: "your-encryption-key-here"
 ) {
     print("Generated Universal Link: \(universalLink)")
     
     // 4. Launch E-Claims app via Universal Link
     PorscheEClaimsDeeplink.launchEClaims(url: universalLink) { success in
         if success {
             print("E-Claims launched successfully via Universal Link")
         } else {
             print("Failed to launch E-Claims or app not installed")
         }
     }
 }
 
 // Alternative: Generate damage assessment Universal Link
 let damageUniversalLink = PorscheEClaimsDeeplink.generateDamageAssessmentDeeplink(
     vehicleId: "vehicle123",
     authToken: authToken
     // useUniversalLink defaults to true
 )
 ```
 */

// MARK: - CommonCrypto Bridge
import CommonCrypto

extension Data {
    func sha256() -> Data {
        var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        self.withUnsafeBytes {
            _ = CC_SHA256($0.baseAddress, CC_LONG(self.count), &hash)
        }
        return Data(hash)
    }
}
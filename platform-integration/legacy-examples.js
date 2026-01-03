/**
 * Legacy Base64 Encoding Utilities
 * For backward compatibility with existing implementations
 */

// MARK: - iOS (Swift 5) - Legacy Implementation

/*
import Foundation

class LegacyCommunication {
    
    static func encodeVehicleDataLegacy(_ vehicleData: [String: Any]) -> String {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: vehicleData, options: []) else {
            return ""
        }
        return jsonData.base64EncodedString()
    }
    
    static func createLegacyAuthToken(userId: String, expirationHours: Int = 24) -> String {
        let authData = [
            "userId": userId,
            "expiresAt": Date().timeIntervalSince1970 * 1000 + Double(expirationHours * 60 * 60 * 1000),
            "sessionId": UUID().uuidString
        ] as [String : Any]
        
        guard let jsonData = try? JSONSerialization.data(withJSONObject: authData, options: []) else {
            return ""
        }
        return jsonData.base64EncodedString()
    }
    
    static func generateLegacyDeeplink(vehicleData: [String: Any], authToken: String? = nil) -> URL? {
        let encodedVehicleData = encodeVehicleDataLegacy(vehicleData)
        
        var components = URLComponents()
        components.scheme = "porscheeclaims"
        components.host = "vehicles"
        
        var queryItems = [
            URLQueryItem(name: "vehicleData", value: encodedVehicleData)
        ]
        
        if let authToken = authToken {
            queryItems.append(URLQueryItem(name: "token", value: authToken))
        }
        
        components.queryItems = queryItems
        return components.url
    }
}

// Usage example:
let vehicleData = [
    "make": "Porsche",
    "model": "911 Carrera",
    "year": 2024,
    "vin": "WP0CA2A89KS123456"
] as [String : Any]

let authToken = LegacyCommunication.createLegacyAuthToken(userId: "test-user")
let legacyURL = LegacyCommunication.generateLegacyDeeplink(vehicleData: vehicleData, authToken: authToken)

if let url = legacyURL {
    UIApplication.shared.open(url)
}
*/

// MARK: - Android (Kotlin) - Legacy Implementation

/*
import android.util.Base64
import org.json.JSONObject
import java.nio.charset.StandardCharsets

object LegacyCommunication {
    
    fun encodeVehicleDataLegacy(vehicleData: Map<String, Any>): String {
        return try {
            val jsonString = JSONObject(vehicleData).toString()
            Base64.encodeToString(jsonString.toByteArray(StandardCharsets.UTF_8), Base64.NO_WRAP)
        } catch (e: Exception) {
            ""
        }
    }
    
    fun createLegacyAuthToken(userId: String, expirationHours: Int = 24): String {
        return try {
            val authData = mapOf(
                "userId" to userId,
                "expiresAt" to (System.currentTimeMillis() + expirationHours * 60 * 60 * 1000),
                "sessionId" to java.util.UUID.randomUUID().toString()
            )
            
            val jsonString = JSONObject(authData).toString()
            Base64.encodeToString(jsonString.toByteArray(StandardCharsets.UTF_8), Base64.NO_WRAP)
        } catch (e: Exception) {
            ""
        }
    }
    
    fun generateLegacyDeeplink(vehicleData: Map<String, Any>, authToken: String? = null): String {
        val encodedVehicleData = encodeVehicleDataLegacy(vehicleData)
        
        val urlBuilder = StringBuilder("porscheeclaims://vehicles?vehicleData=")
        urlBuilder.append(android.net.Uri.encode(encodedVehicleData))
        
        authToken?.let {
            urlBuilder.append("&token=").append(android.net.Uri.encode(it))
        }
        
        return urlBuilder.toString()
    }
}

// Usage example:
val vehicleData = mapOf(
    "make" to "Porsche", 
    "model" to "911 Carrera",
    "year" to 2024,
    "vin" to "WP0CA2A89KS123456"
)

val authToken = LegacyCommunication.createLegacyAuthToken("test-user")
val legacyUrl = LegacyCommunication.generateLegacyDeeplink(vehicleData, authToken)

val intent = Intent(Intent.ACTION_VIEW, Uri.parse(legacyUrl))
context.startActivity(intent)
*/

// MARK: - JavaScript/TypeScript (React Native) - Legacy Implementation

/*
// For React Native or web-based master apps
export class LegacyCommunication {
  
  static encodeVehicleDataLegacy(vehicleData: any): string {
    try {
      const jsonString = JSON.stringify(vehicleData);
      return btoa(jsonString);
    } catch (error) {
      console.error('Failed to encode vehicle data:', error);
      return '';
    }
  }
  
  static createLegacyAuthToken(userId: string, expirationHours: number = 24): string {
    try {
      const authData = {
        userId,
        expiresAt: Date.now() + (expirationHours * 60 * 60 * 1000),
        sessionId: Math.random().toString(36).substr(2, 9)
      };
      
      const jsonString = JSON.stringify(authData);
      return btoa(jsonString);
    } catch (error) {
      console.error('Failed to create auth token:', error);
      return '';
    }
  }
  
  static generateLegacyDeeplink(vehicleData: any, authToken?: string): string {
    const encodedVehicleData = this.encodeVehicleDataLegacy(vehicleData);
    
    let url = `porscheeclaims://vehicles?vehicleData=${encodeURIComponent(encodedVehicleData)}`;
    
    if (authToken) {
      url += `&token=${encodeURIComponent(authToken)}`;
    }
    
    return url;
  }
}

// Usage example:
const vehicleData = {
  make: 'Porsche',
  model: '911 Carrera', 
  year: 2024,
  vin: 'WP0CA2A89KS123456'
};

const authToken = LegacyCommunication.createLegacyAuthToken('test-user');
const legacyUrl = LegacyCommunication.generateLegacyDeeplink(vehicleData, authToken);

// For React Native
import { Linking } from 'react-native';
Linking.openURL(legacyUrl);

// For web
window.location.href = legacyUrl;
*/
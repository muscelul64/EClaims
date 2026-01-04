package com.porsche.eclaims.security

import android.util.Base64
import org.json.JSONObject
import java.nio.charset.StandardCharsets
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.Mac
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec
import java.util.*

/**
 * JSONObject extension to convert to Map
 */
fun JSONObject.toMap(): Map<String, Any> {
    val map = mutableMapOf<String, Any>()
    val keys = keys()
    while (keys.hasNext()) {
        val key = keys.next()
        val value = get(key)
        map[key] = when (value) {
            is JSONObject -> value.toMap()
            else -> value
        }
    }
    return map
}

/**
 * Secure Communication Utility for Android Master App
 * Matches the encryption implementation in Porsche E-Claims React Native app
 *
 * NOTE: This file is a template. Use scripts/generate-platform-code.sh to generate
 * a version with your actual shared secret injected.
 */
class SecureCommunication @JvmOverloads constructor(
    private val sharedSecret: String = "P0rsch3-ECl41ms-S3cur3-K3y-D3v3l0pm3nt-2026!@#"
) {
    
    companion object {
        private const val AES_TRANSFORMATION = "AES/CBC/PKCS5Padding"
        private const val HMAC_ALGORITHM = "HmacSHA256"
        private const val PBKDF2_ALGORITHM = "PBKDF2WithHmacSHA256"
        private const val KEY_LENGTH = 256
        private const val ITERATIONS = 1000
        private const val IV_LENGTH = 16
    }
    
    /**
     * Encrypt vehicle data for secure deeplink transmission
     */
    fun encryptVehicleData(vehicleData: Map<String, Any>): String {
        val payload = mapOf(
            "vehicleData" to vehicleData,
            "source" to "master-app",
            "version" to "1.0"
        )
        
        return encryptData(payload)
    }
    
    /**
     * Create secure authentication token
     */
    fun createSecureAuthToken(userId: String, expirationMinutes: Int = 60): String {
        val authData = mapOf(
            "userId" to userId,
            "expiresAt" to (System.currentTimeMillis() + expirationMinutes * 60 * 1000),
            "issuedAt" to System.currentTimeMillis(),
            "nonce" to UUID.randomUUID().toString(),
            "iss" to "porsche-master-app"
        )
        
        return encryptData(authData)
    }
    
    /**
     * Generate secure deeplink URL
     */
    fun generateSecureDeeplink(vehicleData: Map<String, Any>, authToken: String? = null): String {
        val encryptedVehicleData = encryptVehicleData(vehicleData)
        
        val urlBuilder = StringBuilder("porscheeclaims://vehicles?vehicleData=")
        urlBuilder.append(android.net.Uri.encode(encryptedVehicleData))
        
        authToken?.let {
            urlBuilder.append("&token=").append(android.net.Uri.encode(it))
        }
        
        return urlBuilder.toString()
    }
    
    /**
     * Generate legacy deeplink URL (for backward compatibility)
     */
    fun generateLegacyDeeplink(vehicleData: Map<String, Any>, authToken: String? = null): String {
        val legacyVehicleData = Base64.encodeToString(
            JSONObject(vehicleData).toString().toByteArray(StandardCharsets.UTF_8), 
            Base64.NO_WRAP
        )
        
        val urlBuilder = StringBuilder("porscheeclaims://vehicles?vehicleData=")
        urlBuilder.append(android.net.Uri.encode(legacyVehicleData))
        
        authToken?.let {
            urlBuilder.append("&token=").append(android.net.Uri.encode(it))
        }
        
        return urlBuilder.toString()
    }
    
    /**
     * Check if data appears to be encrypted (vs legacy base64)
     */
    fun isEncryptedData(data: String): Boolean {
        return try {
            val decoded = JSONObject(String(Base64.decode(data, Base64.NO_WRAP), StandardCharsets.UTF_8))
            decoded.has("data") && decoded.has("iv") && decoded.has("timestamp") && decoded.has("signature")
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Smart vehicle data extraction with automatic format detection
     * Use this method to handle both encrypted and legacy formats
     */
    fun smartExtractVehicleData(data: String): Map<String, Any>? {
        return if (isEncryptedData(data)) {
            // Handle encrypted data
            try {
                val decrypted = decryptData(data)
                @Suppress("UNCHECKED_CAST")
                decrypted["vehicleData"] as? Map<String, Any>
            } catch (e: Exception) {
                android.util.Log.w("SecureCommunication", "Encrypted data extraction failed", e)
                null
            }
        } else {
            // Handle legacy base64 data
            try {
                val jsonString = String(Base64.decode(data, Base64.NO_WRAP), StandardCharsets.UTF_8)
                val jsonObject = JSONObject(jsonString)
                jsonObject.toMap()
            } catch (e: Exception) {
                android.util.Log.e("SecureCommunication", "Legacy base64 decoding failed", e)
                null
            }
        }
    }
    
    /**
     * Decrypt data (for encrypted format)
     */
    fun decryptData(encryptedData: String): Map<String, Any> {
        val payloadJson = String(Base64.decode(encryptedData, Base64.NO_WRAP), StandardCharsets.UTF_8)
        val payload = JSONObject(payloadJson)
        
        val data = payload.getString("data")
        val iv = Base64.decode(payload.getString("iv"), Base64.NO_WRAP)
        val timestamp = payload.getLong("timestamp")
        val signature = payload.getString("signature")
        
        // Validate timestamp (5 minutes max age)
        val maxAge = 5 * 60 * 1000L
        if (System.currentTimeMillis() - timestamp > maxAge) {
            throw SecurityException("Data expired")
        }
        
        // Verify signature
        val expectedSignature = createSignature(data, timestamp)
        if (signature != expectedSignature) {
            throw SecurityException("Data integrity check failed")
        }
        
        // Decrypt
        val key = deriveKey(sharedSecret, iv)
        val decryptedBytes = aesDecrypt(Base64.decode(data, Base64.NO_WRAP), key, iv)
        val decryptedJson = String(decryptedBytes, StandardCharsets.UTF_8)
        
        return JSONObject(decryptedJson).toMap()
    }
    
    /**
     * Encrypt data using AES-256-CBC with PBKDF2 key derivation
     */
    private fun encryptData(data: Map<String, Any>): String {
        val jsonString = JSONObject(data).toString()
        val timestamp = System.currentTimeMillis()
        
        // Generate random IV
        val iv = ByteArray(IV_LENGTH)
        SecureRandom().nextBytes(iv)
        
        // Derive key using PBKDF2
        val key = deriveKey(sharedSecret, iv)
        
        // Encrypt data
        val encryptedData = aesEncrypt(jsonString.toByteArray(StandardCharsets.UTF_8), key, iv)
        
        // Create signature
        val encryptedBase64 = Base64.encodeToString(encryptedData, Base64.NO_WRAP)
        val signature = createSignature(encryptedBase64, timestamp)
        
        // Create payload
        val payload = mapOf(
            "data" to encryptedBase64,
            "iv" to Base64.encodeToString(iv, Base64.NO_WRAP),
            "timestamp" to timestamp,
            "signature" to signature
        )
        
        val payloadJson = JSONObject(payload).toString()
        return Base64.encodeToString(payloadJson.toByteArray(StandardCharsets.UTF_8), Base64.NO_WRAP)
    }
    
    /**
     * Derive encryption key using PBKDF2
     */
    private fun deriveKey(password: String, salt: ByteArray): ByteArray {
        val spec = PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_LENGTH)
        val factory = SecretKeyFactory.getInstance(PBKDF2_ALGORITHM)
        return factory.generateSecret(spec).encoded
    }
    
    /**
     * AES-256-CBC encryption
     */
    private fun aesEncrypt(data: ByteArray, key: ByteArray, iv: ByteArray): ByteArray {
        val cipher = Cipher.getInstance(AES_TRANSFORMATION)
        val secretKey = SecretKeySpec(key, "AES")
        val ivSpec = IvParameterSpec(iv)
        
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec)
        return cipher.doFinal(data)
    }
    
    /**
     * AES-256-CBC decryption
     */
    private fun aesDecrypt(encryptedData: ByteArray, key: ByteArray, iv: ByteArray): ByteArray {
        val cipher = Cipher.getInstance(AES_TRANSFORMATION)
        val secretKey = SecretKeySpec(key, "AES")
        val ivSpec = IvParameterSpec(iv)
        
        cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec)
        return cipher.doFinal(encryptedData)
    }
    
    /**
     * Create HMAC-SHA256 signature
     */
    private fun createSignature(data: String, timestamp: Long): String {
        val message = "$data:$timestamp"
        val mac = Mac.getInstance(HMAC_ALGORITHM)
        val secretKey = SecretKeySpec(sharedSecret.toByteArray(StandardCharsets.UTF_8), HMAC_ALGORITHM)
        
        mac.init(secretKey)
        val signature = mac.doFinal(message.toByteArray(StandardCharsets.UTF_8))
        
        return signature.joinToString("") { "%02x".format(it) }
    }
}

/**
 * Convenience extension functions
 */
object SecureCommunicationExtensions {
    
    /**
     * Create secure deeplink for Porsche vehicle
     */
    fun SecureCommunication.createPorscheVehicleDeeplink(
        make: String = "Porsche",
        model: String,
        year: Int,
        vin: String,
        licensePlate: String? = null,
        color: String? = null,
        insuranceCompany: String? = null,
        policyNumber: String? = null,
        userId: String? = null,
        useEncryption: Boolean = true
    ): String {
        
        val vehicleData = mutableMapOf<String, Any>(
            "make" to make,
            "model" to model,
            "year" to year,
            "vin" to vin
        )
        
        licensePlate?.let { vehicleData["licensePlate"] = it }
        color?.let { vehicleData["color"] = it }
        insuranceCompany?.let { vehicleData["insuranceCompany"] = it }
        policyNumber?.let { vehicleData["policyNumber"] = it }
        
        val authToken = userId?.let { 
            if (useEncryption) createSecureAuthToken(it) else createLegacyAuthToken(it)
        }
        
        return if (useEncryption) {
            generateSecureDeeplink(vehicleData, authToken)
        } else {
            generateLegacyDeeplink(vehicleData, authToken)
        }
    }
    
    /**
     * Create legacy deeplink for Porsche vehicle (backward compatibility)
     */
    fun SecureCommunication.createPorscheLegacyDeeplink(
        make: String = "Porsche",
        model: String,
        year: Int,
        vin: String,
        licensePlate: String? = null,
        color: String? = null,
        insuranceCompany: String? = null,
        policyNumber: String? = null,
        userId: String? = null
    ): String {
        return createPorscheVehicleDeeplink(
            make, model, year, vin, licensePlate, color, 
            insuranceCompany, policyNumber, userId, useEncryption = false
        )
    }
    
    /**
     * Create legacy auth token (base64 JSON)
     */
    private fun SecureCommunication.createLegacyAuthToken(userId: String, expirationHours: Int = 24): String {
        val authData = mapOf(
            "userId" to userId,
            "expiresAt" to (System.currentTimeMillis() + expirationHours * 60 * 60 * 1000),
            "sessionId" to UUID.randomUUID().toString()
        )
        
        val jsonString = JSONObject(authData).toString()
        return Base64.encodeToString(jsonString.toByteArray(StandardCharsets.UTF_8), Base64.NO_WRAP)
    }
}

// Data classes for structured vehicle data
data class PorscheVehicle(
    val make: String = "Porsche",
    val model: String,
    val year: Int,
    val vin: String,
    val licensePlate: String? = null,
    val color: String? = null,
    val insuranceCompany: String? = null,
    val policyNumber: String? = null
) {
    fun toMap(): Map<String, Any> {
        val map = mutableMapOf<String, Any>(
            "make" to make,
            "model" to model,
            "year" to year,
            "vin" to vin
        )
        
        licensePlate?.let { map["licensePlate"] = it }
        color?.let { map["color"] = it }
        insuranceCompany?.let { map["insuranceCompany"] = it }
        policyNumber?.let { map["policyNumber"] = it }
        
        return map
    }
}

/*
Usage Examples:

// RECOMMENDED: Use secure encryption (default)
val secureCom = SecureCommunication()

val vehicle = PorscheVehicle(
    model = "911 Carrera",
    year = 2024,
    vin = "WP0CA2A89KS123456",
    licensePlate = "P-EC 123",
    color = "Guards Red"
)

try {
    // Create secure encrypted deeplink
    val secureDeeplinkUrl = SecureCommunicationExtensions.run {
        secureCom.createPorscheVehicleDeeplink(
            model = vehicle.model,
            year = vehicle.year,
            vin = vehicle.vin,
            licensePlate = vehicle.licensePlate,
            color = vehicle.color,
            userId = "user123",
            useEncryption = true  // Uses strong encryption
        )
    }
    
    // Launch E-Claims app with secure deeplink
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(secureDeeplinkUrl))
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    
    if (intent.resolveActivity(context.packageManager) != null) {
        context.startActivity(intent)
    } else {
        // Handle case where E-Claims app is not installed
        Log.e("SecureCommunication", "E-Claims app not found")
    }
    
} catch (e: Exception) {
    Log.e("SecureCommunication", "Failed to create secure deeplink", e)
}

// LEGACY: For backward compatibility only
try {
    val legacyDeeplinkUrl = SecureCommunicationExtensions.run {
        secureCom.createPorscheLegacyDeeplink(
            model = vehicle.model,
            year = vehicle.year,
            vin = vehicle.vin,
            licensePlate = vehicle.licensePlate,
            color = vehicle.color,
            userId = "user123"
        )
    }
    
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(legacyDeeplinkUrl))
    context.startActivity(intent)
    
} catch (e: Exception) {
    Log.e("SecureCommunication", "Failed to create legacy deeplink", e)
}

// SMART EXTRACTION: Handle received data (if building a receiver app)
val receivedData = "..." // Data from deeplink
val extractedVehicle = secureCom.smartExtractVehicleData(receivedData)
if (extractedVehicle != null) {
    Log.d("SecureCommunication", "Vehicle received: ${extractedVehicle["make"]} ${extractedVehicle["model"]}")
} else {
    Log.e("SecureCommunication", "Failed to extract vehicle data")
}

// FORMAT DETECTION
val isEncrypted = secureCom.isEncryptedData(receivedData)
Log.d("SecureCommunication", "Data format: ${if (isEncrypted) "Encrypted" else "Legacy Base64"}")

// In Activity or Fragment:
class MainActivity : AppCompatActivity() {
    
    private val secureCom = SecureCommunication()
    
    fun launchEClaimsWithVehicle(vehicle: PorscheVehicle, userId: String, useSecureFormat: Boolean = true) {
        try {
            val deeplinkUrl = SecureCommunicationExtensions.run {
                secureCom.createPorscheVehicleDeeplink(
                    model = vehicle.model,
                    year = vehicle.year,
                    vin = vehicle.vin,
                    licensePlate = vehicle.licensePlate,
                    color = vehicle.color,
                    userId = userId,
                    useEncryption = useSecureFormat
                )
            }
            
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deeplinkUrl))
            intent.setPackage("com.deactech.porscheeclaims") // Specific package
            
            if (intent.resolveActivity(packageManager) != null) {
                startActivity(intent)
            } else {
                // Show dialog to install E-Claims app
                showInstallEClaimsDialog()
            }
            
        } catch (e: Exception) {
            Log.e("MainActivity", "Failed to launch E-Claims app", e)
            // Show error to user
        }
    }
    
    private fun showInstallEClaimsDialog() {
        AlertDialog.Builder(this)
            .setTitle("Install E-Claims App")
            .setMessage("The Porsche E-Claims app is required. Would you like to install it?")
            .setPositiveButton("Install") { _, _ ->
                // Open Play Store
                val playStoreIntent = Intent(Intent.ACTION_VIEW).apply {
                    data = Uri.parse("market://details?id=com.deactech.porscheeclaims")
                }
                startActivity(playStoreIntent)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
*/
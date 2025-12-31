/**
 * KotlinImplementationExample.kt
 * 
 * Example implementation showing how to integrate React Native E-Claims
 * into a native Kotlin Android application.
 */

package com.yourcompany.yourapp.eclaims

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.deactech.eclaims.native.EClaimsAndroidModule
import com.deactech.eclaims.native.EClaimsHostListener
import com.facebook.react.ReactActivity
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactPackage
import com.facebook.react.ReactRootView
import com.facebook.react.common.LifecycleState
import com.facebook.react.shell.MainReactPackage
import com.google.gson.Gson

/**
 * Main Activity that hosts the React Native E-Claims integration
 */
class MainActivity : AppCompatActivity(), EClaimsHostListener {
    
    private lateinit var reactRootView: ReactRootView
    private lateinit var reactInstanceManager: ReactInstanceManager
    private lateinit var eClaimsModule: EClaimsAndroidModule
    private val gson = Gson()
    
    // Your app's user and vehicle data
    private var currentUser: UserModel? = null
    private var userVehicles: List<VehicleModel> = emptyList()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize React Native
        setupReactNative()
        
        // Initialize E-Claims module
        setupEClaimsModule()
        
        // Set up the UI
        setContentView(reactRootView)
        
        // Load initial data and start E-Claims
        loadUserDataAndInitialize()
    }
    
    private fun setupReactNative() {
        reactRootView = ReactRootView(this)
        
        reactInstanceManager = ReactInstanceManager.builder()
            .setApplication(application as ReactApplication)
            .setCurrentActivity(this)
            .setBundleAssetName("index.android.bundle")
            .setJSMainModulePath("index")
            .addPackage(MainReactPackage())
            .addPackage(EClaimsReactPackage()) // Your custom package
            .setUseDeveloperSupport(BuildConfig.DEBUG)
            .setInitialLifecycleState(LifecycleState.RESUMED)
            .build()
    }
    
    private fun setupEClaimsModule() {
        eClaimsModule = EClaimsAndroidModule(
            reactInstanceManager.currentReactContext as ReactApplicationContext,
            this
        )
        eClaimsModule.setHostListener(this)
    }
    
    private fun loadUserDataAndInitialize() {
        // Load your app's user and vehicle data
        loadCurrentUser { user ->
            currentUser = user
            loadUserVehicles(user.id) { vehicles ->
                userVehicles = vehicles
                initializeEClaims()
            }
        }
    }
    
    private fun initializeEClaims() {
        val config = mapOf(
            "apiBaseUrl" to "https://your-api.com",
            "environment" to if (BuildConfig.DEBUG) "development" else "production",
            "analyticsEnabled" to true,
            "theme" to mapOf(
                "primaryColor" to "#007AFF",
                "darkMode" to isSystemInDarkMode()
            ),
            "features" to mapOf(
                "offlineMode" to true,
                "autoSave" to true,
                "pushNotifications" to true
            )
        )
        
        val configJson = gson.toJson(config)
        eClaimsModule.initializeEClaims(configJson) { success ->
            if (success as Boolean) {
                // Update React Native with user and vehicle data
                syncUserData()
                syncVehicleData()
                
                // Start the React Native app
                reactRootView.startReactApplication(
                    reactInstanceManager,
                    "EClaims", // Your React Native component name
                    null
                )
            }
        }
    }
    
    private fun syncUserData() {
        currentUser?.let { user ->
            val userData = mapOf(
                "id" to user.id,
                "email" to user.email,
                "firstName" to user.firstName,
                "lastName" to user.lastName,
                "phone" to user.phone,
                "driversLicense" to mapOf(
                    "number" to user.driversLicense,
                    "expiryDate" to user.licenseExpiry
                ),
                "insurancePolicy" to mapOf(
                    "provider" to user.insuranceProvider,
                    "policyNumber" to user.policyNumber
                )
            )
            
            val userDataJson = gson.toJson(userData)
            eClaimsModule.updateUserData(userDataJson) { /* handle result */ }
        }
    }
    
    private fun syncVehicleData() {
        val vehicleData = userVehicles.map { vehicle ->
            mapOf(
                "id" to vehicle.id,
                "vin" to vehicle.vin,
                "make" to vehicle.make,
                "model" to vehicle.model,
                "year" to vehicle.year,
                "licensePlate" to vehicle.licensePlate,
                "color" to vehicle.color,
                "insurance" to mapOf(
                    "provider" to vehicle.insuranceProvider,
                    "policyNumber" to vehicle.insurancePolicyNumber,
                    "validUntil" to vehicle.insuranceExpiry
                )
            )
        }
        
        val vehicleDataJson = gson.toJson(vehicleData)
        eClaimsModule.updateVehicleData(vehicleDataJson) { /* handle result */ }
    }
    
    // MARK: - EClaimsHostListener Implementation
    
    override fun onEClaimsInitialized(config: Map<String, Any>) {
        // E-Claims is ready
        println("E-Claims initialized with config: $config")
    }
    
    override fun onNavigationRequested(screenName: String, params: Map<String, Any>?) {
        when (screenName) {
            "vehicle_management" -> {
                // Navigate to your app's vehicle management screen
                val intent = Intent(this, VehicleManagementActivity::class.java)
                params?.let { intent.putExtra("params", gson.toJson(it)) }
                startActivity(intent)
            }
            "user_profile" -> {
                // Navigate to your app's user profile screen
                val intent = Intent(this, UserProfileActivity::class.java)
                startActivity(intent)
            }
            "settings" -> {
                // Navigate to your app's settings screen
                val intent = Intent(this, SettingsActivity::class.java)
                startActivity(intent)
            }
        }
    }
    
    override fun onStatementSubmitted(statementId: String, data: Map<String, Any>) {
        // Handle statement submission
        // Save to your backend, show confirmation, etc.
        println("Statement submitted: $statementId")
        
        // Example: Save to your backend
        saveStatementToBackend(statementId, data) { success ->
            if (success) {
                // Show confirmation to user
                showSuccessMessage("Statement submitted successfully")
            } else {
                // Handle error
                showErrorMessage("Failed to submit statement")
            }
        }
    }
    
    override fun onVehicleActionRequired(action: String, vehicleId: String?) {
        when (action) {
            "add_vehicle" -> {
                // Navigate to add vehicle screen
                val intent = Intent(this, AddVehicleActivity::class.java)
                startActivity(intent)
            }
            "edit_vehicle" -> {
                vehicleId?.let {
                    // Navigate to edit vehicle screen
                    val intent = Intent(this, EditVehicleActivity::class.java)
                    intent.putExtra("vehicleId", it)
                    startActivity(intent)
                }
            }
            "verify_insurance" -> {
                vehicleId?.let {
                    // Navigate to insurance verification
                    val intent = Intent(this, InsuranceVerificationActivity::class.java)
                    intent.putExtra("vehicleId", it)
                    startActivity(intent)
                }
            }
        }
    }
    
    override fun onUserActionRequired(action: String) {
        when (action) {
            "update_profile" -> {
                // Navigate to profile update screen
                val intent = Intent(this, UpdateProfileActivity::class.java)
                startActivity(intent)
            }
            "verify_license" -> {
                // Navigate to license verification
                val intent = Intent(this, LicenseVerificationActivity::class.java)
                startActivity(intent)
            }
        }
    }
    
    override fun onDataSyncRequested(): Map<String, Any>? {
        // Return current user and vehicle data
        return mapOf(
            "user" to (currentUser?.let { user ->
                mapOf(
                    "id" to user.id,
                    "email" to user.email,
                    "firstName" to user.firstName,
                    "lastName" to user.lastName
                )
            } ?: emptyMap<String, Any>()),
            "vehicles" to userVehicles.map { vehicle ->
                mapOf(
                    "id" to vehicle.id,
                    "vin" to vehicle.vin,
                    "make" to vehicle.make,
                    "model" to vehicle.model
                )
            },
            "timestamp" to System.currentTimeMillis()
        )
    }
    
    override fun onFileSaved(filepath: String, filename: String) {
        // Handle file save completion
        // You might want to backup to cloud storage, show confirmation, etc.
        println("File saved: $filename at $filepath")
    }
    
    override fun onCloseRequested() {
        // User wants to close E-Claims and return to your app
        finish() // or navigate back to your main screen
    }
    
    override fun onAnalyticsEvent(event: String, parameters: Map<String, Any>) {
        // Forward to your analytics system
        // Example: Firebase Analytics, Mixpanel, etc.
        yourAnalyticsManager.logEvent(event, parameters)
    }
    
    override fun onToolbarUpdateRequested(config: Map<String, Any>) {
        // Update your app's toolbar/action bar
        runOnUiThread {
            config["title"]?.let { title ->
                supportActionBar?.title = title as String
            }
            
            config["showBackButton"]?.let { showBack ->
                supportActionBar?.setDisplayHomeAsUpEnabled(showBack as Boolean)
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private fun loadCurrentUser(completion: (UserModel) -> Unit) {
        // Load user from your database/API
        // This is just an example
        val user = UserModel(
            id = "user123",
            email = "john.doe@example.com",
            firstName = "John",
            lastName = "Doe",
            phone = "+1234567890",
            driversLicense = "DL123456",
            licenseExpiry = "2025-12-31",
            insuranceProvider = "Insurance Co",
            policyNumber = "POL123456"
        )
        completion(user)
    }
    
    private fun loadUserVehicles(userId: String, completion: (List<VehicleModel>) -> Unit) {
        // Load vehicles from your database/API
        // This is just an example
        val vehicles = listOf(
            VehicleModel(
                id = "vehicle1",
                vin = "1HGBH41JXMN109186",
                make = "Porsche",
                model = "911",
                year = 2023,
                licensePlate = "ABC123",
                color = "Black",
                insuranceProvider = "Insurance Co",
                insurancePolicyNumber = "POL123456",
                insuranceExpiry = "2024-12-31"
            )
        )
        completion(vehicles)
    }
    
    private fun saveStatementToBackend(statementId: String, data: Map<String, Any>, completion: (Boolean) -> Unit) {
        // Save statement to your backend
        // This is just an example
        completion(true)
    }
    
    private fun showSuccessMessage(message: String) {
        // Show success message to user
        runOnUiThread {
            android.widget.Toast.makeText(this, message, android.widget.Toast.LENGTH_LONG).show()
        }
    }
    
    private fun showErrorMessage(message: String) {
        // Show error message to user
        runOnUiThread {
            android.widget.Toast.makeText(this, message, android.widget.Toast.LENGTH_LONG).show()
        }
    }
    
    private fun isSystemInDarkMode(): Boolean {
        val nightModeFlags = resources.configuration.uiMode and 
            android.content.res.Configuration.UI_MODE_NIGHT_MASK
        return nightModeFlags == android.content.res.Configuration.UI_MODE_NIGHT_YES
    }
    
    // MARK: - React Native Lifecycle
    
    override fun onBackPressed() {
        if (reactInstanceManager != null) {
            reactInstanceManager.onBackPressed()
        } else {
            super.onBackPressed()
        }
    }
    
    override fun onPause() {
        super.onPause()
        reactInstanceManager.onHostPause(this)
    }
    
    override fun onResume() {
        super.onResume()
        reactInstanceManager.onHostResume(this, this)
    }
    
    override fun onDestroy() {
        super.onDestroy()
        reactInstanceManager.onHostDestroy(this)
        if (::reactRootView.isInitialized) {
            reactRootView.unmountReactApplication()
        }
    }
}

// MARK: - Data Models

data class UserModel(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val phone: String,
    val driversLicense: String,
    val licenseExpiry: String,
    val insuranceProvider: String,
    val policyNumber: String
)

data class VehicleModel(
    val id: String,
    val vin: String,
    val make: String,
    val model: String,
    val year: Int,
    val licensePlate: String,
    val color: String,
    val insuranceProvider: String,
    val insurancePolicyNumber: String,
    val insuranceExpiry: String
)

// MARK: - React Native Package

class EClaimsReactPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(
            EClaimsAndroidModule(reactContext, reactContext.currentActivity!!)
        )
    }
    
    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
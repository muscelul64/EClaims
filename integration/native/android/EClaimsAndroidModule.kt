/**
 * EClaimsAndroidModule.kt
 * 
 * Native Android module for integrating React Native E-Claims
 * into Kotlin Android applications.
 */

package com.deactech.eclaims.native

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.io.File
import java.io.FileOutputStream

class EClaimsAndroidModule(
    private val reactContext: ReactApplicationContext,
    private val hostActivity: Activity
) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    companion object {
        const val MODULE_NAME = "EClaimsAndroidNative"
        
        // Event names
        const val EVENT_USER_UPDATED = "EClaimsNative_UserUpdated"
        const val EVENT_VEHICLES_UPDATED = "EClaimsNative_VehiclesUpdated"
        const val EVENT_NAVIGATION_CHANGED = "EClaimsNative_NavigationChanged"
    }

    private val gson = Gson()
    private var eClaimsConfig: Map<String, Any>? = null
    private var hostActivityListener: EClaimsHostListener? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = MODULE_NAME

    override fun getConstants(): MutableMap<String, Any> {
        return hashMapOf(
            "MODULE_NAME" to MODULE_NAME,
            "SUPPORTED_PERMISSIONS" to arrayOf(
                "android.permission.CAMERA",
                "android.permission.ACCESS_FINE_LOCATION",
                "android.permission.ACCESS_COARSE_LOCATION",
                "android.permission.WRITE_EXTERNAL_STORAGE"
            )
        )
    }

    /**
     * Initialize E-Claims with configuration from Kotlin host app
     */
    @ReactMethod
    fun initializeEClaims(configJson: String, promise: Promise) {
        try {
            val config: Map<String, Any> = gson.fromJson(
                configJson, 
                object : TypeToken<Map<String, Any>>() {}.type
            )
            
            eClaimsConfig = config
            
            // Notify host app that E-Claims is initialized
            hostActivityListener?.onEClaimsInitialized(config)
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", "Failed to initialize E-Claims", e)
        }
    }

    /**
     * Update user data from Kotlin host app
     */
    @ReactMethod
    fun updateUserData(userDataJson: String, promise: Promise) {
        try {
            val userData: Map<String, Any> = gson.fromJson(
                userDataJson,
                object : TypeToken<Map<String, Any>>() {}.type
            )
            
            // Send event to React Native
            sendEvent(EVENT_USER_UPDATED, Arguments.fromBundle(
                convertMapToBundle(userData)
            ))
            
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("USER_UPDATE_ERROR", "Failed to update user data", e)
        }
    }

    /**
     * Update vehicle data from Kotlin host app
     */
    @ReactMethod
    fun updateVehicleData(vehicleDataJson: String, promise: Promise) {
        try {
            val vehicleData: List<Map<String, Any>> = gson.fromJson(
                vehicleDataJson,
                object : TypeToken<List<Map<String, Any>>>() {}.type
            )
            
            val vehicleArray = Arguments.createArray()
            vehicleData.forEach { vehicle ->
                vehicleArray.pushMap(Arguments.fromBundle(convertMapToBundle(vehicle)))
            }
            
            // Send event to React Native
            sendEvent(EVENT_VEHICLES_UPDATED, vehicleArray)
            
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("VEHICLE_UPDATE_ERROR", "Failed to update vehicle data", e)
        }
    }

    /**
     * Sync data from Kotlin host app
     */
    @ReactMethod
    fun syncDataFromNative(promise: Promise) {
        try {
            val syncData = hostActivityListener?.onDataSyncRequested()
            val syncDataJson = gson.toJson(syncData ?: emptyMap<String, Any>())
            promise.resolve(syncDataJson)
        } catch (e: Exception) {
            promise.reject("SYNC_ERROR", "Failed to sync data from native", e)
        }
    }

    /**
     * Navigate to native Kotlin screen
     */
    @ReactMethod
    fun navigateToNativeScreen(screenName: String, paramsJson: String?, promise: Promise) {
        try {
            val params = paramsJson?.let { 
                gson.fromJson<Map<String, Any>>(
                    it, 
                    object : TypeToken<Map<String, Any>>() {}.type
                )
            }
            
            hostActivityListener?.onNavigationRequested(screenName, params)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("NAVIGATION_ERROR", "Failed to navigate to native screen", e)
        }
    }

    /**
     * Close E-Claims and return to Kotlin app
     */
    @ReactMethod
    fun closeEClaims(promise: Promise) {
        try {
            hostActivityListener?.onCloseRequested()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("CLOSE_ERROR", "Failed to close E-Claims", e)
        }
    }

    /**
     * Save file via Kotlin app
     */
    @ReactMethod
    fun saveFileToNative(dataJson: String, filename: String, promise: Promise) {
        try {
            val filesDir = reactContext.getExternalFilesDir(null)
            val file = File(filesDir, filename)
            
            FileOutputStream(file).use { output ->
                output.write(dataJson.toByteArray())
            }
            
            val filepath = file.absolutePath
            hostActivityListener?.onFileSaved(filepath, filename)
            
            promise.resolve(filepath)
        } catch (e: Exception) {
            promise.reject("FILE_SAVE_ERROR", "Failed to save file", e)
        }
    }

    /**
     * Share file via Kotlin app
     */
    @ReactMethod
    fun shareFromNative(filepath: String, mimeType: String, promise: Promise) {
        try {
            val file = File(filepath)
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "File not found: $filepath")
                return
            }

            val fileUri = FileProvider.getUriForFile(
                reactContext,
                "${reactContext.packageName}.fileprovider",
                file
            )

            val shareIntent = Intent().apply {
                action = Intent.ACTION_SEND
                type = mimeType
                putExtra(Intent.EXTRA_STREAM, fileUri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            val chooser = Intent.createChooser(shareIntent, "Share via")
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            
            reactContext.startActivity(chooser)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SHARE_ERROR", "Failed to share file", e)
        }
    }

    /**
     * Request Android permission via Kotlin app
     */
    @ReactMethod
    fun requestNativePermission(permission: String, promise: Promise) {
        try {
            val hasPermission = ContextCompat.checkSelfPermission(
                hostActivity, 
                permission
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED

            if (hasPermission) {
                promise.resolve(true)
            } else {
                // Store promise to resolve after permission result
                ActivityCompat.requestPermissions(
                    hostActivity,
                    arrayOf(permission),
                    permission.hashCode()
                )
                // Note: This would need a callback mechanism in real implementation
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", "Failed to request permission", e)
        }
    }

    /**
     * Show native Android alert dialog
     */
    @ReactMethod
    fun showNativeAlert(
        title: String, 
        message: String, 
        buttonsJson: String, 
        promise: Promise
    ) {
        try {
            val buttons: List<Map<String, String>> = gson.fromJson(
                buttonsJson,
                object : TypeToken<List<Map<String, String>>>() {}.type
            )

            val alertBuilder = AlertDialog.Builder(hostActivity)
            alertBuilder.setTitle(title)
            alertBuilder.setMessage(message)

            buttons.forEachIndexed { index, button ->
                val buttonText = button["text"] ?: "OK"
                val buttonStyle = button["style"] ?: "default"

                when (index) {
                    0 -> alertBuilder.setPositiveButton(buttonText) { _, _ ->
                        promise.resolve(buttonText)
                    }
                    1 -> alertBuilder.setNegativeButton(buttonText) { _, _ ->
                        promise.resolve(buttonText)
                    }
                    2 -> alertBuilder.setNeutralButton(buttonText) { _, _ ->
                        promise.resolve(buttonText)
                    }
                }
            }

            alertBuilder.setOnCancelListener {
                promise.resolve("cancel")
            }

            hostActivity.runOnUiThread {
                alertBuilder.create().show()
            }
        } catch (e: Exception) {
            promise.reject("ALERT_ERROR", "Failed to show alert", e)
        }
    }

    /**
     * Show native Android toast
     */
    @ReactMethod
    fun showNativeToast(message: String, duration: Int) {
        val toastDuration = if (duration > 3000) Toast.LENGTH_LONG else Toast.LENGTH_SHORT
        
        hostActivity.runOnUiThread {
            Toast.makeText(hostActivity, message, toastDuration).show()
        }
    }

    /**
     * Log analytics event to Kotlin app
     */
    @ReactMethod
    fun logEventToNative(event: String, parametersJson: String) {
        try {
            val parameters: Map<String, Any> = gson.fromJson(
                parametersJson,
                object : TypeToken<Map<String, Any>>() {}.type
            )
            
            hostActivityListener?.onAnalyticsEvent(event, parameters)
        } catch (e: Exception) {
            // Log error but don't crash
            android.util.Log.e(MODULE_NAME, "Failed to log analytics event", e)
        }
    }

    /**
     * Update native toolbar from React Native
     */
    @ReactMethod
    fun updateNativeToolbar(configJson: String, promise: Promise) {
        try {
            val config: Map<String, Any> = gson.fromJson(
                configJson,
                object : TypeToken<Map<String, Any>>() {}.type
            )
            
            hostActivityListener?.onToolbarUpdateRequested(config)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("TOOLBAR_ERROR", "Failed to update toolbar", e)
        }
    }

    /**
     * Notify Kotlin app that statement was submitted
     */
    @ReactMethod
    fun notifyStatementSubmitted(statementId: String, dataJson: String, promise: Promise) {
        try {
            val data: Map<String, Any> = gson.fromJson(
                dataJson,
                object : TypeToken<Map<String, Any>>() {}.type
            )
            
            hostActivityListener?.onStatementSubmitted(statementId, data)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("STATEMENT_ERROR", "Failed to submit statement", e)
        }
    }

    /**
     * Notify Kotlin app that vehicle action is required
     */
    @ReactMethod
    fun notifyVehicleActionRequired(action: String, vehicleId: String?, promise: Promise) {
        try {
            hostActivityListener?.onVehicleActionRequired(action, vehicleId)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("VEHICLE_ACTION_ERROR", "Failed to request vehicle action", e)
        }
    }

    /**
     * Notify Kotlin app that user action is required
     */
    @ReactMethod
    fun notifyUserActionRequired(action: String, promise: Promise) {
        try {
            hostActivityListener?.onUserActionRequired(action)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("USER_ACTION_ERROR", "Failed to request user action", e)
        }
    }

    // Set listener for host app communication
    fun setHostListener(listener: EClaimsHostListener) {
        hostActivityListener = listener
    }

    // Send events to React Native
    private fun sendEvent(eventName: String, data: WritableArray) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, data)
    }

    private fun sendEvent(eventName: String, data: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, data)
    }

    // Helper to convert Map to Bundle
    private fun convertMapToBundle(map: Map<String, Any>): android.os.Bundle {
        val bundle = android.os.Bundle()
        map.forEach { (key, value) ->
            when (value) {
                is String -> bundle.putString(key, value)
                is Int -> bundle.putInt(key, value)
                is Long -> bundle.putLong(key, value)
                is Double -> bundle.putDouble(key, value)
                is Boolean -> bundle.putBoolean(key, value)
                else -> bundle.putString(key, value.toString())
            }
        }
        return bundle
    }

    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        // Handle activity results if needed
    }

    override fun onNewIntent(intent: Intent?) {
        // Handle new intents if needed
    }
}

/**
 * Interface for Kotlin host app to implement
 */
interface EClaimsHostListener {
    fun onEClaimsInitialized(config: Map<String, Any>)
    fun onNavigationRequested(screenName: String, params: Map<String, Any>?)
    fun onStatementSubmitted(statementId: String, data: Map<String, Any>)
    fun onVehicleActionRequired(action: String, vehicleId: String?)
    fun onUserActionRequired(action: String)
    fun onDataSyncRequested(): Map<String, Any>?
    fun onFileSaved(filepath: String, filename: String)
    fun onCloseRequested()
    fun onAnalyticsEvent(event: String, parameters: Map<String, Any>)
    fun onToolbarUpdateRequested(config: Map<String, Any>)
}
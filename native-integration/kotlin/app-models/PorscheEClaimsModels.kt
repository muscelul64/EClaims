package com.deactech.drivesafeandroid

import com.google.gson.annotations.SerializedName
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path

// ==========================================
// Data Models
// ==========================================

data class Vehicle(
    @SerializedName("id") val id: String,
    @SerializedName("make") val make: String,
    @SerializedName("model") val model: String,
    @SerializedName("year") val year: Int,
    @SerializedName("vin") val vin: String,
    @SerializedName("licensePlate") val licensePlate: String,
    @SerializedName("color") val color: String,
    @SerializedName("fuelType") val fuelType: FuelType? = null,
    @SerializedName("insuranceCompany") val insuranceCompany: String? = null,
    @SerializedName("policyNumber") val policyNumber: String? = null,
    @SerializedName("registrationDocument") val registrationDocument: String? = null,
    @SerializedName("createdAt") val createdAt: Long,
    @SerializedName("updatedAt") val updatedAt: Long
)

enum class FuelType {
    @SerializedName("gasoline") GASOLINE,
    @SerializedName("diesel") DIESEL,
    @SerializedName("electric") ELECTRIC,
    @SerializedName("hybrid") HYBRID
}

data class StatementLocation(
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("address") val address: String? = null,
    @SerializedName("timestamp") val timestamp: Long
)

data class StatementDamage(
    @SerializedName("id") val id: String,
    @SerializedName("area") val area: String,
    @SerializedName("severity") val severity: Severity,
    @SerializedName("description") val description: String? = null,
    @SerializedName("photos") val photos: List<CapturePhoto>
)

enum class Severity {
    @SerializedName("minor") MINOR,
    @SerializedName("moderate") MODERATE,
    @SerializedName("severe") SEVERE
}

data class CapturePhoto(
    @SerializedName("id") val id: String,
    @SerializedName("uri") val uri: String, // Local URI or path
    @SerializedName("timestamp") val timestamp: Long,
    @SerializedName("type") val type: PhotoType? = null, // e.g., "damage", "license", "id"
    @SerializedName("location") val location: StatementLocation? = null
)

enum class PhotoType {
    @SerializedName("damage") DAMAGE,
    @SerializedName("license") LICENSE,
    @SerializedName("id") ID,
    @SerializedName("document") DOCUMENT,
    @SerializedName("other") OTHER
}

data class InvolvedParty(
    @SerializedName("type") val type: String, // e.g., "driver", "witness"
    @SerializedName("name") val name: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("isInsured") val isInsured: Boolean? = null,
    @SerializedName("insuranceCompany") val insuranceCompany: String? = null,
    @SerializedName("driverLicense") val driverLicense: CapturePhoto? = null,
    @SerializedName("vehicleRegistration") val vehicleRegistration: CapturePhoto? = null
)

data class WitnessInfo(
    @SerializedName("name") val name: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("statement") val statement: String
)

data class Circumstances(
    @SerializedName("type") val type: String? = null,
    @SerializedName("weather") val weather: List<String>? = null,
    @SerializedName("roadConditions") val roadConditions: List<String>? = null,
    @SerializedName("speed") val speed: String? = null,
    @SerializedName("description") val description: String? = null
)

data class DeviceInfo(
    @SerializedName("platform") val platform: String,
    @SerializedName("version") val version: String,
    @SerializedName("appVersion") val appVersion: String
)

data class ClaimStatement(
    @SerializedName("id") val id: String,
    @SerializedName("type") val type: StatementType,
    @SerializedName("status") val status: StatementStatus,
    @SerializedName("vehicle") val vehicle: Vehicle,
    @SerializedName("incidentDate") val incidentDate: Long, // Use ISO 8601 String for API if needed, but app uses number
    @SerializedName("location") val location: StatementLocation,
    @SerializedName("description") val description: String,
    @SerializedName("damages") val damages: List<StatementDamage>,
    @SerializedName("photos") val photos: List<CapturePhoto>,
    @SerializedName("involvedParties") val involvedParties: List<InvolvedParty>? = null,
    @SerializedName("circumstances") val circumstances: Circumstances? = null,
    @SerializedName("isEmergencyServicesInvolved") val isEmergencyServicesInvolved: Boolean,
    @SerializedName("policeReportNumber") val policeReportNumber: String? = null,
    @SerializedName("witnessInfo") val witnessInfo: List<WitnessInfo>? = null,
    @SerializedName("confirmationNumber") val confirmationNumber: String? = null,
    @SerializedName("deviceInfo") val deviceInfo: DeviceInfo? = null,
    @SerializedName("createdAt") val createdAt: Long,
    @SerializedName("updatedAt") val updatedAt: Long,
    @SerializedName("submittedAt") val submittedAt: Long? = null
)

enum class StatementType {
    @SerializedName("accident") ACCIDENT,
    @SerializedName("damage") DAMAGE,
    @SerializedName("theft") THEFT
}

enum class StatementStatus {
    @SerializedName("draft") DRAFT,
    @SerializedName("submitted") SUBMITTED,
    @SerializedName("processing") PROCESSING,
    @SerializedName("completed") COMPLETED
}

// ==========================================
// API Request/Response Models
// ==========================================

data class SubmitStatementResponse(
    @SerializedName("statementId") val statementId: String,
    @SerializedName("status") val status: String,
    @SerializedName("confirmationNumber") val confirmationNumber: String,
    @SerializedName("message") val message: String,
    @SerializedName("estimatedProcessingTime") val estimatedProcessingTime: String?,
    @SerializedName("nextSteps") val nextSteps: List<String>?
)

data class ApiErrorResponse(
    @SerializedName("error") val error: Boolean,
    @SerializedName("message") val message: String,
    @SerializedName("code") val code: String,
    @SerializedName("details") val details: Any?
)

// ==========================================
// API Client Interface
// ==========================================

interface StatementApiService {
    /**
     * Submits a new claim statement.
     */
    @POST("statements")
    suspend fun submitStatement(
        @Body statement: ClaimStatement
    ): Response<SubmitStatementResponse>

    /**
     * Uploads photos associated with a statement.
     *
     * @param statementId The ID of the statement.
     * @param photoData Metadata for each photo (key: "photoData_{index}", value: JSON string).
     * @param photos The actual image files.
     */
    @Multipart
    @POST("statements/{statementId}/photos")
    suspend fun uploadPhotos(
        @Path("statementId") statementId: String,
        @Part photoData: List<MultipartBody.Part>, // JSON metadata parts
        @Part photos: List<MultipartBody.Part>     // File parts
    ): Response<Unit> // Assuming 200 OK empty response or similar success structure
}

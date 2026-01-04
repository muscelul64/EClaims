package com.deactech.drivesafeandroid.data

import com.deactech.drivesafeandroid.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import javax.inject.Inject // Assuming Hilt/Dagger, or manual injection

// ==========================================
// Vehicle Repository
// ==========================================

class VehicleRepository(private val vehicleDao: VehicleDao) {

    val allVehicles: Flow<List<Vehicle>> = vehicleDao.getAllVehicles()
        .map { entities -> entities.map { it.toModel() } }

    suspend fun addVehicle(vehicle: Vehicle) {
        vehicleDao.insertVehicle(vehicle.toEntity())
    }

    suspend fun updateVehicle(vehicle: Vehicle) {
        vehicleDao.insertVehicle(vehicle.toEntity())
    }

    suspend fun removeVehicle(id: String) {
        vehicleDao.deleteVehicleById(id)
    }

    suspend fun getVehicle(id: String): Vehicle? {
        return vehicleDao.getVehicleById(id)?.toModel()
    }
}

// ==========================================
// Statement Repository
// ==========================================

class StatementRepository(
    private val statementDao: StatementDao,
    private val apiService: StatementApiService // Injected Retrofit Service
) {

    val allStatements: Flow<List<ClaimStatement>> = statementDao.getAllStatements()
        .map { entities -> entities.map { it.toModel() } }

    suspend fun createStatement(statement: ClaimStatement) {
        statementDao.insertStatement(statement.toEntity())
    }

    suspend fun updateStatement(statement: ClaimStatement) {
        statementDao.insertStatement(statement.toEntity())
    }

    suspend fun getStatement(id: String): ClaimStatement? {
        return statementDao.getStatementById(id)?.toModel()
    }

    suspend fun deleteStatement(id: String) {
        statementDao.deleteStatementById(id)
    }

    /**
     * Submits the statement to the backend API.
     * Updates the local status upon success or failure.
     */
    suspend fun submitStatement(statement: ClaimStatement): Result<SubmitStatementResponse> {
        return try {
            // Update local state to SUBMITTED (optimistic or pre-submission state)
            // In a real app, maybe mark as "Syncing"

            val response = apiService.submitStatement(statement)

            if (response.isSuccessful && response.body() != null) {
                val apiResponse = response.body()!!

                // Update local statement with confirmation info
                val updatedStatement = statement.copy(
                    status = StatementStatus.PROCESSING,
                    confirmationNumber = apiResponse.confirmationNumber,
                    submittedAt = System.currentTimeMillis()
                )
                statementDao.insertStatement(updatedStatement.toEntity())

                // Trigger photo upload in background (or sequentially here)
                if (statement.photos.isNotEmpty()) {
                    uploadPhotos(statement.id, statement.photos)
                }

                Result.success(apiResponse)
            } else {
                Result.failure(Exception("API Error: ${response.code()} ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private suspend fun uploadPhotos(statementId: String, photos: List<CapturePhoto>) {
        try {
            val photoParts = photos.mapNotNull { photo ->
                val file = File(photo.uri)
                if (file.exists()) {
                    val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
                    MultipartBody.Part.createFormData("photos", file.name, requestFile)
                } else null
            }

            val metadataParts = photos.mapIndexed { index, photo ->
                val json = """{"id":"${photo.id}","type":"${photo.type}"}""" // Simplified metadata
                MultipartBody.Part.createFormData("photoData_$index", json)
            }

            if (photoParts.isNotEmpty()) {
                apiService.uploadPhotos(statementId, metadataParts, photoParts)
            }
        } catch (e: Exception) {
            // Log error, maybe schedule retry
            println("Failed to upload photos: ${e.message}")
        }
    }
}

// ==========================================
// User Repository
// ==========================================

class UserRepository(private val userDao: UserDao) {

    val currentUser = userDao.getCurrentUser()
        .map { entity ->
            // Map Entity to Domain User object
            if (entity != null) {
                // Construct a user object from entity
                // This is a simplification; you might want a specific User model separate from Auth
                 User( // Using the local User model defined below
                     id = entity.id,
                     authenticated = entity.authToken != null,
                     authToken = entity.authToken,
                     name = entity.name,
                     email = entity.email
                 )
            } else {
                null
            }
        }

    suspend fun login(user: User) {
        val entity = UserEntity(
            authToken = user.authToken,
            tokenExpiresAt = System.currentTimeMillis() + 3600000, // Dummy expiry
            userId = user.id,
            name = user.name,
            email = user.email
        )
        userDao.insertUser(entity)
    }

    suspend fun logout() {
        userDao.clearUser()
    }
}

// Simple User model for repo usage if not already defined in Models
data class User(
    val id: String,
    val authenticated: Boolean,
    val authToken: String?,
    val name: String?,
    val email: String?
)

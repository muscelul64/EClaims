package com.deactech.drivesafeandroid.data

import androidx.room.*
import com.deactech.drivesafeandroid.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.flow.Flow

// ==========================================
// Type Converters
// ==========================================

class Converters {
    private val gson = Gson()

    @TypeConverter
    fun fromStringList(value: List<String>?): String? {
        return value?.let { gson.toJson(it) }
    }

    @TypeConverter
    fun toStringList(value: String?): List<String>? {
        return value?.let {
            val type = object : TypeToken<List<String>>() {}.type
            gson.fromJson(it, type)
        }
    }

    @TypeConverter
    fun fromStatementLocation(value: StatementLocation?): String? {
        return value?.let { gson.toJson(it) }
    }

    @TypeConverter
    fun toStatementLocation(value: String?): StatementLocation? {
        return value?.let { gson.fromJson(it, StatementLocation::class.java) }
    }

    @TypeConverter
    fun fromStatementDamageList(value: List<StatementDamage>?): String? {
        return value?.let { gson.toJson(it) }
    }

    @TypeConverter
    fun toStatementDamageList(value: String?): List<StatementDamage>? {
        return value?.let {
            val type = object : TypeToken<List<StatementDamage>>() {}.type
            gson.fromJson(it, type)
        }
    }

    @TypeConverter
    fun fromCapturePhotoList(value: List<CapturePhoto>?): String? {
        return value?.let { gson.toJson(it) }
    }

    @TypeConverter
    fun toCapturePhotoList(value: String?): List<CapturePhoto>? {
        return value?.let {
            val type = object : TypeToken<List<CapturePhoto>>() {}.type
            gson.fromJson(it, type)
        }
    }

    @TypeConverter
    fun fromInvolvedPartyList(value: List<InvolvedParty>?): String? {
        return value?.let { gson.toJson(it) }
    }

    @TypeConverter
    fun toInvolvedPartyList(value: String?): List<InvolvedParty>? {
        return value?.let {
            val type = object : TypeToken<List<InvolvedParty>>() {}.type
            gson.fromJson(it, type)
        }
    }

    @TypeConverter
    fun fromCircumstances(value: Circumstances?): String? {
        return value?.let { gson.toJson(it) }
    }

    @TypeConverter
    fun toCircumstances(value: String?): Circumstances? {
        return value?.let { gson.fromJson(it, Circumstances::class.java) }
    }

    @TypeConverter
    fun fromWitnessInfoList(value: List<WitnessInfo>?): String? {
        return value?.let { gson.toJson(it) }
    }

    @TypeConverter
    fun toWitnessInfoList(value: String?): List<WitnessInfo>? {
        return value?.let {
            val type = object : TypeToken<List<WitnessInfo>>() {}.type
            gson.fromJson(it, type)
        }
    }

    @TypeConverter
    fun fromDeviceInfo(value: DeviceInfo?): String? {
        return value?.let { gson.toJson(it) }
    }

    @TypeConverter
    fun toDeviceInfo(value: String?): DeviceInfo? {
        return value?.let { gson.fromJson(it, DeviceInfo::class.java) }
    }

    @TypeConverter
    fun fromVehicle(value: Vehicle?): String? {
        return value?.let { gson.toJson(it) }
    }

    @TypeConverter
    fun toVehicle(value: String?): Vehicle? {
        return value?.let { gson.fromJson(it, Vehicle::class.java) }
    }

    @TypeConverter
    fun fromFuelType(value: FuelType?): String? {
        return value?.name
    }

    @TypeConverter
    fun toFuelType(value: String?): FuelType? {
        return value?.let { enumValueOf<FuelType>(it) }
    }

    @TypeConverter
    fun fromStatementType(value: StatementType?): String? {
        return value?.name
    }

    @TypeConverter
    fun toStatementType(value: String?): StatementType? {
        return value?.let { enumValueOf<StatementType>(it) }
    }

    @TypeConverter
    fun fromStatementStatus(value: StatementStatus?): String? {
        return value?.name
    }

    @TypeConverter
    fun toStatementStatus(value: String?): StatementStatus? {
        return value?.let { enumValueOf<StatementStatus>(it) }
    }
}

// ==========================================
// Entities
// ==========================================

@Entity(tableName = "vehicles")
data class VehicleEntity(
    @PrimaryKey val id: String,
    val make: String,
    val model: String,
    val year: Int,
    val vin: String,
    val licensePlate: String,
    val color: String,
    val fuelType: FuelType?,
    val insuranceCompany: String?,
    val policyNumber: String?,
    val registrationDocument: String?,
    val createdAt: Long,
    val updatedAt: Long
)

// Extension to convert between Entity and Model
fun VehicleEntity.toModel() = Vehicle(
    id, make, model, year, vin, licensePlate, color, fuelType, insuranceCompany, policyNumber, registrationDocument, createdAt, updatedAt
)

fun Vehicle.toEntity() = VehicleEntity(
    id, make, model, year, vin, licensePlate, color, fuelType, insuranceCompany, policyNumber, registrationDocument, createdAt, updatedAt
)

@Entity(tableName = "statements")
data class StatementEntity(
    @PrimaryKey val id: String,
    val type: StatementType,
    val status: StatementStatus,
    val vehicle: Vehicle, // Stored as JSON via Converter
    val incidentDate: Long,
    val location: StatementLocation, // Stored as JSON
    val description: String,
    val damages: List<StatementDamage>, // Stored as JSON
    val photos: List<CapturePhoto>, // Stored as JSON
    val involvedParties: List<InvolvedParty>?,
    val circumstances: Circumstances?,
    val isEmergencyServicesInvolved: Boolean,
    val policeReportNumber: String?,
    val witnessInfo: List<WitnessInfo>?,
    val confirmationNumber: String?,
    val deviceInfo: DeviceInfo?,
    val createdAt: Long,
    val updatedAt: Long,
    val submittedAt: Long?
)

fun StatementEntity.toModel() = ClaimStatement(
    id, type, status, vehicle, incidentDate, location, description, damages, photos, involvedParties, circumstances, isEmergencyServicesInvolved, policeReportNumber, witnessInfo, confirmationNumber, deviceInfo, createdAt, updatedAt, submittedAt
)

fun ClaimStatement.toEntity() = StatementEntity(
    id, type, status, vehicle, incidentDate, location, description, damages, photos, involvedParties, circumstances, isEmergencyServicesInvolved, policeReportNumber, witnessInfo, confirmationNumber, deviceInfo, createdAt, updatedAt, submittedAt
)

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String = "current_user", // Single user for now
    val authToken: String?,
    val tokenExpiresAt: Long?,
    val userId: String?,
    val name: String?,
    val email: String?
)

// ==========================================
// DAOs
// ==========================================

@Dao
interface VehicleDao {
    @Query("SELECT * FROM vehicles ORDER BY updatedAt DESC")
    fun getAllVehicles(): Flow<List<VehicleEntity>>

    @Query("SELECT * FROM vehicles WHERE id = :id")
    suspend fun getVehicleById(id: String): VehicleEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVehicle(vehicle: VehicleEntity)

    @Delete
    suspend fun deleteVehicle(vehicle: VehicleEntity)

    @Query("DELETE FROM vehicles WHERE id = :id")
    suspend fun deleteVehicleById(id: String)
}

@Dao
interface StatementDao {
    @Query("SELECT * FROM statements ORDER BY createdAt DESC")
    fun getAllStatements(): Flow<List<StatementEntity>>

    @Query("SELECT * FROM statements WHERE id = :id")
    suspend fun getStatementById(id: String): StatementEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertStatement(statement: StatementEntity)

    @Delete
    suspend fun deleteStatement(statement: StatementEntity)

    @Query("DELETE FROM statements WHERE id = :id")
    suspend fun deleteStatementById(id: String)
}

@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE id = 'current_user'")
    fun getCurrentUser(): Flow<UserEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Query("DELETE FROM users")
    suspend fun clearUser()
}

// ==========================================
// Database
// ==========================================

@Database(
    entities = [VehicleEntity::class, StatementEntity::class, UserEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun vehicleDao(): VehicleDao
    abstract fun statementDao(): StatementDao
    abstract fun userDao(): UserDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: android.content.Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "porsche_eclaims_database"
                )
                .fallbackToDestructiveMigration() // For simplicity in this generated code
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

package com.deactech.drivesafeandroid.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.deactech.drivesafeandroid.*
import com.deactech.drivesafeandroid.data.VehicleRepository
import com.deactech.drivesafeandroid.data.StatementRepository
import com.deactech.drivesafeandroid.data.UserRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID

// ==========================================
// Vehicle View Model
// ==========================================

class VehicleViewModel(private val repository: VehicleRepository) : ViewModel() {

    val vehicles: StateFlow<List<Vehicle>> = repository.allVehicles
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun addVehicle(make: String, model: String, year: Int, vin: String, licensePlate: String) {
        viewModelScope.launch {
            val now = System.currentTimeMillis()
            val vehicle = Vehicle(
                id = UUID.randomUUID().toString(),
                make = make,
                model = model,
                year = year,
                vin = vin,
                licensePlate = licensePlate,
                color = "Unknown", // Default or add to params
                createdAt = now,
                updatedAt = now
            )
            repository.addVehicle(vehicle)
        }
    }

    fun deleteVehicle(id: String) {
        viewModelScope.launch {
            repository.removeVehicle(id)
        }
    }
}

// ==========================================
// Statement View Model
// ==========================================

class StatementViewModel(
    private val repository: StatementRepository,
    private val userRepository: UserRepository
) : ViewModel() {

    val statements: StateFlow<List<ClaimStatement>> = repository.allStatements
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _currentStatement = MutableStateFlow<ClaimStatement?>(null)
    val currentStatement: StateFlow<ClaimStatement?> = _currentStatement.asStateFlow()

    private val _submissionStatus = MutableStateFlow<SubmissionState>(SubmissionState.Idle)
    val submissionStatus: StateFlow<SubmissionState> = _submissionStatus.asStateFlow()

    fun startNewStatement(type: StatementType, vehicle: Vehicle) {
        val now = System.currentTimeMillis()
        val newStatement = ClaimStatement(
            id = UUID.randomUUID().toString(),
            type = type,
            status = StatementStatus.DRAFT,
            vehicle = vehicle,
            incidentDate = now,
            location = StatementLocation(0.0, 0.0, null, now),
            description = "",
            damages = emptyList(),
            photos = emptyList(),
            isEmergencyServicesInvolved = false,
            createdAt = now,
            updatedAt = now
        )
        _currentStatement.value = newStatement
    }

    fun updateDescription(description: String) {
        _currentStatement.update { it?.copy(description = description, updatedAt = System.currentTimeMillis()) }
    }

    fun addDamage(damage: StatementDamage) {
        _currentStatement.update {
            val newDamages = it?.damages.orEmpty() + damage
            it?.copy(damages = newDamages, updatedAt = System.currentTimeMillis())
        }
    }

    fun saveStatement() {
        val statement = _currentStatement.value ?: return
        viewModelScope.launch {
            repository.createStatement(statement)
        }
    }

    fun submitStatement() {
        val statement = _currentStatement.value ?: return
        viewModelScope.launch {
            _submissionStatus.value = SubmissionState.Loading

            val result = repository.submitStatement(statement)

            if (result.isSuccess) {
                _submissionStatus.value = SubmissionState.Success(result.getOrNull()?.confirmationNumber ?: "")
                // Refresh current statement from repo as it was updated there
                _currentStatement.value = repository.getStatement(statement.id)
            } else {
                _submissionStatus.value = SubmissionState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
            }
        }
    }
}

sealed class SubmissionState {
    object Idle : SubmissionState()
    object Loading : SubmissionState()
    data class Success(val confirmationNumber: String) : SubmissionState()
    data class Error(val message: String) : SubmissionState()
}

// ==========================================
// User View Model
// ==========================================

class UserViewModel(private val repository: UserRepository) : ViewModel() {

    // Using a simple nullable User for state
    val currentUser = repository.currentUser
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    fun login(id: String, name: String) {
        viewModelScope.launch {
            repository.login(com.deactech.drivesafeandroid.data.User(
                id = id,
                authenticated = true,
                authToken = "dummy_token_${System.currentTimeMillis()}",
                name = name,
                email = "$name@example.com"
            ))
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout()
        }
    }
}

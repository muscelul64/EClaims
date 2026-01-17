package com.deactech.drivesafeandroid.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.deactech.drivesafeandroid.data.StatementRepository
import com.deactech.drivesafeandroid.data.UserRepository
import com.deactech.drivesafeandroid.data.VehicleRepository

class AppViewModelFactory(
    private val vehicleRepository: VehicleRepository,
    private val statementRepository: StatementRepository,
    private val userRepository: UserRepository
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(VehicleViewModel::class.java) -> {
                VehicleViewModel(vehicleRepository) as T
            }
            modelClass.isAssignableFrom(StatementViewModel::class.java) -> {
                StatementViewModel(statementRepository, userRepository) as T
            }
            modelClass.isAssignableFrom(UserViewModel::class.java) -> {
                UserViewModel(userRepository) as T
            }
            else -> throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}

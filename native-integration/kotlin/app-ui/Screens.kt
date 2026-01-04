package com.deactech.drivesafeandroid.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.deactech.drivesafeandroid.Vehicle
import com.deactech.drivesafeandroid.ClaimStatement
import com.deactech.drivesafeandroid.StatementType
import com.deactech.drivesafeandroid.StatementStatus

// ==========================================
// Theme & Common
// ==========================================

@Composable
fun AppTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colors = lightColors(
            primary = Color(0xFFD5001C), // Porsche Red-ish
            secondary = Color.Black
        ),
        content = content
    )
}

// ==========================================
// Dashboard / Home Screen
// ==========================================

@Composable
fun DashboardScreen(
    userViewModel: UserViewModel,
    onNavigateToVehicles: () -> Unit,
    onNavigateToStatements: () -> Unit
) {
    val user by userViewModel.currentUser.collectAsState()

    Scaffold(
        topBar = { TopAppBar(title = { Text("Porsche E-Claims") }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(text = "Welcome, ${user?.name ?: "Guest"}", style = MaterialTheme.typography.h5)
            Spacer(modifier = Modifier.height(32.dp))

            Button(onClick = onNavigateToVehicles, modifier = Modifier.fillMaxWidth()) {
                Text("Manage Vehicles")
            }
            Spacer(modifier = Modifier.height(16.dp))

            Button(onClick = onNavigateToStatements, modifier = Modifier.fillMaxWidth()) {
                Text("My Claims")
            }
            Spacer(modifier = Modifier.height(32.dp))

            if (user != null) {
                OutlinedButton(onClick = { userViewModel.logout() }) {
                    Text("Logout")
                }
            } else {
                Button(onClick = { userViewModel.login("user_1", "John Doe") }) {
                    Text("Login Demo User")
                }
            }
        }
    }
}

// ==========================================
// Vehicle List Screen
// ==========================================

@Composable
fun VehicleListScreen(
    vehicleViewModel: VehicleViewModel,
    onBack: () -> Unit,
    onAddVehicle: () -> Unit
) {
    val vehicles by vehicleViewModel.vehicles.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Vehicles") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onAddVehicle) {
                Icon(Icons.Default.Add, contentDescription = "Add Vehicle")
            }
        }
    ) { padding ->
        LazyColumn(modifier = Modifier.padding(padding)) {
            items(vehicles) { vehicle ->
                VehicleItem(vehicle = vehicle)
            }
        }
    }
}

@Composable
fun VehicleItem(vehicle: Vehicle) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        elevation = 4.dp
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = "${vehicle.year} ${vehicle.make} ${vehicle.model}", style = MaterialTheme.typography.h6)
            Text(text = "VIN: ${vehicle.vin}", style = MaterialTheme.typography.body2)
            Text(text = "Plate: ${vehicle.licensePlate}", style = MaterialTheme.typography.body2)
        }
    }
}

// ==========================================
// Claims / Statements List Screen
// ==========================================

@Composable
fun StatementListScreen(
    statementViewModel: StatementViewModel,
    onBack: () -> Unit,
    onCreateNew: () -> Unit
) {
    val statements by statementViewModel.statements.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Claims") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onCreateNew) {
                Icon(Icons.Default.Add, contentDescription = "New Claim")
            }
        }
    ) { padding ->
        LazyColumn(modifier = Modifier.padding(padding)) {
            items(statements) { statement ->
                StatementItem(statement = statement)
            }
        }
    }
}

@Composable
fun StatementItem(statement: ClaimStatement) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        elevation = 4.dp
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Text(text = statement.type.name, style = MaterialTheme.typography.h6)
                Text(text = statement.status.name, color = Color.Gray)
            }
            Text(text = "Vehicle: ${statement.vehicle.model}", style = MaterialTheme.typography.body2)
            Text(text = "Date: ${java.text.SimpleDateFormat("yyyy-MM-dd").format(java.util.Date(statement.incidentDate))}")
        }
    }
}

// ==========================================
// New Claim Wizard (Simplified)
// ==========================================

@Composable
fun NewClaimScreen(
    statementViewModel: StatementViewModel,
    vehicleViewModel: VehicleViewModel,
    onBack: () -> Unit
) {
    var step by remember { mutableStateOf(0) }
    val vehicles by vehicleViewModel.vehicles.collectAsState()
    val currentStatement by statementViewModel.currentStatement.collectAsState()
    val submissionStatus by statementViewModel.submissionStatus.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("New Claim") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            when (step) {
                0 -> { // Select Vehicle & Type
                    Text("Select Vehicle", style = MaterialTheme.typography.h6)
                    LazyColumn(modifier = Modifier.weight(1f)) {
                        items(vehicles) { vehicle ->
                            Card(
                                modifier = Modifier
                                    .padding(vertical = 4.dp)
                                    .fillMaxWidth()
                                    .clickable {
                                        statementViewModel.startNewStatement(StatementType.ACCIDENT, vehicle)
                                        step = 1
                                    },
                                elevation = 2.dp
                            ) {
                                Padding(16.dp) { Text("${vehicle.year} ${vehicle.model}") }
                            }
                        }
                    }
                }
                1 -> { // Details
                    Text("Incident Details", style = MaterialTheme.typography.h6)

                    var description by remember { mutableStateOf(currentStatement?.description ?: "") }

                    TextField(
                        value = description,
                        onValueChange = {
                            description = it
                            statementViewModel.updateDescription(it)
                        },
                        label = { Text("Description") },
                        modifier = Modifier.fillMaxWidth().height(150.dp)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(onClick = { step = 2 }) {
                        Text("Next: Review")
                    }
                }
                2 -> { // Review & Submit
                    Text("Review Claim", style = MaterialTheme.typography.h6)

                    Text("Vehicle: ${currentStatement?.vehicle?.model}")
                    Text("Description: ${currentStatement?.description}")

                    Spacer(modifier = Modifier.height(24.dp))

                    if (submissionStatus is SubmissionState.Loading) {
                        CircularProgressIndicator()
                    } else if (submissionStatus is SubmissionState.Success) {
                        Text("Submitted! Confirmation: ${(submissionStatus as SubmissionState.Success).confirmationNumber}", color = Color.Green)
                        Button(onClick = onBack) { Text("Done") }
                    } else {
                        Button(onClick = { statementViewModel.submitStatement() }) {
                            Text("Submit Claim")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun Padding(padding: androidx.compose.ui.unit.Dp, content: @Composable () -> Unit) {
    Box(modifier = Modifier.padding(padding)) { content() }
}

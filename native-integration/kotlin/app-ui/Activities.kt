package com.deactech.drivesafeandroid.ui

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.activity.ComponentActivity
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.deactech.drivesafeandroid.*
import com.deactech.drivesafeandroid.data.*
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

// ==========================================
// Base Activity for DI Setup
// ==========================================
abstract class BaseActivity : AppCompatActivity() {
    protected val factory: AppViewModelFactory by lazy {
        // In a real app, get these from the Application class instance or Hilt
        val db = AppDatabase.getDatabase(applicationContext)

        // Use Mock API for development/demo, switch to NetworkModule.apiService for production
        val api = NetworkModule.mockApiService

        val vehicleRepo = VehicleRepository(db.vehicleDao())
        val statementRepo = StatementRepository(db.statementDao(), api)
        val userRepo = UserRepository(db.userDao())

        AppViewModelFactory(vehicleRepo, statementRepo, userRepo)
    }
}

// ==========================================
// Dashboard Activity
// ==========================================

class DashboardActivity : BaseActivity() {

    private lateinit var userViewModel: UserViewModel

    // View References
    private lateinit var tvWelcome: TextView
    private lateinit var btnManageVehicles: Button
    private lateinit var btnMyClaims: Button
    private lateinit var btnLogout: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        // Init ViewModel
        userViewModel = ViewModelProvider(this, factory)[UserViewModel::class.java]

        // Bind Views
        tvWelcome = findViewById(R.id.tvWelcome)
        btnManageVehicles = findViewById(R.id.btnManageVehicles)
        btnMyClaims = findViewById(R.id.btnMyClaims)
        btnLogout = findViewById(R.id.btnLogout)

        // Setup Listeners
        btnManageVehicles.setOnClickListener {
            startActivity(Intent(this, VehicleListActivity::class.java))
        }

        btnMyClaims.setOnClickListener {
            startActivity(Intent(this, StatementListActivity::class.java))
        }

        btnLogout.setOnClickListener {
            userViewModel.logout()
        }

        // Observe State
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                userViewModel.currentUser.collectLatest { user ->
                    tvWelcome.text = "Welcome, ${user?.name ?: "Guest"}"
                    btnLogout.visibility = if (user != null) View.VISIBLE else View.GONE
                }
            }
        }
    }
}

// ==========================================
// Vehicle List Activity
// ==========================================

class VehicleListActivity : BaseActivity() {

    private lateinit var viewModel: VehicleViewModel
    private lateinit var adapter: VehicleAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_vehicle_list)

        viewModel = ViewModelProvider(this, factory)[VehicleViewModel::class.java]

        val rvVehicles = findViewById<RecyclerView>(R.id.rvVehicles)
        val fabAdd = findViewById<View>(R.id.fabAddVehicle)

        adapter = VehicleAdapter()
        rvVehicles.layoutManager = LinearLayoutManager(this)
        rvVehicles.adapter = adapter

        fabAdd.setOnClickListener {
            // In real app, open AddVehicleActivity
            // For now, adding a dummy entry
            viewModel.addVehicle("Porsche", "911", 2024, "WP0CA2A8", "DEMO-123")
            Toast.makeText(this, "Demo vehicle added", Toast.LENGTH_SHORT).show()
        }

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.vehicles.collectLatest { vehicles ->
                    adapter.submitList(vehicles)
                }
            }
        }
    }
}

class VehicleAdapter : RecyclerView.Adapter<VehicleAdapter.ViewHolder>() {
    private var list: List<Vehicle> = emptyList()

    fun submitList(newList: List<Vehicle>) {
        list = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_vehicle, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val vehicle = list[position]
        holder.tvTitle.text = "${vehicle.year} ${vehicle.make} ${vehicle.model}"
        holder.tvVin.text = "VIN: ${vehicle.vin}"
        holder.tvPlate.text = "Plate: ${vehicle.licensePlate}"
    }

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvTitle: TextView = view.findViewById(R.id.tvVehicleTitle)
        val tvVin: TextView = view.findViewById(R.id.tvVin)
        val tvPlate: TextView = view.findViewById(R.id.tvLicensePlate)
    }
}

// ==========================================
// Statement List Activity
// ==========================================

class StatementListActivity : BaseActivity() {

    private lateinit var viewModel: StatementViewModel
    private lateinit var adapter: StatementAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_statement_list)

        viewModel = ViewModelProvider(this, factory)[StatementViewModel::class.java]

        val rvStatements = findViewById<RecyclerView>(R.id.rvStatements)
        val fabNew = findViewById<View>(R.id.fabNewClaim)

        adapter = StatementAdapter()
        rvStatements.layoutManager = LinearLayoutManager(this)
        rvStatements.adapter = adapter

        fabNew.setOnClickListener {
            startActivity(Intent(this, NewClaimActivity::class.java))
        }

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.statements.collectLatest { statements ->
                    adapter.submitList(statements)
                }
            }
        }
    }
}

class StatementAdapter : RecyclerView.Adapter<StatementAdapter.ViewHolder>() {
    private var list: List<ClaimStatement> = emptyList()

    fun submitList(newList: List<ClaimStatement>) {
        list = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_statement, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val statement = list[position]
        holder.tvType.text = statement.type.name
        holder.tvStatus.text = statement.status.name
        holder.tvVehicle.text = "Vehicle: ${statement.vehicle.model}"
        holder.tvDate.text = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date(statement.incidentDate))
    }

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvType: TextView = view.findViewById(R.id.tvType)
        val tvStatus: TextView = view.findViewById(R.id.tvStatus)
        val tvVehicle: TextView = view.findViewById(R.id.tvStatementVehicle)
        val tvDate: TextView = view.findViewById(R.id.tvDate)
    }
}

// ==========================================
// New Claim Activity
// ==========================================

class NewClaimActivity : BaseActivity() {

    private lateinit var statementViewModel: StatementViewModel
    private lateinit var vehicleViewModel: VehicleViewModel

    private lateinit var spinnerVehicles: Spinner
    private lateinit var etDescription: EditText
    private lateinit var btnSubmit: Button
    private lateinit var btnAddDamage: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var tvStatus: TextView
    private lateinit var rvDamages: RecyclerView
    private lateinit var damageAdapter: DamageAdapter

    private var selectedVehicle: Vehicle? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_new_claim)

        statementViewModel = ViewModelProvider(this, factory)[StatementViewModel::class.java]
        vehicleViewModel = ViewModelProvider(this, factory)[VehicleViewModel::class.java]

        spinnerVehicles = findViewById(R.id.spinnerVehicles)
        etDescription = findViewById(R.id.etDescription)
        btnSubmit = findViewById(R.id.btnSubmitClaim)
        btnAddDamage = findViewById(R.id.btnAddDamage)
        progressBar = findViewById(R.id.progressBar)
        tvStatus = findViewById(R.id.tvStatusMessage)

        // Setup Damage List
        rvDamages = findViewById(R.id.rvDamages)
        damageAdapter = DamageAdapter()
        rvDamages.layoutManager = LinearLayoutManager(this)
        rvDamages.adapter = damageAdapter

        // Observe Vehicles to populate Spinner
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                vehicleViewModel.vehicles.collectLatest { vehicles ->
                    if (vehicles.isEmpty()) return@collectLatest

                    val adapter = ArrayAdapter(
                        this@NewClaimActivity,
                        android.R.layout.simple_spinner_item,
                        vehicles.map { "${it.year} ${it.model}" }
                    )
                    adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                    spinnerVehicles.adapter = adapter

                    spinnerVehicles.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                        override fun onItemSelected(p0: AdapterView<*>?, p1: View?, pos: Int, p3: Long) {
                            selectedVehicle = vehicles[pos]
                            // Reset statement when vehicle changes
                            statementViewModel.startNewStatement(StatementType.ACCIDENT, selectedVehicle!!)
                        }
                        override fun onNothingSelected(p0: AdapterView<*>?) {}
                    }
                }
            }
        }

        // Observe Current Statement to update Damages
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                statementViewModel.currentStatement.collectLatest { statement ->
                    if (statement != null) {
                        damageAdapter.submitList(statement.damages)
                    }
                }
            }
        }

        // Handle Add Damage (Mock)
        btnAddDamage.setOnClickListener {
            // In real app, open AddDamageDialog
            val dummyDamage = StatementDamage(
                id = UUID.randomUUID().toString(),
                area = "Front Bumper",
                severity = Severity.MODERATE,
                description = "Scratch",
                photos = emptyList()
            )
            statementViewModel.addDamage(dummyDamage)
            Toast.makeText(this, "Damage added (Demo)", Toast.LENGTH_SHORT).show()
        }

        // Handle Submission
        btnSubmit.setOnClickListener {
            val description = etDescription.text.toString()
            if (description.isBlank()) {
                etDescription.error = "Description required"
                return@setOnClickListener
            }

            statementViewModel.updateDescription(description)
            statementViewModel.submitStatement()
        }

        // Observe Submission Status
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                statementViewModel.submissionStatus.collectLatest { state ->
                    when (state) {
                        is SubmissionState.Loading -> {
                            progressBar.visibility = View.VISIBLE
                            btnSubmit.isEnabled = false
                            tvStatus.visibility = View.GONE
                        }
                        is SubmissionState.Success -> {
                            progressBar.visibility = View.GONE
                            btnSubmit.isEnabled = true
                            tvStatus.text = "Success! Conf: ${state.confirmationNumber}"
                            tvStatus.visibility = View.VISIBLE
                            // finish() // Close activity
                        }
                        is SubmissionState.Error -> {
                            progressBar.visibility = View.GONE
                            btnSubmit.isEnabled = true
                            tvStatus.text = "Error: ${state.message}"
                            tvStatus.setTextColor(android.graphics.Color.RED)
                            tvStatus.visibility = View.VISIBLE
                        }
                        is SubmissionState.Idle -> {
                            progressBar.visibility = View.GONE
                            tvStatus.visibility = View.GONE
                        }
                    }
                }
            }
        }
    }
}

class DamageAdapter : RecyclerView.Adapter<DamageAdapter.ViewHolder>() {
    private var list: List<StatementDamage> = emptyList()

    fun submitList(newList: List<StatementDamage>) {
        list = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        // Reuse simple list item or create specific one. Using simple_list_item_2 for demo or custom one
        // Here we assume we add a simple text item to our Layouts.txt for Damages or reuse existing style
        val view = LayoutInflater.from(parent.context).inflate(android.R.layout.simple_list_item_2, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val damage = list[position]
        holder.text1.text = "${damage.area} (${damage.severity.name})"
        holder.text2.text = damage.description ?: "No description"
    }

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val text1: TextView = view.findViewById(android.R.id.text1)
        val text2: TextView = view.findViewById(android.R.id.text2)
    }
}

/*
// Dummy R class for compilation in this generated file context
// UNCOMMENT AND REPLACE WITH REAL RESOURCES AFTER COPYING XML FILES
object R {
    object layout {
        const val activity_dashboard = 1
        const val activity_vehicle_list = 2
        const val item_vehicle = 3
        const val activity_statement_list = 4
        const val item_statement = 5
        const val activity_new_claim = 6
    }
    object id {
        const val tvWelcome = 100
        const val btnManageVehicles = 101
        const val btnMyClaims = 102
        const val btnLogout = 103

        const val rvVehicles = 200
        const val fabAddVehicle = 201
        const val tvVehicleTitle = 202
        const val tvVin = 203
        const val tvLicensePlate = 204

        const val rvStatements = 300
        const val fabNewClaim = 301
        const val tvType = 302
        const val tvStatus = 303
        const val tvStatementVehicle = 304
        const val tvDate = 305

        const val spinnerVehicles = 400
        const val etDescription = 401
        const val btnSubmitClaim = 402
        const val btnAddDamage = 405
        const val progressBar = 403
        const val tvStatusMessage = 404
        const val rvDamages = 406
    }
}
*/

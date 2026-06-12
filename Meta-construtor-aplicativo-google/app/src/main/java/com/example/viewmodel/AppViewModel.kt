package com.example.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.data.AppRepository
import com.example.data.Obra
import com.example.data.RdoReport
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class AppViewModel(private val repository: AppRepository) : ViewModel() {

    // --- Authentication State ---
    val isLoggedIn = MutableStateFlow(false)
    val engineerName = MutableStateFlow("Eng. Matheus Nicolas")
    val engineerEmail = MutableStateFlow("matheusnicolas.org@gmail.com")
    val engineerPhone = MutableStateFlow("+55 (41) 99876-5432")
    val engineerCrea = MutableStateFlow("CREA-PR 198273/D")
    val engineerRole = MutableStateFlow("Engenheiro de Produção Master")
    val engineerCompany = MutableStateFlow("META CONSTRUÇÕES LTDA")

    // --- Navigation State ---
    // Core states: "login", "dashboard", "rdo", "novo_rdo", "obras", "mais"
    val currentScreen = MutableStateFlow("login")
    val previousScreen = MutableStateFlow("login")

    // --- Obras list and search ---
    val allObras: StateFlow<List<Obra>> = repository.allObras
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val obraSearchQuery = MutableStateFlow("")

    val filteredObras: StateFlow<List<Obra>> = combine(allObras, obraSearchQuery) { obras, query ->
        if (query.isBlank()) {
            obras
        } else {
            obras.filter {
                it.title.contains(query, ignoreCase = true) ||
                it.location.contains(query, ignoreCase = true) ||
                it.engineerName.contains(query, ignoreCase = true)
            }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // --- RDO reports list, filters and search ---
    val allReports: StateFlow<List<RdoReport>> = repository.allReports
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val rdoSearchQuery = MutableStateFlow("")
    val rdoSelectedObraId = MutableStateFlow<Long?>(null) // null = Todas
    val rdoSelectedDate = MutableStateFlow("") // empty = Todas

    val filteredReports: StateFlow<List<RdoReport>> = combine(
        allReports, rdoSearchQuery, rdoSelectedObraId, rdoSelectedDate
    ) { reports, query, obraId, date ->
        reports.filter { rdo ->
            // Match Query (id, title, weather, observations)
            val matchesQuery = query.isBlank() ||
                    rdo.id.toString() == query ||
                    rdo.obraTitle.contains(query, ignoreCase = true) ||
                    rdo.weatherCondition.contains(query, ignoreCase = true) ||
                    rdo.observations.contains(query, ignoreCase = true)

            // Match Obra ID
            val matchesObra = obraId == null || rdo.obraId == obraId

            // Match Date
            val matchesDate = date.isBlank() || rdo.reportDate == date

            matchesQuery && matchesObra && matchesDate
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // UI state to track which RDO Card is expanded in the list
    val expandedRdoId = MutableStateFlow<Long?>(null)

    // UI state for shown Share popup modal
    val selectedRdoForShare = MutableStateFlow<RdoReport?>(null)

    // --- Novo RDO / Draft Report Form Fields ---
    val draftId = MutableStateFlow<Long?>(null) // If editing an existing RDO
    val draftObraId = MutableStateFlow<Long>(0L)
    val draftObraTitle = MutableStateFlow("")
    val draftDate = MutableStateFlow("11/06/2026")
    val draftPeriod = MutableStateFlow("Integral")
    val draftWeather = MutableStateFlow("Ensolarado")
    val draftIsTeamIdle = MutableStateFlow(false)
    val draftObservations = MutableStateFlow("")
    
    // Lists inside the draft form
    val draftCrews = MutableStateFlow<List<String>>(emptyList())
    val draftEquipments = MutableStateFlow<List<String>>(emptyList())
    val draftExtraActivities = MutableStateFlow<List<String>>(emptyList())
    val draftIssues = MutableStateFlow<List<String>>(emptyList())
    val draftAttachmentsCount = MutableStateFlow(0)

    // Temp lists add inputs
    val tempCrewName = MutableStateFlow("")
    val tempCrewHours = MutableStateFlow("8h")
    val tempEquipmentName = MutableStateFlow("")
    val tempExtraActivityName = MutableStateFlow("")
    val tempIssueName = MutableStateFlow("")

    fun setupNewRdoDraft(preSelectedObra: Obra? = null) {
        draftId.value = null
        if (preSelectedObra != null) {
            draftObraId.value = preSelectedObra.id
            draftObraTitle.value = preSelectedObra.title
        } else {
            val list = allObras.value
            if (list.isNotEmpty()) {
                draftObraId.value = list[0].id
                draftObraTitle.value = list[0].title
            } else {
                draftObraId.value = 0L
                draftObraTitle.value = ""
            }
        }
        draftDate.value = "11/06/2026"
        draftPeriod.value = "Integral"
        draftWeather.value = "Ensolarado"
        draftIsTeamIdle.value = false
        draftObservations.value = ""
        draftCrews.value = emptyList()
        draftEquipments.value = emptyList()
        draftExtraActivities.value = emptyList()
        draftIssues.value = emptyList()
        draftAttachmentsCount.value = 0
    }

    fun loadRdoToDraft(report: RdoReport) {
        draftId.value = report.id
        draftObraId.value = report.obraId
        draftObraTitle.value = report.obraTitle
        draftDate.value = report.reportDate
        draftPeriod.value = report.periodType
        draftWeather.value = report.weatherCondition
        draftIsTeamIdle.value = report.isTeamIdle
        draftObservations.value = report.observations

        // Unpack comma separated lists
        draftCrews.value = if (report.crewsJson.isBlank()) emptyList() else report.crewsJson.split(", ")
        draftEquipments.value = if (report.equipmentsJson.isBlank()) emptyList() else report.equipmentsJson.split(", ")
        draftExtraActivities.value = if (report.extraActivitiesJson.isBlank()) emptyList() else report.extraActivitiesJson.split(", ")
        draftIssues.value = if (report.issuesJson.isBlank()) emptyList() else report.issuesJson.split(", ")
        draftAttachmentsCount.value = report.attachmentsCount
    }

    // List item modifiers
    fun addCrewMember() {
        if (tempCrewName.value.isNotBlank()) {
            val text = "${tempCrewName.value} (${tempCrewHours.value})"
            draftCrews.value = draftCrews.value + text
            tempCrewName.value = ""
        }
    }
    fun removeCrewMember(item: String) {
        draftCrews.value = draftCrews.value - item
    }

    fun addEquipment() {
        if (tempEquipmentName.value.isNotBlank()) {
            draftEquipments.value = draftEquipments.value + tempEquipmentName.value
            tempEquipmentName.value = ""
        }
    }
    fun removeEquipment(item: String) {
        draftEquipments.value = draftEquipments.value - item
    }

    fun addExtraActivity() {
        if (tempExtraActivityName.value.isNotBlank()) {
            draftExtraActivities.value = draftExtraActivities.value + tempExtraActivityName.value
            tempExtraActivityName.value = ""
        }
    }
    fun removeExtraActivity(item: String) {
        draftExtraActivities.value = draftExtraActivities.value - item
    }

    fun addIssue() {
        if (tempIssueName.value.isNotBlank()) {
            draftIssues.value = draftIssues.value + tempIssueName.value
            tempIssueName.value = ""
        }
    }
    fun removeIssue(item: String) {
        draftIssues.value = draftIssues.value - item
    }

    // Save report to Room database
    fun saveDraftRdo(status: String) {
        viewModelScope.launch {
            val report = RdoReport(
                id = draftId.value ?: 0L,
                obraId = draftObraId.value,
                obraTitle = draftObraTitle.value,
                reportDate = draftDate.value,
                periodType = draftPeriod.value,
                weatherCondition = draftWeather.value,
                isTeamIdle = draftIsTeamIdle.value,
                status = status,
                crewsJson = draftCrews.value.joinToString(", "),
                activitiesJson = if (draftExtraActivities.value.isNotEmpty()) "Ver Atividades Extras" else "Alvenaria e fôrmas",
                extraActivitiesJson = draftExtraActivities.value.joinToString(", "),
                equipmentsJson = draftEquipments.value.joinToString(", "),
                observations = draftObservations.value,
                issuesJson = draftIssues.value.joinToString(", "),
                attachmentsCount = draftAttachmentsCount.value,
                timestamp = System.currentTimeMillis()
            )

            if (draftId.value == null) {
                repository.insertReport(report)
            } else {
                repository.updateReport(report)
            }
            navigateTo(previousScreen.value)
        }
    }

    // Delete RDO
    fun deleteRdo(report: RdoReport) {
        viewModelScope.launch {
            repository.deleteReport(report)
        }
    }

    // --- Nova Obra Draft fields ---
    val showAddObraDialog = MutableStateFlow(false)
    val newObraTitle = MutableStateFlow("")
    val newObraLocation = MutableStateFlow("")
    val newObraEngineer = MutableStateFlow("Eng. Matheus Nicolas")
    val newObraStartDate = MutableStateFlow("11/06/2026")
    val newObraEndDate = MutableStateFlow("31/12/2026")

    fun saveNewObra() {
        viewModelScope.launch {
            if (newObraTitle.value.isNotBlank()) {
                val obra = Obra(
                    title = newObraTitle.value,
                    location = newObraLocation.value.ifBlank { "Local não informado" },
                    engineerName = newObraEngineer.value,
                    progress = 0,
                    startDate = newObraStartDate.value,
                    endDate = newObraEndDate.value,
                    isActive = true
                )
                repository.insertObra(obra)
                showAddObraDialog.value = false
                // Reset fields
                newObraTitle.value = ""
                newObraLocation.value = ""
                newObraStartDate.value = "11/06/2026"
                newObraEndDate.value = "31/12/2026"
            }
        }
    }

    // Navigate helper
    fun navigateTo(screen: String) {
        if (currentScreen.value != screen) {
            previousScreen.value = currentScreen.value
            currentScreen.value = screen
        }
    }

    fun handleLogin() {
        isLoggedIn.value = true
        navigateTo("dashboard")
    }

    fun handleLogout() {
        isLoggedIn.value = false
        navigateTo("login")
    }
}

// Factory to inject repository
class AppViewModelFactory(private val repository: AppRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AppViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return AppViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

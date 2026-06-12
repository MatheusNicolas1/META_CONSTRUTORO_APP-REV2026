package com.example.ui

import androidx.compose.animation.*
import androidx.compose.animation.core.spring
import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.zIndex
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.input.key.*
import com.example.data.Obra
import com.example.data.RdoReport
import com.example.viewmodel.AppViewModel

@Composable
fun AppNavigationContainer(viewModel: AppViewModel, isDarkTheme: Boolean, onToggleTheme: () -> Unit) {
    val currentScreen by viewModel.currentScreen.collectAsState()
    val isLoggedIn by viewModel.isLoggedIn.collectAsState()

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        // Simple screen navigation with beautiful slide/fade transitions
        AnimatedContent(
            targetState = currentScreen,
            transitionSpec = {
                fadeIn(animationSpec = spring()) + slideInHorizontally(
                    initialOffsetX = { 300 },
                    animationSpec = spring()
                ) togetherWith fadeOut(animationSpec = spring()) + slideOutHorizontally(
                    targetOffsetX = { -300 },
                    animationSpec = spring()
                )
            },
            label = "screen_transition"
        ) { targetScreen ->
            when (targetScreen) {
                "login" -> LoginScreen(viewModel = viewModel)
                "novo_rdo" -> NovoRdoScreen(viewModel = viewModel)
                else -> MainLayoutContainer(
                    viewModel = viewModel,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = onToggleTheme
                ) {
                    when (targetScreen) {
                        "dashboard" -> DashboardTabContent(viewModel = viewModel, onToggleTheme = onToggleTheme)
                        "rdo" -> RdoListTabContent(viewModel = viewModel)
                        "obras" -> ObrasListTabContent(viewModel = viewModel)
                        "mais" -> MaisOptionsTabContent(viewModel = viewModel)
                        "perfil" -> PerfilTabContent(viewModel = viewModel, onToggleTheme = onToggleTheme)
                    }
                }
            }
        }
    }
}

// --- MAIN WRAP SCREEN ---
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainLayoutContainer(
    viewModel: AppViewModel,
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit,
    content: @Composable () -> Unit
) {
    val currentScreen by viewModel.currentScreen.collectAsState()
    val engineerName by viewModel.engineerName.collectAsState()

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val isWideScreen = maxWidth >= 768.dp

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            // Clean Minimalism 'M' signature logo block matching HTML
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(
                                        color = if (isDarkTheme) Color.White else com.example.ui.theme.NavyEscuro,
                                        shape = RoundedCornerShape(10.dp)
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "M",
                                    color = if (isDarkTheme) com.example.ui.theme.NavyEscuro else Color.White,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 18.sp,
                                    letterSpacing = (-1.5).sp,
                                    modifier = Modifier.offset(y = (-1).dp)
                                )
                            }
                            Column(verticalArrangement = Arrangement.Center) {
                                Text(
                                    text = "META",
                                    style = MaterialTheme.typography.titleSmall.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = if (isDarkTheme) Color.White else com.example.ui.theme.NavyEscuro,
                                        fontSize = 13.sp,
                                        letterSpacing = 0.5.sp
                                    )
                                )
                                Text(
                                    text = "CONSTRUTOR",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary,
                                        fontSize = 9.sp,
                                        letterSpacing = 1.5.sp
                                    )
                                )
                            }
                        }
                    },
                    actions = {
                        IconButton(onClick = onToggleTheme) {
                            Icon(
                                imageVector = if (isDarkTheme) Icons.Default.LightMode else Icons.Default.DarkMode,
                                contentDescription = "Changer tema",
                                tint = if (isDarkTheme) Color.White else com.example.ui.theme.NavyEscuro
                            )
                        }
                        IconButton(onClick = { viewModel.handleLogout() }) {
                            Icon(
                                imageVector = Icons.Default.Logout,
                                contentDescription = "Log out",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                )
            },
            bottomBar = {
                if (!isWideScreen) {
                    BottomNavigationBarContainer(viewModel = viewModel, isDarkTheme = isDarkTheme)
                }
            },
            contentWindowInsets = WindowInsets.safeDrawing
        ) { innerPadding ->
            if (isWideScreen) {
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                ) {
                    NavigationRailContainer(
                        viewModel = viewModel,
                        isDarkTheme = isDarkTheme
                    )
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                    ) {
                        content()
                    }
                }
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                ) {
                    content()
                }
            }
        }
    }
}

@Composable
fun BottomNavigationBarContainer(viewModel: AppViewModel, isDarkTheme: Boolean) {
    val currentScreen by viewModel.currentScreen.collectAsState()

    // Using M3 standard NavigationBar and custom elevated floating center action button
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .windowInsetsPadding(WindowInsets.navigationBars)
    ) {
        NavigationBar(
            containerColor = MaterialTheme.colorScheme.surface,
            tonalElevation = 8.dp,
            modifier = Modifier.height(80.dp)
        ) {
            // Dashboard
            NavigationBarItem(
                selected = currentScreen == "dashboard",
                onClick = { viewModel.navigateTo("dashboard") },
                icon = { Icon(Icons.Outlined.Dashboard, contentDescription = "Dashboard") },
                label = { Text("Dashboard", style = TextStyleSmall()) },
                colors = navigationItemColorsTheme(isDarkTheme)
            )

            // RDO List
            NavigationBarItem(
                selected = currentScreen == "rdo",
                onClick = { viewModel.navigateTo("rdo") },
                icon = { Icon(Icons.Outlined.Description, contentDescription = "RDOs") },
                label = { Text("RDO", style = TextStyleSmall()) },
                colors = navigationItemColorsTheme(isDarkTheme)
            )

            // Placeholder to offset middle FAB
            NavigationBarItem(
                selected = false,
                onClick = {
                    viewModel.setupNewRdoDraft()
                    viewModel.navigateTo("novo_rdo")
                },
                icon = {
                    Spacer(modifier = Modifier.size(24.dp))
                },
                label = {
                    Text("Novo RDO", style = TextStyleSmall().copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary))
                },
                enabled = true
            )

            // Obras List
            NavigationBarItem(
                selected = currentScreen == "obras",
                onClick = { viewModel.navigateTo("obras") },
                icon = { Icon(Icons.Outlined.Business, contentDescription = "Obras") },
                label = { Text("Obras", style = TextStyleSmall()) },
                colors = navigationItemColorsTheme(isDarkTheme)
            )

            // Mais grid
            NavigationBarItem(
                selected = currentScreen == "mais",
                onClick = { viewModel.navigateTo("mais") },
                icon = { Icon(Icons.Outlined.GridOn, contentDescription = "Mais") },
                label = { Text("Mais", style = TextStyleSmall()) },
                colors = navigationItemColorsTheme(isDarkTheme)
            )
        }

        // Circular Floating Button over the "Novo RDO" middle item
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .offset(y = (-20).dp)
        ) {
            FloatingActionButton(
                onClick = {
                    viewModel.setupNewRdoDraft()
                    viewModel.navigateTo("novo_rdo")
                },
                shape = CircleShape,
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White,
                elevation = FloatingActionButtonDefaults.elevation(12.dp),
                modifier = Modifier
                    .size(56.dp)
                    .testTag("floating_novo_rdo_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Adicionar",
                    modifier = Modifier.size(28.dp)
                )
            }
        }
    }
}

@Composable
fun NavigationRailContainer(viewModel: AppViewModel, isDarkTheme: Boolean) {
    val currentScreen by viewModel.currentScreen.collectAsState()

    NavigationRail(
        containerColor = MaterialTheme.colorScheme.surface,
        modifier = Modifier
            .width(80.dp)
            .fillMaxHeight()
    ) {
        Spacer(modifier = Modifier.height(24.dp))

        // Dashboard
        NavigationRailItem(
            selected = currentScreen == "dashboard",
            onClick = { viewModel.navigateTo("dashboard") },
            icon = { Icon(Icons.Outlined.Dashboard, contentDescription = "Dashboard") },
            label = { Text("Dashboard", style = TextStyleSmall()) },
            colors = NavigationRailItemDefaults.colors(
                selectedIconColor = MaterialTheme.colorScheme.primary,
                selectedTextColor = MaterialTheme.colorScheme.primary,
                indicatorColor = if (isDarkTheme) Color(0xFF323438) else Color(0xFFFFECE2),
                unselectedIconColor = if (isDarkTheme) Color(0xFF9EA1A7) else Color(0xFF676A71),
                unselectedTextColor = if (isDarkTheme) Color(0xFF9EA1A7) else Color(0xFF676A71)
            )
        )

        Spacer(modifier = Modifier.height(16.dp))

        // RDO List
        NavigationRailItem(
            selected = currentScreen == "rdo",
            onClick = { viewModel.navigateTo("rdo") },
            icon = { Icon(Icons.Outlined.Description, contentDescription = "RDOs") },
            label = { Text("RDO", style = TextStyleSmall()) },
            colors = NavigationRailItemDefaults.colors(
                selectedIconColor = MaterialTheme.colorScheme.primary,
                selectedTextColor = MaterialTheme.colorScheme.primary,
                indicatorColor = if (isDarkTheme) Color(0xFF323438) else Color(0xFFFFECE2),
                unselectedIconColor = if (isDarkTheme) Color(0xFF9EA1A7) else Color(0xFF676A71),
                unselectedTextColor = if (isDarkTheme) Color(0xFF9EA1A7) else Color(0xFF676A71)
            )
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Create RDO shortcut
        NavigationRailItem(
            selected = false,
            onClick = {
                viewModel.setupNewRdoDraft()
                viewModel.navigateTo("novo_rdo")
            },
            icon = {
                FloatingActionButton(
                    onClick = {
                        viewModel.setupNewRdoDraft()
                        viewModel.navigateTo("novo_rdo")
                    },
                    shape = CircleShape,
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = Color.White,
                    elevation = FloatingActionButtonDefaults.elevation(6.dp),
                    modifier = Modifier.size(48.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Adicionar",
                        modifier = Modifier.size(24.dp)
                    )
                }
            },
            label = {
                Text("Novo", style = TextStyleSmall().copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary))
            }
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Obras List
        NavigationRailItem(
            selected = currentScreen == "obras",
            onClick = { viewModel.navigateTo("obras") },
            icon = { Icon(Icons.Outlined.Business, contentDescription = "Obras") },
            label = { Text("Obras", style = TextStyleSmall()) },
            colors = NavigationRailItemDefaults.colors(
                selectedIconColor = MaterialTheme.colorScheme.primary,
                selectedTextColor = MaterialTheme.colorScheme.primary,
                indicatorColor = if (isDarkTheme) Color(0xFF323438) else Color(0xFFFFECE2),
                unselectedIconColor = if (isDarkTheme) Color(0xFF9EA1A7) else Color(0xFF676A71),
                unselectedTextColor = if (isDarkTheme) Color(0xFF9EA1A7) else Color(0xFF676A71)
            )
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Mais grid
        NavigationRailItem(
            selected = currentScreen == "mais",
            onClick = { viewModel.navigateTo("mais") },
            icon = { Icon(Icons.Outlined.GridOn, contentDescription = "Mais") },
            label = { Text("Mais", style = TextStyleSmall()) },
            colors = NavigationRailItemDefaults.colors(
                selectedIconColor = MaterialTheme.colorScheme.primary,
                selectedTextColor = MaterialTheme.colorScheme.primary,
                indicatorColor = if (isDarkTheme) Color(0xFF323438) else Color(0xFFFFECE2),
                unselectedIconColor = if (isDarkTheme) Color(0xFF9EA1A7) else Color(0xFF676A71),
                unselectedTextColor = if (isDarkTheme) Color(0xFF9EA1A7) else Color(0xFF676A71)
            )
        )
    }
}

@Composable
fun navigationItemColorsTheme(isDarkTheme: Boolean) = NavigationBarItemDefaults.colors(
    selectedIconColor = MaterialTheme.colorScheme.primary,
    selectedTextColor = MaterialTheme.colorScheme.primary,
    indicatorColor = if (isDarkTheme) Color(0xFF323438) else Color(0xFFFFECE2),
    unselectedIconColor = if (isDarkTheme) Color(0xFF9EA1A7) else Color(0xFF676A71),
    unselectedTextColor = if (isDarkTheme) Color(0xFF9EA1A7) else Color(0xFF676A71)
)

private fun TextStyleSmall() = androidx.compose.ui.text.TextStyle(
    fontSize = 11.sp,
    fontWeight = FontWeight.Medium
)


// ==========================================
// 1. LOGIN SCREEN
// ==========================================
@Composable
fun LoginScreen(viewModel: AppViewModel) {
    var email by remember { mutableStateOf("matheus.nicolas@metw.com.br") }
    var password by remember { mutableStateOf("123456") }
    var passwordVisible by remember { mutableStateOf(false) }
    var rememberMe by remember { mutableStateOf(true) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 450.dp)
                .fillMaxWidth()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
        Spacer(modifier = Modifier.height(48.dp))

        // Large Logo Icon and Brand
        Box(
            modifier = Modifier
                .size(90.dp)
                .background(
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(24.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Construction,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(48.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "META CONSTRUTOR",
            style = MaterialTheme.typography.headlineMedium.copy(
                fontWeight = FontWeight.Black,
                color = MaterialTheme.colorScheme.secondary,
                letterSpacing = 1.sp
            )
        )

        Text(
            text = "Bora organizar sua obra?",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            ),
            modifier = Modifier.padding(top = 4.dp, bottom = 48.dp)
        )

        // Fields
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("E-mail ou Celular") },
            leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
                .testTag("username_input")
        )

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Senha") },
            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
            trailingIcon = {
                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                    Icon(
                        imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                        contentDescription = "Mostrar Senha"
                    )
                }
            },
            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp)
                .testTag("password_input")
        )

        // Remember me and Forgot password row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(
                    checked = rememberMe,
                    onCheckedChange = { rememberMe = it },
                    colors = CheckboxDefaults.colors(checkedColor = MaterialTheme.colorScheme.primary)
                )
                Text("Manter-me conectado", style = MaterialTheme.typography.bodyMedium)
            }
            Text(
                "Esqueceu a senha?",
                color = MaterialTheme.colorScheme.primary,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.clickable { }
            )
        }

        // Enter Button
        Button(
            onClick = {
                if (email.isNotBlank()) {
                    viewModel.engineerName.value = if (email.contains("matheus", true)) "Eng. Matheus Nicolas" else "Eng. Construtor"
                }
                viewModel.handleLogin()
            },
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .testTag("login_button")
        ) {
            Text(
                "Entrar",
                style = MaterialTheme.typography.bodyLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Google Button
        OutlinedButton(
            onClick = { viewModel.handleLogin() },
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.AccountCircle,
                    contentDescription = "Google",
                    tint = MaterialTheme.colorScheme.secondary
                )
                Text(
                    "Continuar com Google",
                    color = MaterialTheme.colorScheme.onSurface,
                    style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium)
                )
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center
        ) {
            Text("Novo na plataforma? ", style = MaterialTheme.typography.bodyMedium)
            Text(
                "Criar conta",
                color = MaterialTheme.colorScheme.primary,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.clickable { }
            )
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}
}


// ==========================================
// 2. DASHBOARD CONTENT SCREEN
// ==========================================
@Composable
fun DashboardTabContent(viewModel: AppViewModel, onToggleTheme: () -> Unit) {
    val engineerName by viewModel.engineerName.collectAsState()
    val obras by viewModel.allObras.collectAsState()
    val reports by viewModel.allReports.collectAsState()
    var selectedCalendarDay by remember { mutableStateOf(11) }

    val activeObrasCount = obras.filter { it.isActive }.size
    val activeCrewsText = "${reports.firstOrNull()?.crewsJson?.split(",")?.size ?: 1} Equipes trabalhando"

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.TopCenter
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 840.dp)
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(24.dp)
        ) {
        // Welcome Message in Clean Minimalism
        Text(
            text = "Olá, $engineerName",
            style = MaterialTheme.typography.headlineMedium.copy(
                fontWeight = FontWeight.SemiBold,
                color = if (isSystemInDarkTheme()) Color.White else com.example.ui.theme.NavyEscuro,
                letterSpacing = (-0.5).sp
            )
        )
        Text(
            text = "Você tem 3 relatórios pendentes hoje.",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = if (isSystemInDarkTheme()) Color(0xFF94A3B8) else Color(0xFF64748B) // slate-400 / 500
            ),
            modifier = Modifier.padding(bottom = 20.dp)
        )

        // Global Action Search Bar
        ActionSearchBar(
            viewModel = viewModel,
            onToggleTheme = onToggleTheme
        )

        // Custom Ações Rápidas (Horizontal Scroll) matching Image 15
        Text(
            text = "Ações rápidas",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            modifier = Modifier.padding(bottom = 12.dp)
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(bottom = 24.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            QuickActionItem(
                title = "Novo RDO",
                icon = Icons.Default.Add,
                backgroundColor = Color(0xFFFFECE2),
                iconColor = Color(0xFFE15A1D)
            ) {
                viewModel.setupNewRdoDraft()
                viewModel.navigateTo("novo_rdo")
            }
            QuickActionItem(
                title = "Nova Obra",
                icon = Icons.Default.Business,
                backgroundColor = Color(0xFFE3F2FD),
                iconColor = Color(0xFF1976D2)
            ) {
                viewModel.showAddObraDialog.value = true
                viewModel.navigateTo("obras")
            }
            QuickActionItem(
                title = "Checklist SE",
                icon = Icons.Default.Checklist,
                backgroundColor = Color(0xFFE8F5E9),
                iconColor = Color(0xFF2E7D32)
            ) {
                viewModel.navigateTo("mais")
            }
            QuickActionItem(
                title = "Relatórios",
                icon = Icons.Default.BarChart,
                backgroundColor = Color(0xFFF3E5F5),
                iconColor = Color(0xFF8E24AA)
            ) {
                viewModel.navigateTo("mais")
            }
        }

        // Stats Cards Grid matching Clean Minimalism HTML exactly
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            DashboardStatsCard(
                title = "Obras Ativas",
                value = "$activeObrasCount",
                icon = Icons.Default.Engineering,
                color = com.example.ui.theme.LaranjaLogo,
                isHighlighted = false,
                modifier = Modifier.weight(1f)
            )
            DashboardStatsCard(
                title = "Meta Mensal",
                value = "85%",
                icon = Icons.Default.TaskAlt,
                color = Color.White,
                isHighlighted = true,
                modifier = Modifier.weight(1f)
            )
        }

        // Calendário de Atividades (Image 12)
        Text(
            text = "Calendário de Atividades",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            modifier = Modifier.padding(bottom = 12.dp)
        )
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Junho 2026",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                    )
                    Text(
                        "Nova Atividade",
                        color = MaterialTheme.colorScheme.primary,
                        style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier.clickable { }
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Modern 7-days Row scroll or wrap simulation starting Monday June 8th
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    val days = listOf(8 to "Seg", 9 to "Ter", 10 to "Qua", 11 to "Qui", 12 to "Sex", 13 to "Sáb", 14 to "Dom")
                    for ((day, dayName) in days) {
                        val isSelected = selectedCalendarDay == day
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .clickable { selectedCalendarDay = day }
                                .padding(4.dp)
                                .background(
                                    color = if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent,
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .padding(vertical = 8.dp, horizontal = 12.dp)
                        ) {
                            Text(
                                text = dayName,
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                    fontWeight = FontWeight.Normal
                                )
                            )
                            Text(
                                text = "$day",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                        }
                    }
                }

                Divider(modifier = Modifier.padding(vertical = 12.dp), color = MaterialTheme.colorScheme.outline)

                // Calendar activities content
                if (selectedCalendarDay == 11) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(color = MaterialTheme.colorScheme.primary, shape = CircleShape)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "08:00 - Concretagem na Creche FNDE",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(color = Color(0xFF1976D2), shape = CircleShape)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "14:00 - Pintura interna na Caprosa",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
                        )
                    }
                } else {
                    Text(
                        "Nenhuma atividade registrada para este dia. Toque em 'Nova Atividade' para incluir.",
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                        style = MaterialTheme.typography.bodySmall,
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 12.dp)
                    )
                }
            }
        }

        // Recent Documents (Recentes RDOs - Image 13)
        Text(
            text = "Relatórios Recentes",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            modifier = Modifier.padding(bottom = 12.dp)
        )
        Column(
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            reports.take(3).forEach { rdo ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            viewModel.expandedRdoId.value = rdo.id
                            viewModel.navigateTo("rdo")
                        },
                    shape = RoundedCornerShape(24.dp), // 24.dp corner radius (rounded-3xl)
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .background(
                                        color = if (rdo.status == "Aprovado") Color(0xFFDCFCE7) else Color(0xFFFFEDD5),
                                        shape = RoundedCornerShape(12.dp)
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Description,
                                    contentDescription = null,
                                    tint = if (rdo.status == "Aprovado") Color(0xFF15803D) else Color(0xFFC2410C)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "RDO #${rdo.id} - ${rdo.obraTitle}",
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "Data: ${rdo.reportDate} | Clima: ${rdo.weatherCondition}",
                                    style = MaterialTheme.typography.bodySmall.copy(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                )
                            }
                        }

                        // Fully rounded pills Status Badge
                        Box(
                            modifier = Modifier
                                .background(
                                    color = if (rdo.status == "Aprovado") Color(0xFFDCFCE7) else Color(0xFFFFEDD5),
                                    shape = RoundedCornerShape(100)
                                )
                                .padding(horizontal = 12.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = rdo.status.uppercase(),
                                fontSize = 10.sp,
                                color = if (rdo.status == "Aprovado") Color(0xFF15803D) else Color(0xFFC2410C),
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.5.sp
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(48.dp))
    }
}
}

@Composable
fun QuickActionItem(
    title: String,
    icon: ImageVector,
    backgroundColor: Color,
    iconColor: Color,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clickable(onClick = onClick)
            .width(80.dp)
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .background(color = backgroundColor, shape = CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = iconColor,
                modifier = Modifier.size(24.dp)
            )
        }
        Text(
            text = title,
            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 8.dp),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
fun DashboardStatsCard(
    title: String,
    value: String,
    icon: ImageVector,
    color: Color,
    isHighlighted: Boolean = false,
    modifier: Modifier = Modifier
) {
    val containerBgColor = if (isHighlighted) com.example.ui.theme.NavyEscuro else MaterialTheme.colorScheme.surface
    val contentColor = if (isHighlighted) Color.White else MaterialTheme.colorScheme.onSurface
    val subtitleColor = if (isHighlighted) Color(0xFF94A3B8) else Color(0xFF64748B) // slate-400 / slate-500
    val badgeBgColor = if (isHighlighted) Color.White.copy(alpha = 0.15f) else color.copy(alpha = 0.12f)
    val iconColor = if (isHighlighted) Color.White else color

    Card(
        modifier = modifier.height(140.dp),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = containerBgColor),
        border = if (isHighlighted) null else BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(color = badgeBgColor, shape = CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconColor,
                    modifier = Modifier.size(20.dp)
                )
            }
            Column {
                Text(
                    text = value,
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = contentColor,
                        fontSize = 24.sp
                    )
                )
                Text(
                    text = title.uppercase(),
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = subtitleColor,
                        fontSize = 11.sp,
                        letterSpacing = 1.sp
                    )
                )
            }
        }
    }
}


// ==========================================
// 3. RDO LIST SCREEN (WITH FILTERS AND EXPANDABLE STATES)
// ==========================================
@Composable
fun RdoListTabContent(viewModel: AppViewModel) {
    val reports by viewModel.filteredReports.collectAsState()
    val allObras by viewModel.allObras.collectAsState()
    val expandedRdoId by viewModel.expandedRdoId.collectAsState()
    val rdoSearchQuery by viewModel.rdoSearchQuery.collectAsState()
    val rdoSelectedObraId by viewModel.rdoSelectedObraId.collectAsState()

    var showPdfSuccess by remember { mutableStateOf(false) }
    val selectedRdoForShare by viewModel.selectedRdoForShare.collectAsState()

    // Dialog simulations
    if (showPdfSuccess) {
        Dialog(onDismissRequest = { showPdfSuccess = false }) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.padding(24.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.PictureAsPdf,
                        contentDescription = null,
                        tint = Color.Red,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        "PDF Gerado com Sucesso!",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "O relatório de obra consolidado foi gerado no formato PDF corporativo oficial.",
                        style = MaterialTheme.typography.bodySmall,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Button(
                        onClick = { showPdfSuccess = false },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text("Fechar")
                    }
                }
            }
        }
    }

    if (selectedRdoForShare != null) {
        ShareDialog(
            rdo = selectedRdoForShare!!,
            onDismiss = { viewModel.selectedRdoForShare.value = null }
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.TopCenter
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 840.dp)
                .fillMaxWidth()
        ) {
        // Upper section with page title & Export PDF button row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Relatórios Diários de Obra",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "Total de RDOs: ${reports.size}",
                    style = MaterialTheme.typography.bodySmall.copy(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                )
            }

            OutlinedButton(
                onClick = { showPdfSuccess = true },
                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.primary),
                shape = RoundedCornerShape(8.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(Icons.Default.PictureAsPdf, contentDescription = "PDF", modifier = Modifier.size(16.dp))
                    Text("Exportar PDF", fontSize = 12.sp)
                }
            }
        }

        // Filtros Accordion Section
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = rdoSearchQuery,
                onValueChange = { viewModel.rdoSearchQuery.value = it },
                placeholder = { Text("Filtros / Buscar RDO...") },
                leadingIcon = { Icon(Icons.Default.Tune, contentDescription = "Filtro", modifier = Modifier.size(18.dp)) },
                trailingIcon = {
                    if (rdoSearchQuery.isNotBlank() || rdoSelectedObraId != null) {
                        IconButton(onClick = {
                            viewModel.rdoSearchQuery.value = ""
                            viewModel.rdoSelectedObraId.value = null
                        }) {
                            Icon(Icons.Default.Clear, contentDescription = "Limpar Filtros")
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(8.dp),
                colors = TextFieldDefaults.colors(
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                    focusedContainerColor = MaterialTheme.colorScheme.surface
                ),
                modifier = Modifier.weight(1.5f)
            )

            // Obra selector Filter Dropdown
            var dropdownExpanded by remember { mutableStateOf(false) }
            Box(modifier = Modifier.weight(1.1f)) {
                OutlinedButton(
                    onClick = { dropdownExpanded = true },
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = if (rdoSelectedObraId == null) "Todas Obras" else {
                            allObras.find { it.id == rdoSelectedObraId }?.title?.take(10) ?: "Filtrar"
                        },
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        fontSize = 11.sp
                    )
                    Icon(Icons.Default.ArrowDropDown, contentDescription = null, modifier = Modifier.size(14.dp))
                }
                DropdownMenu(
                    expanded = dropdownExpanded,
                    onDismissRequest = { dropdownExpanded = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("Todas as Obras") },
                        onClick = {
                            viewModel.rdoSelectedObraId.value = null
                            dropdownExpanded = false
                        }
                    )
                    allObras.forEach { obra ->
                        DropdownMenuItem(
                            text = { Text(obra.title) },
                            onClick = {
                                viewModel.rdoSelectedObraId.value = obra.id
                                dropdownExpanded = false
                            }
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Main reports list
        if (reports.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.Description,
                        contentDescription = "Empty",
                        tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.3f),
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        "Nenhum relatório diário ativo no filtro.",
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Adicione um novo RDO utilizando o botão laranja posicionado no centro do menu de navegação.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(reports, key = { it.id }) { rdo ->
                    val isExpanded = expandedRdoId == rdo.id
                    RdoReportCardItem(
                        rdo = rdo,
                        isExpanded = isExpanded,
                        onToggleExpand = {
                            viewModel.expandedRdoId.value = if (isExpanded) null else rdo.id
                        },
                        onShare = {
                            viewModel.selectedRdoForShare.value = rdo
                        },
                        onEdit = {
                            viewModel.loadRdoToDraft(rdo)
                            viewModel.navigateTo("novo_rdo")
                        },
                        onDelete = {
                            viewModel.deleteRdo(rdo)
                        }
                    )
                }
            }
        }
    }
}
}

@Composable
fun RdoReportCardItem(
    rdo: RdoReport,
    isExpanded: Boolean,
    onToggleExpand: () -> Unit,
    onShare: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("rdo_item_${rdo.id}"),
        shape = RoundedCornerShape(24.dp), // 24.dp (rounded-3xl) in Clean Minimalism
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column {
                    Text(
                        text = "RDO #${rdo.id}",
                        style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Black)
                    )
                    Text(
                        text = rdo.obraTitle,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                // Status Badge fully rounded matching HTML theme
                Box(
                    modifier = Modifier
                        .background(
                            color = if (rdo.status == "Aprovado") Color(0xFFDCFCE7) else Color(0xFFFFEDD5), // green-100 / orange-100
                            shape = RoundedCornerShape(100)
                        )
                        .padding(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = rdo.status.uppercase(),
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = if (rdo.status == "Aprovado") Color(0xFF15803D) else Color(0xFFC2410C), // green-700 / orange-700
                            fontSize = 10.sp,
                            letterSpacing = 0.5.sp
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Sub info metrics row matching Image 9 and 10 card grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                MetricSnippet(icon = Icons.Outlined.BarChart, label = "0 Atividades")
                MetricSnippet(
                    icon = Icons.Outlined.Group,
                    label = if (rdo.crewsJson.isBlank()) "0 Equipes" else {
                        "${rdo.crewsJson.split(",").size} Equipe(s)"
                    }
                )
                MetricSnippet(
                    icon = Icons.Outlined.Handyman,
                    label = if (rdo.equipmentsJson.isBlank()) "0 Equip." else {
                        "${rdo.equipmentsJson.split(",").size} Equip."
                    }
                )
                MetricSnippet(
                    icon = if (rdo.weatherCondition == "Chuvoso") Icons.Outlined.WbCloudy else Icons.Outlined.LightMode,
                    label = rdo.weatherCondition
                )
            }

            // Expanded detail section with smooth Transition
            AnimatedVisibility(
                visible = isExpanded,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Column(modifier = Modifier.padding(top = 16.dp)) {
                    Divider(color = MaterialTheme.colorScheme.outline, modifier = Modifier.padding(bottom = 12.dp))

                    Text("Período de Trabalho:", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.secondary)
                    Text(rdo.periodType, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(bottom = 8.dp))

                    Text("Colaboradores Presentes:", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.secondary)
                    Text(rdo.crewsJson.ifBlank { "Nenhum registrado" }, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(bottom = 8.dp))

                    if (rdo.extraActivitiesJson.isNotBlank()) {
                        Text("Atividades Extras realizadas:", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.secondary)
                        Text(rdo.extraActivitiesJson, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(bottom = 8.dp))
                    }

                    if (rdo.observations.isNotBlank()) {
                        Text("Observações Gerais:", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.secondary)
                        Text(rdo.observations, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(bottom = 12.dp))
                    }

                    // Bottom Action Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = onShare) {
                            Icon(Icons.Default.Share, contentDescription = "Compartilhar", tint = MaterialTheme.colorScheme.primary)
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = onEdit,
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.secondary)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(14.dp))
                                    Text("Editar", fontSize = 11.sp)
                                }
                            }

                            Button(
                                onClick = onDelete,
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(14.dp), PINKSYNCCOLOR())
                                    Text("Excluir", fontSize = 11.sp, color = Color.White)
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Expand Toggle bottom handle
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onToggleExpand() }
                    .padding(vertical = 4.dp),
                contentAlignment = Alignment.Center
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = if (isExpanded) "Recolher detalhes" else "Expandir detalhes",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Icon(
                        imageVector = if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }
    }
}

fun PINKSYNCCOLOR() = Color.White

@Composable
fun MetricSnippet(icon: ImageVector, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(imageVector = icon, contentDescription = null, modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = label, fontSize = 10.sp, fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
    }
}

// Share dialogues
@Composable
fun ShareDialog(rdo: RdoReport, onDismiss: () -> Unit) {
    var shareSuccessMessage by remember { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    "Compartilhar RDO #${rdo.id}",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    rdo.obraTitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    modifier = Modifier.padding(top = 4.dp, bottom = 20.dp)
                )

                if (shareSuccessMessage != null) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFFE8F5E9), RoundedCornerShape(8.dp))
                            .padding(12.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Default.Check, contentDescription = null, tint = Color(0xFF2E7D32))
                            Text(shareSuccessMessage!!, fontSize = 12.sp, color = Color(0xFF2E7D32), fontWeight = FontWeight.Bold)
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Grid of share items (WhatsApp, PDF export, Instagram, LinkedIn)
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    ShareOptionItem(
                        icon = Icons.Default.Chat,
                        label = "Compartilhar via WhatsApp",
                        subtitle = "Enviar link de acesso rápido",
                        color = Color(0xFF4CAF50)
                    ) {
                        shareSuccessMessage = "Link compartilhado no WhatsApp com sucesso!"
                    }

                    ShareOptionItem(
                        icon = Icons.Default.PictureAsPdf,
                        label = "Enviar PDF Oficial",
                        subtitle = "Relatório formatado em anexo",
                        color = Color(0xFFE53935)
                    ) {
                        shareSuccessMessage = "PDF enviado com sucesso!"
                    }

                    ShareOptionItem(
                        icon = Icons.Default.CameraAlt,
                        label = "Postar no Instagram Stories",
                        subtitle = "Gerar layout de avanço de obra",
                        color = Color(0xFFE1306C)
                    ) {
                        shareSuccessMessage = "Story gerado e copiado para a galeria!"
                    }

                    ShareOptionItem(
                        icon = Icons.Default.Share,
                        label = "Compartilhar no LinkedIn",
                        subtitle = "Postar conquista profissional",
                        color = Color(0xFF0077B5)
                    ) {
                        shareSuccessMessage = "RDO encaminhado para rascunhos do LinkedIn!"
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                OutlinedButton(
                    onClick = onDismiss,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Cancelar")
                }
            }
        }
    }
}

@Composable
fun ShareOptionItem(
    icon: ImageVector,
    label: String,
    subtitle: String,
    color: Color,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(color = color.copy(alpha = 0.12f), shape = CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(label, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
            Text(subtitle, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
        }
        Icon(Icons.Default.ChevronRight, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f))
    }
}


// ==========================================
// 4. OBRAS LIST SCREEN + ADD DIALOG
// ==========================================
@Composable
fun ObrasListTabContent(viewModel: AppViewModel) {
    val obras by viewModel.filteredObras.collectAsState()
    val showAddDialog by viewModel.showAddObraDialog.collectAsState()
    val searchQuery by viewModel.obraSearchQuery.collectAsState()

    // Add dialog implementation
    if (showAddDialog) {
        AddObraDialog(
            viewModel = viewModel,
            onDismiss = { viewModel.showAddObraDialog.value = false }
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.TopCenter
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 840.dp)
                .fillMaxWidth()
        ) {
        // Obra Title and Add row matching Image 8
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Gestão de Obras",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "Total de Canteiros ativos: ${obras.size}",
                    style = MaterialTheme.typography.bodySmall.copy(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                )
            }

            Button(
                onClick = { viewModel.showAddObraDialog.value = true },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.testTag("add_obra_trigger")
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Text("Adicionar", fontSize = 12.sp)
                }
            }
        }

        // Search Obras input
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { viewModel.obraSearchQuery.value = it },
            placeholder = { Text("Buscar obras...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            colors = TextFieldDefaults.colors(
                unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                focusedContainerColor = MaterialTheme.colorScheme.surface
            ),
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 16.dp, end = 16.dp, bottom = 12.dp)
        )

        // Obras cards list
        if (obras.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.Business,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.3f),
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        "Sem obras cadastradas.",
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Toque em '+ Adicionar' no topo para registrar um novo projeto de engenharia.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                        textAlign = TextAlign.Center
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(obras, key = { it.id }) { obra ->
                    ObraCardItem(
                        obra = obra,
                        onNewRdo = {
                            viewModel.setupNewRdoDraft(obra)
                            viewModel.navigateTo("novo_rdo")
                        }
                    )
                }
            }
        }
    }
}
}

@Composable
fun ObraCardItem(obra: Obra, onNewRdo: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp), // 24.dp corners for Clean Minimalism
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Title and pin
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .background(
                                color = if (obra.isActive) Color(0xFF2E7D32) else Color.Gray,
                                shape = CircleShape
                            )
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = obra.title,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black)
                    )
                }

                IconButton(onClick = onNewRdo) {
                    Icon(
                        imageVector = Icons.Default.NoteAdd,
                        contentDescription = "Criar RDO",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Subtitles
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Place, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(obra.location, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(obra.engineerName, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Progress bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Avanço Físico",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.secondary
                )
                Text(
                    text = "${obra.progress}%",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            LinearProgressIndicator(
                progress = { obra.progress.toFloat() / 100f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.outline
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Dates range row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Início", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    Text(obra.startDate, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Previsão Término", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    Text(obra.endDate, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Details Action Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextButton(onClick = { }) {
                    Text("Ver Detalhes", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Button(
                    onClick = onNewRdo,
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text("+ Novo RDO", color = Color.White, fontSize = 12.sp)
                }
            }
        }
    }
}

// Custom Dialog to Add Construction Project (Obra)
@Composable
fun AddObraDialog(viewModel: AppViewModel, onDismiss: () -> Unit) {
    val title by viewModel.newObraTitle.collectAsState()
    val location by viewModel.newObraLocation.collectAsState()
    val engineer by viewModel.newObraEngineer.collectAsState()
    val startDate by viewModel.newObraStartDate.collectAsState()
    val endDate by viewModel.newObraEndDate.collectAsState()

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
            modifier = Modifier
                .widthIn(max = 500.dp)
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    "Adicionar Nova Obra",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = title,
                    onValueChange = { viewModel.newObraTitle.value = it },
                    label = { Text("Nome da Obra") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("obra_title_input")
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = location,
                    onValueChange = { viewModel.newObraLocation.value = it },
                    label = { Text("Cidade / Endereço") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = engineer,
                    onValueChange = { viewModel.newObraEngineer.value = it },
                    label = { Text("Responsável Técnico") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = startDate,
                    onValueChange = { viewModel.newObraStartDate.value = it },
                    label = { Text("Data de Início") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = endDate,
                    onValueChange = { viewModel.newObraEndDate.value = it },
                    label = { Text("Previsão de Término") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(24.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancelar")
                    }

                    Button(
                        onClick = { viewModel.saveNewObra() },
                        shape = RoundedCornerShape(12.dp),
                        enabled = title.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("save_obra_button")
                    ) {
                        Text("Salvar", color = Color.White)
                    }
                }
            }
        }
    }
}

// ==========================================
// 5. MAIS OPTIONS TAB SCREEN & UTILITIES
// ==========================================
data class MenuOptionData(
    val title: String,
    val description: String,
    val icon: ImageVector,
    val brandColor: Color,
    val onClick: () -> Unit
)

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun MaisOptionsTabContent(viewModel: AppViewModel) {
    val engineerName by viewModel.engineerName.collectAsState()
    val engineerRole by viewModel.engineerRole.collectAsState()
    val engineerCrea by viewModel.engineerCrea.collectAsState()
    val engineerEmail by viewModel.engineerEmail.collectAsState()
    
    val allObras by viewModel.allObras.collectAsState()
    val allReports by viewModel.allReports.collectAsState()
    
    var activeDialogType by remember { mutableStateOf<String?>(null) }
    
    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.TopCenter
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 840.dp)
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 24.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text(
                text = "Mais Opções",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )
            Text(
                text = "Acesse dados essenciais e ferramentas de campo do sistema",
                style = MaterialTheme.typography.bodySmall.copy(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)),
                modifier = Modifier.padding(bottom = 20.dp)
            )

            // --- PREMIUM INTUITIVE PROFILE BANNER WIDGET ---
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 20.dp)
                    .clickable { viewModel.navigateTo("perfil") },
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f)
                ),
                border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.15f))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Profile Initials Circle Avatar
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .background(
                                color = MaterialTheme.colorScheme.primary,
                                shape = CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        val initials = remember(engineerName) {
                            engineerName.split(" ")
                                .filter { it.isNotBlank() }
                                .take(2)
                                .mapNotNull { it.firstOrNull()?.uppercaseChar() }
                                .joinToString("")
                        }
                        Text(
                            text = initials.ifBlank { "MN" },
                            color = Color.White,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black)
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = engineerName,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                        )
                        Text(
                            text = "$engineerRole • $engineerCrea",
                            style = MaterialTheme.typography.bodySmall.copy(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                        )
                        Text(
                            text = engineerEmail,
                            style = MaterialTheme.typography.labelSmall.copy(color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold),
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }

                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .background(MaterialTheme.colorScheme.surface, shape = CircleShape)
                            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f), shape = CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Editar Perfil",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            // Quick Analytics Summary Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                        Text(
                            text = allObras.size.toString(),
                            style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary)
                        )
                        Text(
                            text = "Obras Ativas",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        )
                    }
                    Divider(modifier = Modifier.height(36.dp).width(1.dp).align(Alignment.CenterVertically))
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                        Text(
                            text = allReports.size.toString(),
                            style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.secondary)
                        )
                        Text(
                            text = "RDOs Emitidos",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        )
                    }
                }
            }

            // Options menu setup (Added "Meu Perfil" card inside the options flow too!)
            val items = listOf(
                MenuOptionData("Meu Perfil", "Ajuste dados e veja estatísticas", Icons.Default.Person, MaterialTheme.colorScheme.primary, { viewModel.navigateTo("perfil") }),
                MenuOptionData("Documentos", "Gerencie documentos das obras", Icons.Default.Folder, Color(0xFF1976D2), { activeDialogType = "documentos" }),
                MenuOptionData("Fornecedores", "Lista de parceiros e fornecedores", Icons.Default.Handshake, Color(0xFFE15A1D), { activeDialogType = "fornecedores" }),
                MenuOptionData("Equipes", "Contingente e gestão de equipes", Icons.Default.Groups, Color(0xFF2E7D32), { activeDialogType = "equipes" }),
                MenuOptionData("Equipamentos", "Inventário de máquinas de campo", Icons.Default.Settings, Color(0xFF8E24AA), { activeDialogType = "equipamentos" }),
                MenuOptionData("Checklist", "Checklists de segurança de obra", Icons.Default.FactCheck, Color(0xFF00796B), { activeDialogType = "checklist" }),
                MenuOptionData("Relatórios", "Gráficos de evolução das obras", Icons.Default.Insights, Color(0xFFD32F2F), { activeDialogType = "relatorios" })
            )

            // Responsive flow wrap
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                maxItemsInEachRow = if (this@BoxWithConstraints.maxWidth >= 520.dp) 2 else 1
            ) {
                val cardWidth = if (this@BoxWithConstraints.maxWidth >= 520.dp) (this@BoxWithConstraints.maxWidth - 48.dp - 16.dp) / 2 else this@BoxWithConstraints.maxWidth
                items.forEach { item ->
                    Box(modifier = Modifier.width(cardWidth)) {
                        MenuOptionCard(data = item)
                    }
                }
            }
        }
    }

    // --- INTERACTIVE SYSTEM MODALS FOR ZERO-DEAD-ENDS METRICS ---
    activeDialogType?.let { type ->
        UtilityFeatureDialog(type = type, onClose = { activeDialogType = null })
    }
}

@Composable
fun MenuOptionCard(data: MenuOptionData) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(115.dp)
            .clickable { data.onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(color = data.brandColor.copy(alpha = 0.12f), shape = CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(imageVector = data.icon, contentDescription = data.title, tint = data.brandColor, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = data.title,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = data.description,
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                lineHeight = 13.sp
            )
        }
    }
}

// Dialog generator to supply complete utilities data
@Composable
fun UtilityFeatureDialog(type: String, onClose: () -> Unit) {
    Dialog(onDismissRequest = onClose) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .heightIn(max = 500.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val title = when (type) {
                        "documentos" -> "Documentos da Obra"
                        "fornecedores" -> "Parceiros & Fornecedores"
                        "equipes" -> "Controle de Equipes"
                        "equipamentos" -> "Controle de Equipamentos"
                        "checklist" -> "Checklist de Segurança"
                        "relatorios" -> "Visão de Produtividade"
                        else -> "Utilitário"
                    }
                    val icon = when (type) {
                        "documentos" -> Icons.Default.Folder
                        "fornecedores" -> Icons.Default.Handshake
                        "equipes" -> Icons.Default.Groups
                        "equipamentos" -> Icons.Default.Settings
                        "checklist" -> Icons.Default.FactCheck
                        "relatorios" -> Icons.Default.Insights
                        else -> Icons.Default.Info
                    }
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(imageVector = icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(24.dp))
                        Text(text = title, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary))
                    }
                    IconButton(onClick = onClose) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Fechar")
                    }
                }

                Divider(modifier = Modifier.padding(vertical = 12.dp))

                // Content list
                Box(modifier = Modifier.weight(1f)) {
                    when (type) {
                        "documentos" -> {
                            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                val docs = listOf(
                                    "Projeto_Estrutural_Rev5_Calculo.pdf" to "8.2 MB • Modificado por Matheus em 11/06/2026",
                                    "Projeto_Instalacao_Eletrica_Aprovado.pdf" to "4.1 MB • Modificado por Carlos em 08/06/2026",
                                    "Laudo_Sondagem_Solo_Terreno_A.pdf" to "2.9 MB • Modificado por Matheus em 01/06/2026",
                                    "Alvará_de_Construcao_Municipality.pdf" to "1.5 MB • Arquivo institucional"
                                )
                                items(docs) { (title, sub) ->
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth().padding(12.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(imageVector = Icons.Default.Description, contentDescription = null, tint = Color(0xFF1976D2), modifier = Modifier.size(28.dp))
                                            Spacer(modifier = Modifier.width(12.dp))
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(text = title, fontSize = 12.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                                Text(text = sub, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.52f))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        "fornecedores" -> {
                            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                val vendors = listOf(
                                    "MassaForte Concretos" to "Suprimento Fck 30 MPa • (41) 3224-9000",
                                    "Aço&Ferro Distribuidora" to "Armadura CA-50 / CA-60 • contato@acoferrosul.com",
                                    "LocaMáquinas Equipamentos" to "Aluguel de Betoneiras e Andaimes • (41) 9988-1122",
                                    "Votoran Cimentos" to "Cimento Portland CP-II faturado • Entrega em lote"
                                )
                                items(vendors) { (name, info) ->
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth().padding(12.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(imageVector = Icons.Default.Business, contentDescription = null, tint = Color(0xFFE15A1D), modifier = Modifier.size(28.dp))
                                            Spacer(modifier = Modifier.width(12.dp))
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(text = name, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                                Text(text = info, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.52f))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        "equipes" -> {
                            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                val squads = listOf(
                                    "Equipe Estutura & Laje" to "Líder Mestre Jorge • 8 Operadores • Em atividade",
                                    "Equipe Alvenaria & Reboco" to "Líder Encarregado Silva • 6 Operadores • Em atividade",
                                    "Equipe Hidrossanitária" to "Líder Encanador Gilberto • 3 Soldadores • Aguardando materiais",
                                    "Equipe Pintura Interna" to "Líder Pintor Cleiton • 4 Pintores • Programado"
                                )
                                items(squads) { (name, info) ->
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth().padding(12.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(imageVector = Icons.Default.Groups, contentDescription = null, tint = Color(0xFF2E7D32), modifier = Modifier.size(28.dp))
                                            Spacer(modifier = Modifier.width(12.dp))
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(text = name, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                                Text(text = info, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.52f))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        "equipamentos" -> {
                            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                val machinery = listOf(
                                    "Betoneira Menegotti 400 Litros" to "Ativa na Obra • Revisão em: 25/06/2026",
                                    "Mini Carregadeira Bobcat S450" to "Ativa na Obra • Manutenção Preventiva OK",
                                    "Andaime Metálico Modular" to "240 m² Montados • Laudo de Estabilidade Ok",
                                    "Serra de Bancada Dewalt" to "Ativa • Coifa de proteção instalada"
                                )
                                items(machinery) { (name, info) ->
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth().padding(12.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(imageVector = Icons.Default.Settings, contentDescription = null, tint = Color(0xFF8E24AA), modifier = Modifier.size(28.dp))
                                            Spacer(modifier = Modifier.width(12.dp))
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(text = name, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                                Text(text = info, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.52f))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        "checklist" -> {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.verticalScroll(rememberScrollState())) {
                                Text(text = "Segurança & NR-18 Diária:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                val items = remember {
                                    mutableStateListOf(
                                        "Todos operando com EPIs completos (Capacete, Bota, Óculos)" to true,
                                        "Estabilidade de andaimes e bandejas inspecionada" to true,
                                        "Linha de vida principal afixada e livre de desgaste" to false,
                                        "Sinalização de riscos ativa no canteiro de obras" to true,
                                        "Ferramentas manuais elétricas com aterramento íntegro" to false
                                    )
                                }
                                items.forEachIndexed { idx, pair ->
                                    Row(
                                        modifier = Modifier.fillMaxWidth().clickable { items[idx] = pair.first to !pair.second },
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Checkbox(checked = pair.second, onCheckedChange = { items[idx] = pair.first to it })
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(text = pair.first, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface)
                                    }
                                }
                            }
                        }
                        "relatorios" -> {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.verticalScroll(rememberScrollState())) {
                                Text(text = "Produtividade média das Obras:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background)
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text(text = "RDOs Emitidos na Semana", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                                        Spacer(modifier = Modifier.height(12.dp))
                                        // Simple elegant bars visualization
                                        Row(
                                            modifier = Modifier.fillMaxWidth().height(60.dp),
                                            horizontalArrangement = Arrangement.SpaceEvenly,
                                            verticalAlignment = Alignment.Bottom
                                        ) {
                                            val reportCounts = listOf(2, 3, 5, 4, 6, 1, 0)
                                            val days = listOf("S", "T", "Q", "Q", "S", "S", "D")
                                            reportCounts.forEachIndexed { index, count ->
                                                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                                    Box(
                                                        modifier = Modifier
                                                            .width(16.dp)
                                                            .height((count * 8).dp)
                                                            .background(
                                                                color = if (count > 3) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondary,
                                                                shape = RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp)
                                                            )
                                                    )
                                                    Text(text = days[index], fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                                }
                                            }
                                        }
                                    }
                                }
                                Text(text = "Todas as 3 metas previstas de relatórios diários de obras concluídas.", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f))
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = onClose,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(text = "Entendido", color = Color.White)
                }
            }
        }
    }
}


// ==========================================
// 6. NOVO RDO / REPORT WIZARD FORM (ALL 9 IMAGES SECTIONS!)
// ==========================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NovoRdoScreen(viewModel: AppViewModel) {
    val draftId by viewModel.draftId.collectAsState()
    val draftObraId by viewModel.draftObraId.collectAsState()
    val draftObraTitle by viewModel.draftObraTitle.collectAsState()
    val draftDate by viewModel.draftDate.collectAsState()
    val draftPeriod by viewModel.draftPeriod.collectAsState()
    val draftWeather by viewModel.draftWeather.collectAsState()
    val draftIsTeamIdle by viewModel.draftIsTeamIdle.collectAsState()
    val draftObservations by viewModel.draftObservations.collectAsState()

    val draftCrews by viewModel.draftCrews.collectAsState()
    val draftEquipments by viewModel.draftEquipments.collectAsState()
    val draftExtraActivities by viewModel.draftExtraActivities.collectAsState()
    val draftIssues by viewModel.draftIssues.collectAsState()
    val draftAttachmentsCount by viewModel.draftAttachmentsCount.collectAsState()

    val tempCrewName by viewModel.tempCrewName.collectAsState()
    val tempCrewHours by viewModel.tempCrewHours.collectAsState()
    val tempEquipmentName by viewModel.tempEquipmentName.collectAsState()
    val tempExtraActivityName by viewModel.tempExtraActivityName.collectAsState()
    val tempIssueName by viewModel.tempIssueName.collectAsState()

    val obras by viewModel.allObras.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (draftId == null) "Novo Relatório Diário" else "Editar Relatório Diário",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                    )
                },
                navigationIcon = {
                    IconButton(onClick = { viewModel.navigateTo(viewModel.previousScreen.value) }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Voltar", tint = MaterialTheme.colorScheme.primary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        },
        bottomBar = {
            // Sticky actions bar at the bottom
            Surface(
                tonalElevation = 8.dp,
                color = MaterialTheme.colorScheme.surface,
                modifier = Modifier
                    .fillMaxWidth()
                    .windowInsetsPadding(WindowInsets.navigationBars)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = { viewModel.saveDraftRdo("Rascunho") },
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Salvar Rascunho", fontWeight = FontWeight.SemiBold)
                    }

                    Button(
                        onClick = { viewModel.saveDraftRdo("Aprovado") },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("submit_rdo_button")
                    ) {
                        Text("Aprovar RDO", fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background),
            contentAlignment = Alignment.TopCenter
        ) {
            Column(
                modifier = Modifier
                    .widthIn(max = 840.dp)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
            Spacer(modifier = Modifier.height(4.dp))

            // SECTION 1: INFORMAÇÕES BÁSICAS (Image 6)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Seção 1: Informações Básicas",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    // Date Input
                    OutlinedTextField(
                        value = draftDate,
                        onValueChange = { viewModel.draftDate.value = it },
                        label = { Text("Data do Relatório") },
                        trailingIcon = { Icon(Icons.Default.CalendarToday, contentDescription = null) },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    // Obra Selection Dropdown
                    var obraMenuExpanded by remember { mutableStateOf(false) }
                    Box {
                        OutlinedTextField(
                            value = draftObraTitle.ifBlank { "Nenhuma Selecionada" },
                            onValueChange = { },
                            label = { Text("Obra") },
                            readOnly = true,
                            trailingIcon = {
                                IconButton(onClick = { obraMenuExpanded = true }) {
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                        DropdownMenu(
                            expanded = obraMenuExpanded,
                            onDismissRequest = { obraMenuExpanded = false }
                        ) {
                            obras.forEach { obra ->
                                DropdownMenuItem(
                                    text = { Text(obra.title) },
                                    onClick = {
                                        viewModel.draftObraId.value = obra.id
                                        viewModel.draftObraTitle.value = obra.title
                                        obraMenuExpanded = false
                                    }
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))

                    // Clima Selector Dropdown
                    var weatherMenuExpanded by remember { mutableStateOf(false) }
                    Box {
                        OutlinedTextField(
                            value = draftWeather,
                            onValueChange = { },
                            label = { Text("Condições Climáticas") },
                            readOnly = true,
                            trailingIcon = {
                                IconButton(onClick = { weatherMenuExpanded = true }) {
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                        DropdownMenu(
                            expanded = weatherMenuExpanded,
                            onDismissRequest = { weatherMenuExpanded = false }
                        ) {
                            listOf("Ensolarado", "Sem Chuva", "Céu Limpo", "Chuvoso", "Parcialmente Nublado", "Instável").forEach { weather ->
                                DropdownMenuItem(
                                    text = { Text(weather) },
                                    onClick = {
                                        viewModel.draftWeather.value = weather
                                        weatherMenuExpanded = false
                                    }
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))

                    // Team idle options selector
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Equipe ficou ociosa?", style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium))
                        Switch(
                            checked = draftIsTeamIdle,
                            onCheckedChange = { viewModel.draftIsTeamIdle.value = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = MaterialTheme.colorScheme.primary)
                        )
                    }
                }
            }

            // SECTION 2: PERÍODO DE TRABALHO (Image 5)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Seção 2: Período de Trabalho",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    var periodExpanded by remember { mutableStateOf(false) }
                    Box {
                        OutlinedTextField(
                            value = draftPeriod,
                            onValueChange = { },
                            readOnly = true,
                            label = { Text("Adicionar período") },
                            trailingIcon = {
                                IconButton(onClick = { periodExpanded = true }) {
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                        DropdownMenu(expanded = periodExpanded, onDismissRequest = { periodExpanded = false }) {
                            listOf("Integral", "Diurno", "Manhã", "Tarde", "Noite", "Extra").forEach { opt ->
                                DropdownMenuItem(
                                    text = { Text(opt) },
                                    onClick = {
                                        viewModel.draftPeriod.value = opt
                                        periodExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Nota: O período padrão para engenharia civil regular de canteiro é 'Integral' das 08:00 às 17:00.",
                        style = MaterialTheme.typography.bodySmall.copy(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    )
                }
            }

            // SECTION 3: EQUIPES PRESENTES (Image 4)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Seção 3: Equipes Presentes",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    // Input group
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = tempCrewName,
                            onValueChange = { viewModel.tempCrewName.value = it },
                            placeholder = { Text("Nome do Colaborador") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1.5f)
                        )

                        OutlinedTextField(
                            value = tempCrewHours,
                            onValueChange = { viewModel.tempCrewHours.value = it },
                            placeholder = { Text("Horas") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(0.7f)
                        )

                        IconButton(
                            onClick = { viewModel.addCrewMember() },
                            modifier = Modifier
                                .size(48.dp)
                                .background(MaterialTheme.colorScheme.primary, shape = CircleShape)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Add", tint = Color.White)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    if (draftCrews.isEmpty()) {
                        Text(
                            "Nenhum colaborador registrado.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                            textAlign = TextAlign.Center,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp)
                        )
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            draftCrews.forEach { collab ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(
                                            MaterialTheme.colorScheme.background,
                                            RoundedCornerShape(8.dp)
                                        )
                                        .padding(horizontal = 12.dp, vertical = 6.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(collab, style = MaterialTheme.typography.bodyMedium)
                                    IconButton(
                                        onClick = { viewModel.removeCrewMember(collab) },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(Icons.Default.RemoveCircleOutline, contentDescription = "Remover", tint = Color.Red)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // SECTION 4: ATIVIDADES REALIZADAS (Image 4)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Seção 4: Atividades Realizadas",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Dica: Selecione a obra no campo acima para carregar as atividades disponíveis, ou as inclua nas seções de atividades extras.",
                        style = MaterialTheme.typography.bodySmall.copy(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    )
                }
            }

            // SECTION 5: EQUIPAMENTOS UTILIZADOS (Image 2)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Seção 5: Equipamentos Utilizados",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = tempEquipmentName,
                            onValueChange = { viewModel.tempEquipmentName.value = it },
                            placeholder = { Text("Nome do Equipamento") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        )

                        IconButton(
                            onClick = { viewModel.addEquipment() },
                            modifier = Modifier
                                .size(48.dp)
                                .background(MaterialTheme.colorScheme.primary, shape = CircleShape)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Add", tint = Color.White)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    if (draftEquipments.isEmpty()) {
                        Text(
                            "Nenhum equipamento registrado.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                            textAlign = TextAlign.Center,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp)
                        )
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            draftEquipments.forEach { equip ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(
                                            MaterialTheme.colorScheme.background,
                                            RoundedCornerShape(8.dp)
                                        )
                                        .padding(horizontal = 12.dp, vertical = 6.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(equip, style = MaterialTheme.typography.bodyMedium)
                                    IconButton(
                                        onClick = { viewModel.removeEquipment(equip) },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(Icons.Default.RemoveCircleOutline, contentDescription = "Remover", tint = Color.Red)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // SECTION 6: PROBLEMAS E OCORRÊNCIAS (Image 2)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Seção 6: Problemas e Ocorrências",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = tempIssueName,
                            onValueChange = { viewModel.tempIssueName.value = it },
                            placeholder = { Text("Relatar falha, atraso, etc.") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        )

                        IconButton(
                            onClick = { viewModel.addIssue() },
                            modifier = Modifier
                                .size(48.dp)
                                .background(MaterialTheme.colorScheme.primary, shape = CircleShape)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Add", tint = Color.White)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    if (draftIssues.isEmpty()) {
                        Text(
                            "Nenhum problema registrado no dia.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                            textAlign = TextAlign.Center,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp)
                        )
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            draftIssues.forEach { issue ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(
                                            MaterialTheme.colorScheme.background,
                                            RoundedCornerShape(8.dp)
                                        )
                                        .padding(horizontal = 12.dp, vertical = 6.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(issue, style = MaterialTheme.typography.bodyMedium)
                                    IconButton(
                                        onClick = { viewModel.removeIssue(issue) },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(Icons.Default.RemoveCircleOutline, contentDescription = "Remover", tint = Color.Red)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // SECTION 7: ATIVIDADES EXTRAS (Image 3)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Seção 7: Atividades Extras",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = tempExtraActivityName,
                            onValueChange = { viewModel.tempExtraActivityName.value = it },
                            placeholder = { Text("Descrever Atividade Extra") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        )

                        IconButton(
                            onClick = { viewModel.addExtraActivity() },
                            modifier = Modifier
                                .size(48.dp)
                                .background(MaterialTheme.colorScheme.primary, shape = CircleShape)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Add", tint = Color.White)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    if (draftExtraActivities.isEmpty()) {
                        Text(
                            "Nenhuma atividade extra realizada.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                            textAlign = TextAlign.Center,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp)
                        )
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            draftExtraActivities.forEach { extAct ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(
                                            MaterialTheme.colorScheme.background,
                                            RoundedCornerShape(8.dp)
                                        )
                                        .padding(horizontal = 12.dp, vertical = 6.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(extAct, style = MaterialTheme.typography.bodyMedium)
                                    IconButton(
                                        onClick = { viewModel.removeExtraActivity(extAct) },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(Icons.Default.RemoveCircleOutline, contentDescription = "Remover", tint = Color.Red)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // SECTION 8: OBSERVAÇÕES GERAIS (Image 1)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Seção 8: Observações Gerais",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = draftObservations,
                        onValueChange = { viewModel.draftObservations.value = it },
                        placeholder = { Text("Espaço para registrar observações gerais ou comentários sobre o dia de trabalho.") },
                        shape = RoundedCornerShape(12.dp),
                        minLines = 4,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            // SECTION 9: ANEXOS / IMAGES (Image 1)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Seção 9: Anexos",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    // Drag & Drop mock space
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(
                                width = 2.dp,
                                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.4f),
                                shape = RoundedCornerShape(12.dp)
                            )
                            .clickable {
                                viewModel.draftAttachmentsCount.value = viewModel.draftAttachmentsCount.value + 1
                            }
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.CloudUpload,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(36.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "Selecionar Arquivos / Fotografias",
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                "Suporte até 20MB por arquivo",
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                            )
                        }
                    }

                    if (draftAttachmentsCount > 0) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                "Anexos simulados carregados: $draftAttachmentsCount arquivo(s)",
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                            )
                            TextButton(onClick = { viewModel.draftAttachmentsCount.value = 0 }) {
                                Text("Limpar", color = Color.Red)
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(100.dp))
        }
    }
}
}

// =========================================================================
// ACTION SEARCH BAR COMPONENT (COMPATIBLE WITH ACTION-SEARCH-BAR SECTIONS)
// =========================================================================

data class SearchAction(
    val id: String,
    val label: String,
    val description: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val textColor: Color,
    val badgeBgColor: Color,
    val shortcut: String,
    val category: String,
    val onExecute: () -> Unit
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActionSearchBar(
    viewModel: AppViewModel,
    onToggleTheme: () -> Unit,
    modifier: Modifier = Modifier
) {
    var query by remember { mutableStateOf("") }
    var isFocused by remember { mutableStateOf(false) }
    val focusManager = LocalFocusManager.current
    
    val obras by viewModel.allObras.collectAsState()
    val reports by viewModel.allReports.collectAsState()
    
    // Standard system/app actions matching terms
    val systemActions = remember(onToggleTheme) {
        listOf(
            SearchAction(
                id = "cmd_new_rdo",
                label = "Novo RDO (Relatório Diário)",
                description = "Gerar e preencher novo relatório diário de obra",
                icon = Icons.Default.NoteAdd,
                textColor = Color(0xFFE15A1D),
                badgeBgColor = Color(0xFFFFECE2),
                shortcut = "ADD",
                category = "Ação",
                onExecute = {
                    viewModel.setupNewRdoDraft()
                    viewModel.navigateTo("novo_rdo")
                }
            ),
            SearchAction(
                id = "cmd_new_obra",
                label = "Cadastrar Nova Obra",
                description = "Adicionar novo projeto ou canteiro de obras",
                icon = Icons.Default.Business,
                textColor = Color(0xFF1976D2),
                badgeBgColor = Color(0xFFE3F2FD),
                shortcut = "OBRA",
                category = "Ação",
                onExecute = {
                    viewModel.showAddObraDialog.value = true
                    viewModel.navigateTo("obras")
                }
            ),
            SearchAction(
                id = "cmd_theme",
                label = "Alternar Tema Visual",
                description = "Mudar layout entre modo claro e escuro",
                icon = Icons.Default.Settings,
                textColor = Color(0xFF8E24AA),
                badgeBgColor = Color(0xFFF3E5F5),
                shortcut = "TEMA",
                category = "Sistema",
                onExecute = { onToggleTheme() }
            ),
            SearchAction(
                id = "cmd_metrics",
                label = "Análise e Estatísticas",
                description = "Ver índices de produtividade e relatórios de obras",
                icon = Icons.Default.BarChart,
                textColor = Color(0xFF2E7D32),
                badgeBgColor = Color(0xFFE8F5E9),
                shortcut = "DADOS",
                category = "Sistema",
                onExecute = { viewModel.navigateTo("mais") }
            ),
            SearchAction(
                id = "cmd_people",
                label = "Contatos e Equipes",
                description = "Consultar equipes e equipes de produção ativas",
                icon = Icons.Default.People,
                textColor = Color(0xFF00ACC1),
                badgeBgColor = Color(0xFFE0F7FA),
                shortcut = "GRUPO",
                category = "Consulta",
                onExecute = { viewModel.navigateTo("mais") }
            ),
            SearchAction(
                id = "cmd_logout",
                label = "Sair da Conta",
                description = "Logout seguro do META Construtor",
                icon = Icons.Default.Logout,
                textColor = Color(0xFFD32F2F),
                badgeBgColor = Color(0xFFFFEBEE),
                shortcut = "SAIR",
                category = "Sistema",
                onExecute = { viewModel.handleLogout() }
            )
        )
    }
    
    // Filter actions
    val filteredActions = remember(query) {
        if (query.isBlank()) {
            systemActions
        } else {
            systemActions.filter {
                it.label.contains(query, ignoreCase = true) ||
                it.description.contains(query, ignoreCase = true) ||
                it.category.contains(query, ignoreCase = true)
            }
        }
    }
    
    val matchingObras = remember(query, obras) {
        if (query.isBlank()) emptyList() else {
            obras.filter {
                it.title.contains(query, ignoreCase = true) ||
                it.location.contains(query, ignoreCase = true) ||
                it.engineerName.contains(query, ignoreCase = true)
            }
        }
    }
    
    val matchingReports = remember(query, reports) {
        if (query.isBlank()) emptyList() else {
            reports.filter {
                it.obraTitle.contains(query, ignoreCase = true) ||
                it.activitiesJson.contains(query, ignoreCase = true) ||
                it.weatherCondition.contains(query, ignoreCase = true)
            }
        }
    }
    
    val totalResultsCount = filteredActions.size + matchingObras.size + matchingReports.size
    
    Box(
        modifier = modifier
            .fillMaxWidth()
            .zIndex(10f)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            OutlinedTextField(
                value = query,
                onValueChange = {
                    query = it
                    viewModel.rdoSearchQuery.value = it
                    viewModel.obraSearchQuery.value = it
                },
                placeholder = { Text("Buscar obras, RDOs, comandos...") },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Buscar",
                        tint = MaterialTheme.colorScheme.primary
                    )
                },
                trailingIcon = {
                    AnimatedContent(
                        targetState = (query.isNotEmpty() || isFocused),
                        label = "search_trailing_anim"
                    ) { hasState ->
                        if (hasState) {
                            IconButton(onClick = {
                                query = ""
                                viewModel.rdoSearchQuery.value = ""
                                viewModel.obraSearchQuery.value = ""
                                focusManager.clearFocus()
                            }) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Limpar ou cancelar",
                                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }
                        } else {
                            Box(
                                modifier = Modifier
                                    .padding(end = 8.dp)
                                    .background(
                                        color = if (isSystemInDarkTheme()) Color(0xFF334155) else Color(0xFFE2E8F0),
                                        shape = RoundedCornerShape(4.dp)
                                    )
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "ESC",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                    )
                                )
                            }
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .onFocusChanged { state ->
                        isFocused = state.isFocused
                    }
            )
            
            // Dropdown Palette Overlay matching command menu logic
            AnimatedVisibility(
                visible = isFocused,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp)
                        .heightIn(max = 350.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                ) {
                    Column(modifier = Modifier.fillMaxSize()) {
                        // Header
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                                .padding(horizontal = 16.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Comandos e Pesquisas",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            )
                            if (query.isNotEmpty()) {
                                Text(
                                    text = "Encontrados: $totalResultsCount resultados",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                )
                            }
                        }
                        
                        Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                        
                        LazyColumn(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxWidth()
                        ) {
                            // Shortcuts
                            if (filteredActions.isNotEmpty()) {
                                item {
                                    CategoryGroupHeader("Atalhos do App")
                                }
                                items(filteredActions) { act ->
                                    ActionPaletteRowItem(
                                        action = act,
                                        onClick = {
                                            act.onExecute()
                                            focusManager.clearFocus()
                                            query = ""
                                        }
                                    )
                                }
                            }
                            
                            // Dynamic Obras
                            if (matchingObras.isNotEmpty()) {
                                item {
                                    CategoryGroupHeader("Projetos & Obras")
                                }
                                items(matchingObras) { obra ->
                                    MatchingEntityRowItem(
                                        title = "Obra: ${obra.title}",
                                        subtitle = "Local: ${obra.location} • Resp: ${obra.engineerName}",
                                        icon = Icons.Default.Business,
                                        iconBgColor = Color(0xFFE3F2FD),
                                        iconColor = Color(0xFF1976D2),
                                        onClick = {
                                            viewModel.navigateTo("obras")
                                            focusManager.clearFocus()
                                        }
                                    )
                                }
                            }
                            
                            // Dynamic reports
                            if (matchingReports.isNotEmpty()) {
                                item {
                                    CategoryGroupHeader("Relatórios RDO")
                                }
                                items(matchingReports) { rdo ->
                                    MatchingEntityRowItem(
                                        title = "RDO da Obra: ${rdo.obraTitle}",
                                        subtitle = "Período: ${rdo.periodType} • Clima: ${rdo.weatherCondition} • Data: ${rdo.reportDate}",
                                        icon = Icons.Default.Description,
                                        iconBgColor = Color(0xFFFFECE2),
                                        iconColor = Color(0xFFE15A1D),
                                        onClick = {
                                            viewModel.navigateTo("rdo")
                                            focusManager.clearFocus()
                                        }
                                    )
                                }
                            }
                            
                            if (totalResultsCount == 0) {
                                item {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(32.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Search,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.outline,
                                            modifier = Modifier.size(36.dp)
                                        )
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(
                                            text = "Nenhum resultado obtido para \"$query\"",
                                            style = MaterialTheme.typography.bodyMedium.copy(
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                            ),
                                            textAlign = TextAlign.Center
                                        )
                                    }
                                }
                            }
                        }
                        
                        Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                        
                        // Footer
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
                                .padding(horizontal = 16.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Use as iniciais para pesquisar comandos",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                                )
                            )
                            Text(
                                text = "Clique fora para cancelar",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                                )
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CategoryGroupHeader(title: String) {
    Text(
        text = title.uppercase(),
        style = MaterialTheme.typography.labelSmall.copy(
            fontWeight = FontWeight.Bold,
            fontSize = 9.sp,
            letterSpacing = 1.sp,
            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.8f)
        ),
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
    )
}

@Composable
fun ActionPaletteRowItem(action: SearchAction, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f)
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(action.badgeBgColor, shape = RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = action.icon,
                    contentDescription = null,
                    tint = action.textColor,
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = action.label,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                )
                Text(
                    text = action.description,
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    ),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
        
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Box(
                modifier = Modifier
                    .background(
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        shape = RoundedCornerShape(4.dp)
                    )
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = action.shortcut,
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                )
            }
            Box(
                modifier = Modifier
                    .background(
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                        shape = RoundedCornerShape(4.dp)
                    )
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = action.category,
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                )
            }
        }
    }
}

@Composable
fun MatchingEntityRowItem(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconBgColor: Color,
    iconColor: Color,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .background(iconBgColor, shape = RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(18.dp)
            )
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                ),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall.copy(
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                ),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
        Icon(
            imageVector = Icons.Default.KeyboardArrowRight,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.outline,
            modifier = Modifier.size(16.dp)
        )
    }
}

// ==========================================
// 10. COMPREHENSIVE AND RESPONSIVE PROFILE TAB SCREEN
// ==========================================
@Composable
fun PerfilTabContent(viewModel: AppViewModel, onToggleTheme: () -> Unit) {
    val engineerName by viewModel.engineerName.collectAsState()
    val engineerEmail by viewModel.engineerEmail.collectAsState()
    val engineerPhone by viewModel.engineerPhone.collectAsState()
    val engineerCrea by viewModel.engineerCrea.collectAsState()
    val engineerRole by viewModel.engineerRole.collectAsState()
    val engineerCompany by viewModel.engineerCompany.collectAsState()

    val allObras by viewModel.allObras.collectAsState()
    val allReports by viewModel.allReports.collectAsState()

    // Internal edit text values
    var nameState by remember(engineerName) { mutableStateOf(engineerName) }
    var emailState by remember(engineerEmail) { mutableStateOf(engineerEmail) }
    var phoneState by remember(engineerPhone) { mutableStateOf(engineerPhone) }
    var creaState by remember(engineerCrea) { mutableStateOf(engineerCrea) }
    var roleState by remember(engineerRole) { mutableStateOf(engineerRole) }
    var companyState by remember(engineerCompany) { mutableStateOf(engineerCompany) }

    var selectedAvatarOption by remember { mutableStateOf(0) } // selectable avatar skins (glowing rings)
    var isSavingSuccess by remember { mutableStateOf(false) }
    var mockBackupLoading by remember { mutableStateOf(false) }
    var mockBackupSuccess by remember { mutableStateOf(false) }
    var showAvatarPicker by remember { mutableStateOf(false) }
    var showSnackbarMessage by remember { mutableStateOf<String?>(null) }

    val avatarRingColor = when (selectedAvatarOption) {
        1 -> Color(0xFF1976D2) // Ocean Blue
        2 -> Color(0xFF2E7D32) // Forest Green
        3 -> Color(0xFF8E24AA) // Purple Amethyst
        else -> MaterialTheme.colorScheme.primary // Flame Orange
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Header Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { viewModel.navigateTo("mais") }) {
                    Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Voltar", tint = MaterialTheme.colorScheme.secondary)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Meu Perfil Profissional",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                )
            }

            // Central Area
            BoxWithConstraints(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentAlignment = Alignment.TopCenter
            ) {
                val isWideLayout = maxWidth >= 768.dp

                Column(
                    modifier = Modifier
                        .maxHeightScrollOrFill(isWideLayout)
                        .widthIn(max = if (isWideLayout) 1200.dp else 700.dp)
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 8.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    // Avatar Header Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // Avatar block
                            Box(
                                modifier = Modifier
                                    .size(100.dp)
                                    .border(3.dp, avatarRingColor, CircleShape)
                                    .padding(5.dp)
                                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f), CircleShape)
                                    .clickable { showAvatarPicker = true },
                                contentAlignment = Alignment.Center
                            ) {
                                val initials = remember(nameState) {
                                    nameState.split(" ")
                                        .filter { it.isNotBlank() }
                                        .take(2)
                                        .mapNotNull { it.firstOrNull()?.uppercaseChar() }
                                        .joinToString("")
                                }
                                Text(
                                    text = initials.ifBlank { "MN" },
                                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black, color = avatarRingColor)
                                )
                                // Pen Indicator
                                Box(
                                    modifier = Modifier
                                        .size(26.dp)
                                        .background(avatarRingColor, CircleShape)
                                        .align(Alignment.BottomEnd),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(imageVector = Icons.Default.Edit, contentDescription = null, tint = Color.White, modifier = Modifier.size(12.dp))
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Text(
                                text = engineerName,
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary),
                                textAlign = TextAlign.Center
                            )
                            Text(
                                text = "$engineerRole • $engineerCrea",
                                style = MaterialTheme.typography.bodySmall.copy(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)),
                                textAlign = TextAlign.Center
                            )

                            // Profile Completion bar
                            Spacer(modifier = Modifier.height(16.dp))
                            val filledCount = listOf(nameState, emailState, phoneState, creaState, roleState, companyState).count { it.isNotBlank() }
                            val completionPct = (filledCount / 6.0f)
                            Row(
                                modifier = Modifier.fillMaxWidth(0.81f),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                LinearProgressIndicator(
                                    progress = completionPct,
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(8.dp)
                                        .clip(RoundedCornerShape(4.dp)),
                                    color = MaterialTheme.colorScheme.primary,
                                    trackColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                                )
                                Text(
                                    text = "${(completionPct * 100).toInt()}%",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            Text(
                                text = "Completude do seu Perfil Corporativo",
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.44f),
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }
                    }

                    // Dual Column Layout for Wide Screens, or direct vertical stacking
                    if (isWideLayout) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(20.dp)
                        ) {
                            // Column Left - Form Details
                            Box(modifier = Modifier.weight(1.1f)) {
                                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                    FormInputsCard(
                                        nameState = nameState, onNameChange = { nameState = it },
                                        roleState = roleState, onRoleChange = { roleState = it },
                                        creaState = creaState, onCreaChange = { creaState = it },
                                        emailState = emailState, onEmailChange = { emailState = it },
                                        phoneState = phoneState, onPhoneChange = { phoneState = it },
                                        companyState = companyState, onCompanyChange = { companyState = it }
                                    )

                                    // Save Button
                                    Button(
                                        onClick = {
                                            viewModel.engineerName.value = nameState
                                            viewModel.engineerRole.value = roleState
                                            viewModel.engineerCrea.value = creaState
                                            viewModel.engineerEmail.value = emailState
                                            viewModel.engineerPhone.value = phoneState
                                            viewModel.engineerCompany.value = companyState
                                            isSavingSuccess = true
                                        },
                                        enabled = nameState.isNotBlank() && emailState.isNotBlank(),
                                        shape = RoundedCornerShape(16.dp),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(52.dp)
                                            .testTag("save_profile_button_wide")
                                    ) {
                                        Text("Salvar Informações", color = Color.White, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }

                            // Column Right - Secondary Utilities / Statistics & Cache Management
                            Box(modifier = Modifier.weight(0.9f)) {
                                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                    StatsDashboardCard(activeObras = allObras.size, totalRdos = allReports.size)
                                    SystemToolsCard(
                                        onBackupTrigger = {
                                            mockBackupLoading = true
                                            mockBackupSuccess = false
                                        },
                                        onClearCache = {
                                            showSnackbarMessage = "Cache do aplicativo limpo com sucesso!"
                                        }
                                    )
                                }
                            }
                        }
                    } else {
                        // Standard stacked card flow for phones
                        FormInputsCard(
                            nameState = nameState, onNameChange = { nameState = it },
                            roleState = roleState, onRoleChange = { roleState = it },
                            creaState = creaState, onCreaChange = { creaState = it },
                            emailState = emailState, onEmailChange = { emailState = it },
                            phoneState = phoneState, onPhoneChange = { phoneState = it },
                            companyState = companyState, onCompanyChange = { companyState = it }
                        )

                        // Save Button
                        Button(
                            onClick = {
                                viewModel.engineerName.value = nameState
                                viewModel.engineerRole.value = roleState
                                viewModel.engineerCrea.value = creaState
                                viewModel.engineerEmail.value = emailState
                                viewModel.engineerPhone.value = phoneState
                                viewModel.engineerCompany.value = companyState
                                isSavingSuccess = true
                            },
                            enabled = nameState.isNotBlank() && emailState.isNotBlank(),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp)
                                .testTag("save_profile_button_compact")
                        ) {
                            Text("Salvar Informações", color = Color.White, fontWeight = FontWeight.Bold)
                        }

                        StatsDashboardCard(activeObras = allObras.size, totalRdos = allReports.size)
                        
                        SystemToolsCard(
                            onBackupTrigger = {
                                mockBackupLoading = true
                                mockBackupSuccess = false
                            },
                            onClearCache = {
                                showSnackbarMessage = "Cache do aplicativo limpo com sucesso!"
                            }
                        )
                    }
                }
            }
        }

        // --- SUB DIALOGS ---
        
        // Avatar Palette Selector
        if (showAvatarPicker) {
            Dialog(onDismissRequest = { showAvatarPicker = false }) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(text = "Selecione o Aro de Estilo", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            val ringColors = listOf(
                                Color(0xFFF97316) to "Laranja",
                                Color(0xFF1976D2) to "Azul",
                                Color(0xFF2E7D32) to "Verde",
                                Color(0xFF8E24AA) to "Roxo"
                            )
                            ringColors.forEachIndexed { i, (color, name) ->
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .background(color.copy(alpha = 0.15f), CircleShape)
                                        .border(if (selectedAvatarOption == i) 3.dp else 1.dp, color, CircleShape)
                                        .clickable {
                                            selectedAvatarOption = i
                                            showAvatarPicker = false
                                        }
                                )
                            }
                        }
                    }
                }
            }
        }

        // Saving Changes Dialog State
        if (isSavingSuccess) {
            Dialog(onDismissRequest = { isSavingSuccess = false }) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .background(Color(0xFFE8F5E9), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = Color(0xFF2E7D32), modifier = Modifier.size(32.dp))
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(text = "Alterações Gravadas!", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        Text(text = "Seu cadastro corporativo no sistema foi atualizado perfeitamente com absoluto sucesso.", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 4.dp))
                        Spacer(modifier = Modifier.height(20.dp))
                        Button(
                            onClick = { isSavingSuccess = false },
                            modifier = Modifier.fillMaxWidth().height(44.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Excelente", color = Color.White)
                        }
                    }
                }
            }
        }

        // Mock Database Loading Indicator
        if (mockBackupLoading) {
            LaunchedEffect(Unit) {
                kotlinx.coroutines.delay(2000)
                mockBackupLoading = false
                mockBackupSuccess = true
            }
            Dialog(onDismissRequest = {}) {
                Card(
                    modifier = Modifier.padding(24.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(
                        modifier = Modifier.padding(24.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary, modifier = Modifier.size(24.dp))
                        Text(text = "Gerando Backup (.sqlite)...", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Mock Database Success Dialog
        if (mockBackupSuccess) {
            Dialog(onDismissRequest = { mockBackupSuccess = false }) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .background(Color(0xFFE3F2FD), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(imageVector = Icons.Default.Save, contentDescription = null, tint = Color(0xFF1976D2))
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(text = "Backup Salvo com Sucesso!", style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                        Text(text = "O arquivo dump do banco de dados Room foi compilado e compactado com sucesso em seu armazenamento.", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f), textAlign = TextAlign.Center)
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { mockBackupSuccess = false }) {
                            Text("Fechar", color = Color.White)
                        }
                    }
                }
            }
        }

        // Custom M3 Snackbar for alerts
        showSnackbarMessage?.let { msg ->
            LaunchedEffect(msg) {
                kotlinx.coroutines.delay(3000)
                showSnackbarMessage = null
            }
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .padding(16.dp)
                    .zIndex(200f)
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary),
                    elevation = CardDefaults.cardElevation(6.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(imageVector = Icons.Default.Info, contentDescription = null, tint = Color.White)
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(text = msg, color = Color.White, fontSize = 11.sp)
                    }
                }
            }
        }
    }
}

// Sub card components
@Composable
fun FormInputsCard(
    nameState: String, onNameChange: (String) -> Unit,
    roleState: String, onRoleChange: (String) -> Unit,
    creaState: String, onCreaChange: (String) -> Unit,
    emailState: String, onEmailChange: (String) -> Unit,
    phoneState: String, onPhoneChange: (String) -> Unit,
    companyState: String, onCompanyChange: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(text = "Detalhes Funcionais", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary))
            
            OutlinedTextField(
                value = nameState,
                onValueChange = onNameChange,
                label = { Text("Nome Completo") },
                leadingIcon = { Icon(imageVector = Icons.Default.Person, contentDescription = null) },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = roleState,
                onValueChange = onRoleChange,
                label = { Text("Cargo / Ocupação") },
                leadingIcon = { Icon(imageVector = Icons.Default.Work, contentDescription = null) },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = creaState,
                onValueChange = onCreaChange,
                label = { Text("CREA ou CAU") },
                leadingIcon = { Icon(imageVector = Icons.Default.FactCheck, contentDescription = null) },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = emailState,
                onValueChange = onEmailChange,
                label = { Text("E-mail") },
                leadingIcon = { Icon(imageVector = Icons.Default.Email, contentDescription = null) },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = phoneState,
                onValueChange = onPhoneChange,
                label = { Text("Telefone Corporativo") },
                leadingIcon = { Icon(imageVector = Icons.Default.Phone, contentDescription = null) },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = companyState,
                onValueChange = onCompanyChange,
                label = { Text("Empresa Atual") },
                leadingIcon = { Icon(imageVector = Icons.Default.Business, contentDescription = null) },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
fun StatsDashboardCard(activeObras: Int, totalRdos: Int) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(text = "Rendimento Geral", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary))
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Icon(imageVector = Icons.Default.Business, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(text = "$activeObras Ativas", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black))
                        Text(text = "Gestão de Obras", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    }
                }
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Icon(imageVector = Icons.Default.Description, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(text = "$totalRdos Emitidos", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black))
                        Text(text = "Relatórios Gerados", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    }
                }
            }
        }
    }
}

@Composable
fun SystemToolsCard(onBackupTrigger: () -> Unit, onClearCache: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(text = "Ações do Sistema & Cache", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary))
            
            // Storage indicators
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "Armazenamento do Banco", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                Text(text = "14.8 MB / Saudável", fontSize = 11.sp, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            }
            LinearProgressIndicator(
                progress = 0.15f,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp)),
                color = MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedButton(
                onClick = onBackupTrigger,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().height(44.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(imageVector = Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                    Text(text = "Gerar Backup (.sqlite)", fontSize = 11.sp)
                }
            }

            OutlinedButton(
                onClick = onClearCache,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().height(44.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(imageVector = Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                    Text(text = "Limpar Cache Temporário", fontSize = 11.sp)
                }
            }
        }
    }
}

// Custom Modifier helper for responsive maxheight scroll limit to avoid clipping on smaller setups
fun Modifier.maxHeightScrollOrFill(isWideLayout: Boolean): Modifier = this.then(
    if (isWideLayout) Modifier.fillMaxHeight() else Modifier.fillMaxSize()
)

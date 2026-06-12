package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.*
import androidx.lifecycle.lifecycleScope
import com.example.data.AppDatabase
import com.example.data.AppRepository
import com.example.ui.AppNavigationContainer
import com.example.ui.theme.MyApplicationTheme
import com.example.viewmodel.AppViewModel
import com.example.viewmodel.AppViewModelFactory

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Initialize Room Database & repositories
        val database = AppDatabase.getDatabase(applicationContext, lifecycleScope)
        val repository = AppRepository(database.obraDao(), database.rdoDao())
        
        // Build ViewModel via Factory
        val factory = AppViewModelFactory(repository)
        val viewModel: AppViewModel by viewModels { factory }

        setContent {
            // Keep track of theme state (starts at system default)
            val systemTheme = isSystemInDarkTheme()
            var isDarkTheme by remember { mutableStateOf(systemTheme) }

            MyApplicationTheme(darkTheme = isDarkTheme) {
                AppNavigationContainer(
                    viewModel = viewModel,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme }
                )
            }
        }
    }
}

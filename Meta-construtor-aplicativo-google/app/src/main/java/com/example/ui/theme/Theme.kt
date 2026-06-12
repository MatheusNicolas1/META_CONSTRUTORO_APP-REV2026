package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = LaranjaLogo,
    onPrimary = Color.White,
    secondary = Color.White,
    onSecondary = CinzaChumbo,
    background = DarkBackground,
    onBackground = Color.White,
    surface = DarkSurface,
    onSurface = Color(0xFFF5F6F8),
    surfaceVariant = Color(0xFF2C2D32),
    onSurfaceVariant = Color(0xFFD2D3D8),
    outline = DarkBorder
)

private val LightColorScheme = lightColorScheme(
    primary = LaranjaLogo,
    onPrimary = Color.White,
    secondary = NavyEscuro,
    onSecondary = Color.White,
    background = LightBackground,
    onBackground = NavyEscuro,
    surface = LightSurface,
    onSurface = NavyEscuro,
    surfaceVariant = LightBackground,
    onSurfaceVariant = Color(0xFF64748B), // slate-500
    outline = LightBorder
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}

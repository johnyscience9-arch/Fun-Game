package com.funoffline.app.core.theme

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

enum class AppThemeMode { AMOLED, DARK, LIGHT }

private val AmoledBlack = Color(0xFF000000)
private val AmoledSurface = Color(0xFF0B0D11)
private val AmoledSurfaceVariant = Color(0xFF141820)

private val DarkBg = Color(0xFF0C0F16)
private val DarkSurface = Color(0xFF151A24)
private val DarkSurfaceVariant = Color(0xFF1F2633)

private val LightBg = Color(0xFFF6F7F9)
private val LightSurface = Color(0xFFFFFFFF)
private val LightSurfaceVariant = Color(0xFFEBEFF5)

private val EmeraldAccent = Color(0xFF10B981)
private val AmberAccent = Color(0xFFF59E0B)
private val CrimsonAlert = Color(0xFFEF4444)

private val FunOfflineTypography = Typography(
    headlineLarge = TextStyle(fontSize = 26.sp, fontWeight = FontWeight.Bold, letterSpacing = (-0.5).sp),
    headlineMedium = TextStyle(fontSize = 21.sp, fontWeight = FontWeight.SemiBold),
    titleLarge = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.SemiBold),
    titleMedium = TextStyle(fontSize = 15.sp, fontWeight = FontWeight.Medium),
    bodyLarge = TextStyle(fontSize = 15.sp, fontWeight = FontWeight.Normal, lineHeight = 22.sp),
    bodyMedium = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Normal, lineHeight = 19.sp),
    labelMedium = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 0.2.sp),
)

@Composable
fun FunOfflineTheme(
    mode: AppThemeMode,
    content: @Composable () -> Unit
) {
    val targetBg = when (mode) {
        AppThemeMode.AMOLED -> AmoledBlack
        AppThemeMode.DARK -> DarkBg
        AppThemeMode.LIGHT -> LightBg
    }
    val targetSurface = when (mode) {
        AppThemeMode.AMOLED -> AmoledSurface
        AppThemeMode.DARK -> DarkSurface
        AppThemeMode.LIGHT -> LightSurface
    }
    val targetSurfaceVariant = when (mode) {
        AppThemeMode.AMOLED -> AmoledSurfaceVariant
        AppThemeMode.DARK -> DarkSurfaceVariant
        AppThemeMode.LIGHT -> LightSurfaceVariant
    }

    val bg by animateColorAsState(targetBg, tween(220), label = "bg")
    val surface by animateColorAsState(targetSurface, tween(220), label = "surface")
    val surfaceVar by animateColorAsState(targetSurfaceVariant, tween(220), label = "surfaceVar")

    val colorScheme = if (mode == AppThemeMode.LIGHT) {
        lightColorScheme(
            primary = Color(0xFF059669),
            onPrimary = Color.White,
            secondary = AmberAccent,
            background = bg,
            onBackground = Color(0xFF111827),
            surface = surface,
            onSurface = Color(0xFF111827),
            surfaceVariant = surfaceVar,
            onSurfaceVariant = Color(0xFF4B5563),
            outline = Color(0xFFD1D5DB),
            error = CrimsonAlert,
        )
    } else {
        darkColorScheme(
            primary = EmeraldAccent,
            onPrimary = Color.Black,
            secondary = AmberAccent,
            background = bg,
            onBackground = Color(0xFFF3F4F6),
            surface = surface,
            onSurface = Color(0xFFF3F4F6),
            surfaceVariant = surfaceVar,
            onSurfaceVariant = Color(0xFF9CA3AF),
            outline = Color(0xFF262B36),
            error = CrimsonAlert,
        )
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = FunOfflineTypography,
        content = content
    )
}

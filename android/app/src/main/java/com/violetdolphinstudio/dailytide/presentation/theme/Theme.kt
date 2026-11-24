package com.violetdolphinstudio.dailytide.presentation.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.violetdolphinstudio.dailytide.domain.model.ThemeMode

private val WarmIvoryColorScheme = lightColorScheme(
    primary = SoftViolet,
    onPrimary = Color.White,
    primaryContainer = SoftLavenderContainer,
    onPrimaryContainer = DeepStudioViolet,
    secondary = OceanBlue,
    onSecondary = Color.White,
    secondaryContainer = OceanContainer,
    onSecondaryContainer = DeepStudioViolet,
    tertiary = AquaMist,
    onTertiary = Color.White,
    tertiaryContainer = AquaContainer,
    onTertiaryContainer = DeepInk,
    background = WarmIvory,
    onBackground = DeepInk,
    surface = WarmIvoryCard,
    onSurface = DeepInk,
    surfaceVariant = WarmIvoryVariant,
    onSurfaceVariant = MutedSlate,
    outline = SoftSandOutline,
    error = GentleCoralError,
    errorContainer = GentleCoralContainer
)

private val MidnightTideColorScheme = darkColorScheme(
    primary = LuminousLavender,
    onPrimary = DeepStudioViolet,
    primaryContainer = Color(0xFF2E235C),
    onPrimaryContainer = SoftLavenderContainer,
    secondary = LuminousOcean,
    onSecondary = MidnightCanvas,
    secondaryContainer = Color(0xFF1B334A),
    onSecondaryContainer = OceanContainer,
    tertiary = LuminousAqua,
    onTertiary = MidnightCanvas,
    tertiaryContainer = Color(0xFF143C44),
    onTertiaryContainer = AquaContainer,
    background = MidnightCanvas,
    onBackground = MoonlightText,
    surface = MidnightSurface,
    onSurface = MoonlightText,
    surfaceVariant = MidnightSurfaceVariant,
    onSurfaceVariant = MoonlightMuted,
    outline = MidnightOutline,
    error = Color(0xFFF096A6),
    errorContainer = Color(0xFF4B1E29)
)

private val DailyTideShapes = Shapes(
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(20.dp),
    large = RoundedCornerShape(26.dp),
    extraLarge = RoundedCornerShape(32.dp)
)

@Composable
fun DailyTideTheme(
    themeMode: ThemeMode = ThemeMode.WARM_IVORY,
    content: @Composable () -> Unit
) {
    val useDark = when (themeMode) {
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
        ThemeMode.WARM_IVORY -> false
        ThemeMode.MIDNIGHT_TIDE -> true
    }

    MaterialTheme(
        colorScheme = if (useDark) MidnightTideColorScheme else WarmIvoryColorScheme,
        typography = DailyTideTypography,
        shapes = DailyTideShapes,
        content = content
    )
}

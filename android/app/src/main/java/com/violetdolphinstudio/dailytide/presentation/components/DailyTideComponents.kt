package com.violetdolphinstudio.dailytide.presentation.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Cloud
import androidx.compose.material.icons.outlined.Grain
import androidx.compose.material.icons.outlined.RadioButtonUnchecked
import androidx.compose.material.icons.outlined.WaterDrop
import androidx.compose.material.icons.outlined.Waves
import androidx.compose.material.icons.outlined.WbSunny
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.violetdolphinstudio.dailytide.domain.model.HabitItem
import com.violetdolphinstudio.dailytide.domain.model.HydrationDayState
import com.violetdolphinstudio.dailytide.domain.model.MeasurementUnit
import com.violetdolphinstudio.dailytide.domain.model.MoodLevel
import com.violetdolphinstudio.dailytide.domain.model.ShareCardTheme
import com.violetdolphinstudio.dailytide.domain.model.WaterVessel
import com.violetdolphinstudio.dailytide.presentation.theme.AquaMist
import com.violetdolphinstudio.dailytide.presentation.theme.DeepStudioViolet
import com.violetdolphinstudio.dailytide.presentation.theme.OceanBlue
import com.violetdolphinstudio.dailytide.presentation.theme.SoftViolet
import com.violetdolphinstudio.dailytide.presentation.theme.WarmIvory
import kotlin.math.PI
import kotlin.math.sin

@Composable
fun TideLoadingState(
    message: String = "Preparing your calm space...",
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator(
            color = MaterialTheme.colorScheme.primary,
            strokeWidth = 3.dp,
            modifier = Modifier.size(36.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun TideEmptyState(
    title: String,
    subtitle: String,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            if (actionLabel != null && onAction != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = onAction, shape = RoundedCornerShape(14.dp)) {
                    Text(actionLabel)
                }
            }
        }
    }
}

@Composable
fun TideErrorBanner(
    message: String,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.errorContainer
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.weight(1f)
            )
            TextButton(onClick = onDismiss) {
                Text("Dismiss")
            }
        }
    }
}

@Composable
fun CalmSectionHeader(
    title: String,
    trailingActionLabel: String? = null,
    onTrailingClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
        if (trailingActionLabel != null && onTrailingClick != null) {
            TextButton(onClick = onTrailingClick) {
                Text(
                    text = trailingActionLabel,
                    style = MaterialTheme.typography.labelLarge
                )
            }
        }
    }
}

@Composable
fun HydrationWaveCard(
    state: HydrationDayState,
    unit: MeasurementUnit,
    onQuickAdd: (WaterVessel) -> Unit,
    onOpenDetails: () -> Unit,
    modifier: Modifier = Modifier
) {
    val animatedFill by animateFloatAsState(
        targetValue = state.progressFraction.coerceIn(0.06f, 1f),
        animationSpec = tween(durationMillis = 650),
        label = "waterFill"
    )
    val infiniteTransition = rememberInfiniteTransition(label = "wavePhase")
    val wavePhase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = (2f * PI).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 3600, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "waveShift"
    )

    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Hydration Tide",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${unit.formatVolume(state.consumedMl)} of ${unit.formatVolume(state.goalMl)}",
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.secondary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = if (state.isGoalReached) {
                            "Daily goal met — stay comfortable and refreshed."
                        } else {
                            "Every calm sip counts toward your steady rhythm."
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                TextButton(onClick = onOpenDetails) {
                    Text("Details")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(110.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(MaterialTheme.colorScheme.tertiaryContainer)
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val width = size.width
                    val height = size.height
                    val baseY = height * (1f - animatedFill)
                    val amplitude = 10f

                    val backPath = Path().apply {
                        moveTo(0f, height)
                        lineTo(0f, baseY)
                        var x = 0f
                        while (x <= width) {
                            val y = baseY + sin((x / width) * 2f * PI.toFloat() + wavePhase) * amplitude
                            lineTo(x, y)
                            x += 12f
                        }
                        lineTo(width, height)
                        close()
                    }

                    val frontPath = Path().apply {
                        moveTo(0f, height)
                        lineTo(0f, baseY + 4f)
                        var x = 0f
                        while (x <= width) {
                            val y = baseY + 4f + sin((x / width) * 2.4f * PI.toFloat() - wavePhase * 1.2f) * (amplitude * 0.8f)
                            lineTo(x, y)
                            x += 12f
                        }
                        lineTo(width, height)
                        close()
                    }

                    drawPath(path = backPath, color = AquaMist.copy(alpha = 0.45f))
                    drawPath(
                        path = frontPath,
                        brush = Brush.verticalGradient(
                            colors = listOf(AquaMist.copy(alpha = 0.85f), OceanBlue.copy(alpha = 0.92f))
                        )
                    )
                }

                val pct = (state.progressFraction * 100).toInt().coerceAtMost(100)
                Text(
                    text = "$pct%",
                    style = MaterialTheme.typography.titleLarge,
                    color = if (animatedFill > 0.48f) Color.White else MaterialTheme.colorScheme.onTertiaryContainer,
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(14.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                state.vessels.take(3).forEach { vessel ->
                    OutlinedButton(
                        onClick = { onQuickAdd(vessel) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 10.dp)
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Outlined.WaterDrop,
                                    contentDescription = null,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "+${unit.formatVolume(vessel.volumeMl)}",
                                    style = MaterialTheme.typography.labelLarge,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                            Text(
                                text = vessel.name,
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MoodSelectorRow(
    selectedMood: MoodLevel?,
    onSelectMood: (MoodLevel) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        MoodLevel.entries.forEach { mood ->
            val isSelected = selectedMood == mood
            Surface(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(14.dp))
                    .clickable { onSelectMood(mood) },
                color = if (isSelected) {
                    MaterialTheme.colorScheme.primaryContainer
                } else {
                    MaterialTheme.colorScheme.surfaceVariant
                },
                border = if (isSelected) {
                    BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary)
                } else {
                    null
                }
            ) {
                Column(
                    modifier = Modifier.padding(vertical = 10.dp, horizontal = 4.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    val moodIcon = when (mood) {
                        MoodLevel.HEAVY -> Icons.Outlined.Grain
                        MoodLevel.LOW_TIDE -> Icons.Outlined.Cloud
                        MoodLevel.STEADY -> Icons.Outlined.Waves
                        MoodLevel.CALM -> Icons.Outlined.AutoAwesome
                        MoodLevel.RADIANT -> Icons.Outlined.WbSunny
                    }
                    Icon(
                        imageVector = moodIcon,
                        contentDescription = mood.label,
                        tint = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = mood.label,
                        style = MaterialTheme.typography.labelMedium,
                        color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}

@Composable
fun HabitCheckRow(
    habit: HabitItem,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(MaterialTheme.shapes.medium)
            .clickable(enabled = !habit.isPaused) { onToggle() },
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(
            width = 1.dp,
            color = if (habit.isCompletedToday) {
                MaterialTheme.colorScheme.primary.copy(alpha = 0.45f)
            } else {
                MaterialTheme.colorScheme.outline
            }
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = if (habit.isCompletedToday) {
                    Icons.Outlined.CheckCircle
                } else {
                    Icons.Outlined.RadioButtonUnchecked
                },
                contentDescription = if (habit.isCompletedToday) "Completed" else "Incomplete",
                tint = if (habit.isCompletedToday) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant
                },
                modifier = Modifier.size(26.dp)
            )
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = habit.title,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                if (habit.description.isNotBlank()) {
                    Text(
                        text = habit.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = if (habit.isPaused) "${habit.timeOfDay.label} · Paused" else habit.timeOfDay.label,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (habit.recentSevenDays.isNotEmpty()) {
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    habit.recentSevenDays.takeLast(5).forEach { done ->
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(
                                    if (done) MaterialTheme.colorScheme.tertiary
                                    else MaterialTheme.colorScheme.surfaceVariant
                                )
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ShareableAchievementCard(
    title: String,
    subtitle: String,
    metricLine: String,
    quoteLine: String,
    theme: ShareCardTheme,
    modifier: Modifier = Modifier
) {
    val gradient = when (theme) {
        ShareCardTheme.WARM_IVORY -> listOf(WarmIvory, Color(0xFFECE5FA))
        ShareCardTheme.OCEAN_MIST -> listOf(Color(0xFFE4F7F9), Color(0xFFD6E9F8))
        ShareCardTheme.VIOLET_DUSK -> listOf(SoftViolet, OceanBlue)
        ShareCardTheme.MIDNIGHT_TIDE -> listOf(DeepStudioViolet, Color(0xFF133A56))
    }
    val isDarkCard = theme == ShareCardTheme.VIOLET_DUSK || theme == ShareCardTheme.MIDNIGHT_TIDE
    val primaryText = if (isDarkCard) Color.White else DeepStudioViolet
    val secondaryText = if (isDarkCard) Color.White.copy(alpha = 0.84f) else Color(0xFF4A4461)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(28.dp))
            .background(Brush.linearGradient(gradient))
            .padding(28.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(
                text = "DAILY TIDE",
                style = MaterialTheme.typography.labelMedium,
                color = secondaryText,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = title,
                style = MaterialTheme.typography.headlineMedium,
                color = primaryText
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyLarge,
                color = secondaryText
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = metricLine,
                style = MaterialTheme.typography.titleLarge,
                color = primaryText
            )
            if (quoteLine.isNotBlank()) {
                Text(
                    text = "\"$quoteLine\"",
                    style = MaterialTheme.typography.bodyMedium,
                    color = secondaryText
                )
            }
            Spacer(modifier = Modifier.height(14.dp))
            Text(
                text = "Little habits. Better days. · Violet Dolphin Studio",
                style = MaterialTheme.typography.labelMedium,
                color = secondaryText.copy(alpha = 0.85f)
            )
        }
    }
}

@Composable
fun VioletDolphinBrandFooter(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Violet Dolphin Studio",
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = "Smart Tools. Healthier You. · 100% Local & Private",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

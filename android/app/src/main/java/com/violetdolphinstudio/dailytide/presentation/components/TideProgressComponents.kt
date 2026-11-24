package com.violetdolphinstudio.dailytide.presentation.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

data class GardenStageVisual(
    val stageIndex: Int,
    val name: String,
    val subtitle: String,
    val minPoints: Int,
    val nextPoints: Int?
)

fun resolveGardenStage(totalPoints: Int): GardenStageVisual {
    val stages = listOf(
        GardenStageVisual(1, "Dewy Shoreline", "Fresh seeds resting beside a calm morning tide.", 0, 120),
        GardenStageVisual(2, "Sprouting Meadow", "Tender coastal shoots rising with your daily habits.", 120, 260),
        GardenStageVisual(3, "Blooming Cove", "Soft violet and aqua blossoms opening across your shore.", 260, 450),
        GardenStageVisual(4, "Radiant Sanctuary", "Lush botanicals and thriving self-care blooms.", 450, 700),
        GardenStageVisual(5, "Violet Dolphin Oasis", "A serene coastal garden in full bloom at your pace.", 700, null)
    )
    return stages.lastOrNull { totalPoints >= it.minPoints } ?: stages.first()
}

@Composable
fun ProgressGardenCard(
    totalPoints: Int,
    todayPoints: Int,
    unlockedBadgesCount: Int,
    compact: Boolean = false,
    onClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val stage = resolveGardenStage(totalPoints)
    val stageProgress = if (stage.nextPoints == null) {
        1f
    } else {
        ((totalPoints - stage.minPoints).toFloat() / (stage.nextPoints - stage.minPoints).coerceAtLeast(1).toFloat())
            .coerceIn(0.06f, 1f)
    }

    val infiniteTransition = rememberInfiniteTransition(label = "gardenSway")
    val swayOffset by infiniteTransition.animateFloat(
        initialValue = -6f,
        targetValue = 6f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 3200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "stemSway"
    )

    val cardModifier = if (onClick != null) {
        modifier
            .fillMaxWidth()
            .clip(MaterialTheme.shapes.large)
            .clickable(onClick = onClick)
    } else {
        modifier.fillMaxWidth()
    }

    Surface(
        modifier = cardModifier,
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Progress Garden · Stage ${stage.stageIndex} of 5",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = stage.name,
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = stage.subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "$totalPoints pts",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "+$todayPoints today",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
            }

            // 100% Offline Animated Botanical Canvas
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(if (compact) 148.dp else 196.dp)
                    .clip(RoundedCornerShape(18.dp))
            ) {
                val w = size.width
                val h = size.height

                // Calm sky gradient
                drawRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFFECE6FF),
                            Color(0xFFFAF8F4),
                            Color(0xFFE0F4F7)
                        )
                    )
                )

                // Soft morning sun
                drawCircle(
                    color = Color(0x66F8E3B4),
                    radius = h * 0.22f,
                    center = Offset(w * 0.82f, h * 0.24f)
                )
                drawCircle(
                    color = Color(0xE6FFF7DF),
                    radius = h * 0.12f,
                    center = Offset(w * 0.82f, h * 0.24f)
                )

                // Shimmering shoreline wave
                val waterPath = Path().apply {
                    moveTo(0f, h * 0.72f)
                    quadraticTo(w * 0.5f, h * 0.65f + swayOffset * 0.5f, w, h * 0.71f)
                    lineTo(w, h)
                    lineTo(0f, h)
                    close()
                }
                drawPath(waterPath, color = Color(0x6636B5C4))

                // Meadow hill
                val hillPath = Path().apply {
                    moveTo(0f, h * 0.80f)
                    quadraticTo(w * 0.45f, h * 0.66f, w, h * 0.78f)
                    lineTo(w, h)
                    lineTo(0f, h)
                    close()
                }
                drawPath(hillPath, color = Color(0xFF66B399))

                // Stage 1+: Sprouts
                val sproutPositions = listOf(0.16f, 0.34f, 0.54f, 0.72f, 0.88f)
                sproutPositions.forEachIndexed { idx, frac ->
                    val baseX = w * frac
                    val baseY = h * 0.86f
                    val tipX = baseX + swayOffset * (0.6f + (idx % 2) * 0.3f)
                    val tipY = h * (0.66f - (stage.stageIndex * 0.03f))
                    drawLine(
                        color = Color(0xFF235750),
                        start = Offset(baseX, baseY),
                        end = Offset(tipX, tipY),
                        strokeWidth = 5f,
                        cap = StrokeCap.Round
                    )
                    // Stage 2+: Leaves / Buds
                    if (stage.stageIndex >= 2) {
                        drawCircle(
                            color = Color(0xFF8FD6B7),
                            radius = 9f,
                            center = Offset(tipX - 9f, (baseY + tipY) / 2f)
                        )
                        drawCircle(
                            color = Color(0xFFA4E3C5),
                            radius = 9f,
                            center = Offset(tipX + 9f, (baseY + tipY) / 2f - 4f)
                        )
                    }
                    // Stage 3+: Violet & Aqua Blossoms
                    if (stage.stageIndex >= 3) {
                        val petalColor = if (idx % 2 == 0) Color(0xFF6C4FE0) else Color(0xFF36B5C4)
                        for (a in 0 until 5) {
                            val rad = (a * 72.0) * PI / 180.0
                            drawCircle(
                                color = petalColor,
                                radius = 9f,
                                center = Offset(
                                    tipX + (cos(rad) * 11f).toFloat(),
                                    tipY + (sin(rad) * 11f).toFloat()
                                )
                            )
                        }
                        drawCircle(
                            color = Color(0xFFFDE68A),
                            radius = 6f,
                            center = Offset(tipX, tipY)
                        )
                    }
                }

                // Visual Achievement Reward Blossoms along foreground
                val bloomCount = unlockedBadgesCount.coerceAtMost(6)
                for (i in 0 until bloomCount) {
                    val bx = w * (0.14f + i * 0.145f)
                    val by = h * 0.91f
                    drawCircle(color = Color(0x55FFF7DF), radius = 14f, center = Offset(bx, by))
                    drawCircle(
                        color = if (i % 2 == 0) Color(0xFFF9D67A) else Color(0xFFA994FF),
                        radius = 7.5f,
                        center = Offset(bx, by)
                    )
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "$unlockedBadgesCount achievement blossoms planted",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = if (stage.nextPoints != null) "${(stage.nextPoints - totalPoints).coerceAtLeast(0)} pts to Stage ${stage.stageIndex + 1}" else "Max Sanctuary Reached",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                LinearProgressIndicator(
                    progress = { stageProgress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(7.dp)
                        .clip(RoundedCornerShape(6.dp))
                )
            }
        }
    }
}

@Composable
fun TideProgressRing(
    progress: Float,
    color: Color,
    trackColor: Color = MaterialTheme.colorScheme.surfaceVariant,
    size: Dp = 76.dp,
    strokeWidth: Dp = 8.dp,
    centerLabel: String = "${(progress.coerceIn(0f, 1f) * 100).toInt()}%",
    modifier: Modifier = Modifier
) {
    val animatedSweep by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f) * 360f,
        animationSpec = tween(durationMillis = 600, easing = FastOutSlowInEasing),
        label = "tideRingSweep"
    )

    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.size(size)) {
            val strokePx = strokeWidth.toPx()
            drawArc(
                color = trackColor,
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                style = Stroke(width = strokePx, cap = StrokeCap.Round)
            )
            drawArc(
                color = color,
                startAngle = -90f,
                sweepAngle = animatedSweep.coerceAtLeast(if (progress > 0f) 6f else 0f),
                useCenter = false,
                style = Stroke(width = strokePx, cap = StrokeCap.Round)
            )
        }
        Text(
            text = centerLabel,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
fun DailyProgressRingsCard(
    hydrationProgress: Float,
    habitsProgress: Float,
    selfCareProgress: Float,
    hydrationDetail: String,
    habitsDetail: String,
    selfCareDetail: String,
    onHydrationClick: () -> Unit,
    onHabitsClick: () -> Unit,
    onProgressClick: () -> Unit,
    modifier: Modifier = Modifier
) {
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
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Today's Tide Balance",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Tap any ring",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(modifier = Modifier.height(18.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                RingMetricColumn(
                    label = "Hydration",
                    detail = hydrationDetail,
                    progress = hydrationProgress,
                    color = MaterialTheme.colorScheme.tertiary,
                    onClick = onHydrationClick
                )
                RingMetricColumn(
                    label = "Habits",
                    detail = habitsDetail,
                    progress = habitsProgress,
                    color = MaterialTheme.colorScheme.primary,
                    onClick = onHabitsClick
                )
                RingMetricColumn(
                    label = "Daily Quests",
                    detail = selfCareDetail,
                    progress = selfCareProgress,
                    color = MaterialTheme.colorScheme.secondary,
                    onClick = onProgressClick
                )
            }
        }
    }
}

@Composable
private fun RingMetricColumn(
    label: String,
    detail: String,
    progress: Float,
    color: Color,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 8.dp, vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        TideProgressRing(
            progress = progress,
            color = color,
            size = 74.dp,
            strokeWidth = 7.dp
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            text = detail,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
fun ShortcutActionCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    tint: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(MaterialTheme.shapes.medium)
            .clickable(onClick = onClick),
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = tint,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Icon(
                imageVector = Icons.AutoMirrored.Outlined.KeyboardArrowRight,
                contentDescription = "Open",
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

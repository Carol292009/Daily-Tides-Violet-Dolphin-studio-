package com.violetdolphinstudio.dailytide.presentation.screens

import android.content.Intent
import android.graphics.Bitmap
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.graphics.layer.drawLayer
import androidx.compose.ui.graphics.rememberGraphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.violetdolphinstudio.dailytide.domain.model.ShareCardTheme
import com.violetdolphinstudio.dailytide.domain.model.UiState
import com.violetdolphinstudio.dailytide.presentation.components.CalmSectionHeader
import com.violetdolphinstudio.dailytide.presentation.components.ProgressGardenCard
import com.violetdolphinstudio.dailytide.presentation.components.ShareableAchievementCard
import com.violetdolphinstudio.dailytide.presentation.components.TideEmptyState
import com.violetdolphinstudio.dailytide.presentation.components.TideErrorBanner
import com.violetdolphinstudio.dailytide.presentation.components.TideLoadingState
import com.violetdolphinstudio.dailytide.presentation.components.resolveGardenStage
import android.app.Activity
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.TextButton
import com.violetdolphinstudio.dailytide.presentation.viewmodel.ProgressViewModel
import com.violetdolphinstudio.dailytide.rewards.RewardLevel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale

@Composable
fun ProgressScreen(
    viewModel: ProgressViewModel,
    onOpenShareStudio: () -> Unit,
    onOpenWeeklyRecap: () -> Unit = {},
    onOpenAchievements: () -> Unit = {}
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val feedback by viewModel.feedback.collectAsStateWithLifecycle()
    var gentleRestartActive by rememberSaveable { mutableStateOf(false) }

    when (val current = state) {
        is UiState.Loading -> TideLoadingState(modifier = Modifier.fillMaxSize())
        is UiState.Error -> TideEmptyState("Unable to load progress", current.message, modifier = Modifier.padding(20.dp))
        is UiState.Empty -> TideEmptyState(current.title, current.subtitle, modifier = Modifier.padding(20.dp))
        is UiState.Content -> {
            val (overview, settings) = current.data
            val unlockedCount = overview.badges.count { it.isUnlocked }
            val totalTidePoints = (overview.activeDaysLast21 * 35) + (unlockedCount * 40) +
                overview.last7Days.count { it.waterMl >= it.goalMl } * 20
            val todayPoints = if ((overview.last7Days.lastOrNull()?.waterMl ?: 0) > 0) 40 else 15
            val displayedStreak = if (gentleRestartActive) 1 else overview.activeDaysLast21.coerceAtMost(7).coerceAtLeast(1)

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(20.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp)
            ) {
                item {
                    CalmSectionHeader(
                        title = "Progress Garden & Consistency",
                        trailingActionLabel = "Share Card",
                        onTrailingClick = onOpenShareStudio
                    )
                }

                if (feedback != null) {
                    item { TideErrorBanner(feedback.orEmpty(), viewModel::clearFeedback) }
                }

                // 5-Stage Offline Animated Progress Garden
                item {
                    ProgressGardenCard(
                        totalPoints = totalTidePoints,
                        todayPoints = todayPoints,
                        unlockedBadgesCount = unlockedCount
                    )
                }

                // Ethical Consistency System (Positive Streak + Zero-Shame Fresh Tide Restart)
                item {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.large,
                        color = MaterialTheme.colorScheme.surface,
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                    ) {
                        Column(
                            modifier = Modifier.padding(20.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Positive Consistency System",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Text(
                                        text = "$displayedStreak-day positive flow · ${overview.activeDaysLast21} active days",
                                        style = MaterialTheme.typography.titleLarge
                                    )
                                }
                                OutlinedButton(
                                    onClick = { gentleRestartActive = true },
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("Fresh Tide")
                                }
                            }
                            Text(
                                text = "Missing a day never erases your historical achievements, Tide Points, or Progress Garden blooms. Restart calmly anytime.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Bottom
                            ) {
                                overview.last7Days.forEach { point ->
                                    val ratio = if (point.goalMl > 0) {
                                        (point.waterMl.toFloat() / point.goalMl.toFloat()).coerceIn(0.08f, 1f)
                                    } else 0.08f
                                    val dayLabel = LocalDate.ofEpochDay(point.epochDay)
                                        .dayOfWeek
                                        .getDisplayName(TextStyle.NARROW, Locale.getDefault())
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier.height(72.dp),
                                            contentAlignment = Alignment.BottomCenter
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .height((72 * ratio).dp)
                                                    .clip(RoundedCornerShape(8.dp))
                                                    .background(
                                                        if (point.waterMl >= point.goalMl) {
                                                            MaterialTheme.colorScheme.tertiary
                                                        } else {
                                                            MaterialTheme.colorScheme.primaryContainer
                                                        }
                                                    )
                                                    .padding(horizontal = 11.dp)
                                            )
                                        }
                                        Text(
                                            text = dayLabel,
                                            style = MaterialTheme.typography.labelMedium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Weekly Summary Card
                item {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.large,
                        color = MaterialTheme.colorScheme.primaryContainer
                    ) {
                        Column(
                            modifier = Modifier.padding(20.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text(
                                text = "Weekly Progress Recap",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                            val weekly = overview.latestWeeklySummary
                            if (weekly == null) {
                                Text(
                                    text = "Review hydration consistency, completed habits, mood check-ins, reflections, and personal achievements offline.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            } else {
                                Text(
                                    text = "${settings.unit.formatVolume(weekly.totalWaterMl)} sipped · ${weekly.hydrationGoalDaysMet}/7 hydration goals · $unlockedCount badges",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = weekly.insightMessage,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                Button(
                                    onClick = onOpenWeeklyRecap,
                                    shape = RoundedCornerShape(14.dp)
                                ) {
                                    Text("Open Weekly Recap")
                                }
                                OutlinedButton(
                                    onClick = onOpenShareStudio,
                                    shape = RoundedCornerShape(14.dp)
                                ) {
                                    Text("Share Card")
                                }
                            }
                        }
                    }
                }

                // Milestone Badges
                item {
                    CalmSectionHeader(
                        title = "Milestone Badges",
                        trailingActionLabel = "View All",
                        onTrailingClick = onOpenAchievements
                    )
                }

                items(overview.badges, key = { it.id }) { badge ->
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.medium,
                        color = MaterialTheme.colorScheme.surface,
                        border = BorderStroke(
                            1.dp,
                            if (badge.isUnlocked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(badge.title, style = MaterialTheme.typography.titleMedium)
                                Text(
                                    text = if (badge.isUnlocked) "Unlocked" else "${badge.progressCurrent}/${badge.progressTarget}",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = if (badge.isUnlocked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Text(
                                text = badge.description,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            LinearProgressIndicator(
                                progress = {
                                    (badge.progressCurrent.toFloat() / badge.progressTarget.coerceAtLeast(1).toFloat())
                                        .coerceIn(0f, 1f)
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(4.dp))
                            )
                        }
                    }
                }
            }
        }
    }
}

private enum class ShareCardMode(val label: String) {
    ACHIEVEMENT("Achievements"),
    MOTIVATION("Motivation"),
    WEEKLY("Weekly Progress"),
    MILESTONE("Personal Milestone")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShareCardStudioScreen(
    viewModel: ProgressViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val graphicsLayer = rememberGraphicsLayer()
    var selectedMode by rememberSaveable { mutableStateOf(ShareCardMode.ACHIEVEMENT) }
    var selectedTheme by rememberSaveable { mutableStateOf(ShareCardTheme.WARM_IVORY) }
    var shareError by rememberSaveable { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Shareable Card Studio") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { innerPadding ->
        when (val current = state) {
            is UiState.Loading -> TideLoadingState(modifier = Modifier.padding(innerPadding))
            is UiState.Error -> TideEmptyState("Unavailable", current.message, modifier = Modifier.padding(innerPadding).padding(20.dp))
            is UiState.Empty -> TideEmptyState(current.title, current.subtitle, modifier = Modifier.padding(innerPadding).padding(20.dp))
            is UiState.Content -> {
                val (overview, settings) = current.data
                val unlockedCount = overview.badges.count { it.isUnlocked }
                val totalPoints = (overview.activeDaysLast21 * 35) + (unlockedCount * 40)
                val stage = resolveGardenStage(totalPoints)
                val featuredBadge = overview.badges.lastOrNull { it.isUnlocked } ?: overview.badges.firstOrNull()

                // Strictly privacy-safe copy — NEVER includes journal entries or mood information
                val (cardTitle, cardSubtitle, cardMetric, cardQuote) = when (selectedMode) {
                    ShareCardMode.ACHIEVEMENT -> listOf(
                        featuredBadge?.title ?: "${settings.displayName}'s Calm Tide",
                        featuredBadge?.description ?: "Consistent self-care, one small wave at a time.",
                        "$unlockedCount of ${overview.badges.size} milestone badges unlocked",
                        "Small, steady steps quietly reshape entire seasons."
                    )
                    ShareCardMode.MOTIVATION -> listOf(
                        "Daily Motivation",
                        "Shared with calm intention by ${settings.displayName}",
                        "Garden Stage ${stage.stageIndex} · ${stage.name}",
                        "Quiet consistency outlasts bursts of perfection."
                    )
                    ShareCardMode.WEEKLY -> listOf(
                        "${settings.displayName}'s Weekly Progress",
                        "Hydration consistency & gentle habits — zero guilt.",
                        "${overview.latestWeeklySummary?.hydrationGoalDaysMet ?: 0}/7 hydration goals · ${overview.activeDaysLast21} active days",
                        overview.latestWeeklySummary?.insightMessage
                            ?: "Showing up calmly across the week builds lasting momentum."
                    )
                    ShareCardMode.MILESTONE -> listOf(
                        stage.name,
                        "${settings.displayName} reached Garden Stage ${stage.stageIndex} of 5",
                        "$totalPoints Tide Points · $unlockedCount achievement blossoms",
                        stage.subtitle
                    )
                }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(innerPadding)
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    if (shareError != null) {
                        TideErrorBanner(shareError.orEmpty()) { shareError = null }
                    }

                    // 4 Shareable Card Modes
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(ShareCardMode.entries) { mode ->
                            FilterChip(
                                selected = selectedMode == mode,
                                onClick = { selectedMode = mode },
                                label = { Text(mode.label) }
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .drawWithContent {
                                graphicsLayer.record {
                                    this@drawWithContent.drawContent()
                                }
                                drawLayer(graphicsLayer)
                            }
                    ) {
                        ShareableAchievementCard(
                            title = cardTitle,
                            subtitle = cardSubtitle,
                            metricLine = cardMetric,
                            quoteLine = cardQuote,
                            theme = selectedTheme
                        )
                    }

                    val rewardState by viewModel.rewardAccessState.collectAsStateWithLifecycle()
                    val visualThemesUnlocked = rewardState?.snapshotFor(RewardLevel.LEVEL_4_VISUAL_THEMES)?.isUnlocked == true
                    var showThemeAdDisclosure by remember { mutableStateOf(false) }
                    val activity = context as? Activity

                    Text("Card Theme", style = MaterialTheme.typography.titleMedium)

                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(ShareCardTheme.entries) { theme ->
                            val isUnlocked = !theme.isRewardLocked || visualThemesUnlocked
                            FilterChip(
                                selected = selectedTheme == theme,
                                onClick = {
                                    if (isUnlocked) {
                                        selectedTheme = theme
                                    } else {
                                        showThemeAdDisclosure = true
                                    }
                                },
                                label = {
                                    Text(if (isUnlocked) theme.title else "${theme.title} (Level 4 · 48h)")
                                }
                            )
                        }
                    }

                    if (showThemeAdDisclosure && activity != null) {
                        AlertDialog(
                            onDismissRequest = { showThemeAdDisclosure = false },
                            title = { Text("Unlock Additional Visual Themes?") },
                            text = {
                                Text(
                                    "Feature: Additional Visual Themes (Violet Dusk, Midnight Tide, Aurora Lagoon).\n" +
                                        "Duration: 48 hours of offline access.\n\n" +
                                        "Watching this Google rewarded video is completely optional. Warm Ivory and Ocean Mist remain free forever."
                                )
                            },
                            confirmButton = {
                                Button(
                                    onClick = {
                                        showThemeAdDisclosure = false
                                        viewModel.startOptionalVisualThemesAd(activity)
                                    }
                                ) {
                                    Text("Watch Optional Ad")
                                }
                            },
                            dismissButton = {
                                TextButton(onClick = { showThemeAdDisclosure = false }) {
                                    Text("Keep Free Themes")
                                }
                            }
                        )
                    }

                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant
                    ) {
                        Text(
                            text = "Privacy guarantee: Generated 100% locally. Private journal entries, self-appreciation notes, and mood check-ins are never included or uploaded.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(14.dp)
                        )
                    }

                    Button(
                        onClick = {
                            scope.launch {
                                try {
                                    val bitmap = graphicsLayer.toImageBitmap().asAndroidBitmap()
                                    val uri = withContext(Dispatchers.IO) {
                                        val dir = File(context.cacheDir, "shared_cards").apply { mkdirs() }
                                        val file = File(dir, "daily_tide_${selectedMode.name.lowercase()}_${System.currentTimeMillis()}.png")
                                        FileOutputStream(file).use { out ->
                                            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                                        }
                                        FileProvider.getUriForFile(
                                            context,
                                            "${context.packageName}.fileprovider",
                                            file
                                        )
                                    }
                                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                        type = "image/png"
                                        putExtra(Intent.EXTRA_STREAM, uri)
                                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                    }
                                    context.startActivity(Intent.createChooser(shareIntent, "Share Daily Tide Card"))
                                } catch (e: Exception) {
                                    shareError = "Unable to export card image locally."
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Text("Share ${selectedMode.label} Card")
                    }
                }
            }
        }
    }
}

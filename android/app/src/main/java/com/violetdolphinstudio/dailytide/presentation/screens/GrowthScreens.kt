package com.violetdolphinstudio.dailytide.presentation.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.violetdolphinstudio.dailytide.BuildConfig
import com.violetdolphinstudio.dailytide.R
import com.violetdolphinstudio.dailytide.domain.model.UiState
import com.violetdolphinstudio.dailytide.presentation.components.TideEmptyState
import com.violetdolphinstudio.dailytide.presentation.components.TideErrorBanner
import com.violetdolphinstudio.dailytide.presentation.components.TideLoadingState
import com.violetdolphinstudio.dailytide.presentation.components.TideProgressRing
import android.app.Activity
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.TextButton
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import com.violetdolphinstudio.dailytide.ads.RewardedAdUiState
import com.violetdolphinstudio.dailytide.presentation.viewmodel.ProgressViewModel
import com.violetdolphinstudio.dailytide.presentation.viewmodel.SettingsViewModel
import com.violetdolphinstudio.dailytide.rewards.DefaultRewardAccessManager
import com.violetdolphinstudio.dailytide.rewards.FREE_LEVEL_FEATURES
import com.violetdolphinstudio.dailytide.rewards.RewardAccessStatus
import com.violetdolphinstudio.dailytide.rewards.RewardLevel
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AchievementCollectionScreen(
    viewModel: ProgressViewModel,
    onOpenShareStudio: () -> Unit,
    onBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Achievement Collection") },
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
            is UiState.Content -> {
                val badges = current.data.first.badges
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding),
                    contentPadding = PaddingValues(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    item {
                        Text(
                            text = "${badges.count { it.isUnlocked }} of ${badges.size} milestones unlocked",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    items(badges, key = { it.id }) { badge ->
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.large,
                            color = MaterialTheme.colorScheme.surface,
                            border = BorderStroke(
                                1.dp,
                                if (badge.isUnlocked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(18.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                TideProgressRing(
                                    progress = badge.progressCurrent.toFloat() / badge.progressTarget.coerceAtLeast(1).toFloat(),
                                    color = if (badge.isUnlocked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.tertiary,
                                    size = 64.dp,
                                    strokeWidth = 6.dp,
                                    centerLabel = if (badge.isUnlocked) "Done" else "${badge.progressCurrent}/${badge.progressTarget}"
                                )
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(badge.category, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Text(badge.title, style = MaterialTheme.typography.titleMedium)
                                    Text(badge.description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    if (badge.isUnlocked) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        OutlinedButton(onClick = onOpenShareStudio, shape = RoundedCornerShape(12.dp)) {
                                            Text("Share Badge Card")
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else -> TideEmptyState("Unavailable", "Could not load achievements.", modifier = Modifier.padding(innerPadding).padding(20.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WeeklyRecapScreen(
    viewModel: ProgressViewModel,
    onOpenShareStudio: () -> Unit,
    onBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Weekly Tide Recap") },
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
            is UiState.Content -> {
                val (overview, settings) = current.data
                val summary = overview.latestWeeklySummary
                val unlockedBadgesCount = overview.badges.count { it.isUnlocked }

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding),
                    contentPadding = PaddingValues(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    if (summary == null) {
                        item {
                            TideEmptyState(
                                title = "Your Weekly Tide is ready to compile",
                                subtitle = "Generate a calm local report of hydration consistency, completed habits, mood check-ins, reflections, and achievements.",
                                actionLabel = "Compile Weekly Recap",
                                onAction = viewModel::refreshWeeklySummary
                            )
                        }
                    } else {
                        item {
                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = MaterialTheme.shapes.extraLarge,
                                color = MaterialTheme.colorScheme.primaryContainer
                            ) {
                                Column(
                                    modifier = Modifier.padding(22.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text("7-DAY WEEKLY REPORT", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                                    Text(summary.insightMessage, style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.onPrimaryContainer)
                                }
                            }
                        }

                        // 5 Pillars of Weekly Recap
                        val pillars = listOf(
                            Triple("1 · Hydration Consistency", "${summary.hydrationGoalDaysMet} / 7 days met", "${settings.unit.formatVolume(summary.totalWaterMl)} logged locally this week"),
                            Triple("2 · Completed Habits", "${(summary.habitCompletionRate * 100).toInt()}% steadiness", summary.topHabitTitle?.let { "Steadiest habit: $it" } ?: "Gentle daily routine flow"),
                            Triple("3 · Mood Check-Ins (Private)", summary.dominantMood?.label ?: "Balanced", "Most frequent mood recorded on this device"),
                            Triple("4 · Reflection Entries (Private)", if (summary.highlightAppreciation != null) "Captured with care" else "Open space", summary.highlightAppreciation?.let { "\"$it\"" } ?: "Your private reflections stay strictly on-device"),
                            Triple("5 · Personal Achievements", "$unlockedBadgesCount badges · ${summary.challengesCompleted} rituals", "Every milestone plants a permanent blossom in your Progress Garden")
                        )

                        items(pillars) { (heading, headline, detail) ->
                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = MaterialTheme.shapes.large,
                                color = MaterialTheme.colorScheme.surface,
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                            ) {
                                Column(
                                    modifier = Modifier.padding(18.dp),
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text(heading, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                                    Text(headline, style = MaterialTheme.typography.titleLarge)
                                    Text(detail, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }

                        item {
                            Text(
                                text = "Private journal entries and mood data are never included when creating a shareable weekly card.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        item {
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                                OutlinedButton(
                                    onClick = viewModel::refreshWeeklySummary,
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(14.dp)
                                ) {
                                    Text("Refresh Recap")
                                }
                                Button(
                                    onClick = onOpenShareStudio,
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(14.dp)
                                ) {
                                    Text("Share Weekly Card")
                                }
                            }
                        }
                    }
                }
            }
            else -> TideEmptyState("Unavailable", "Could not load weekly recap.", modifier = Modifier.padding(innerPadding).padding(20.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RewardUnlockScreen(
    viewModel: SettingsViewModel,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val activity = context as? Activity
    val rewardState by viewModel.rewardAccessState.collectAsStateWithLifecycle()
    val adUiState by viewModel.adUiState.collectAsStateWithLifecycle()
    val consentState by viewModel.consentState.collectAsStateWithLifecycle()
    val feedback by viewModel.feedback.collectAsStateWithLifecycle()
    var pendingDisclosureLevel by remember { mutableStateOf<RewardLevel?>(null) }

    LaunchedEffect(Unit) {
        while (true) {
            viewModel.refreshRewardExpirations()
            delay(1_000L)
        }
    }

    val dateFormatter = SimpleDateFormat("MMM d, HH:mm", Locale.getDefault())
    fun formatTs(millis: Long?): String = if (millis == null) "—" else dateFormatter.format(Date(millis))

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Rewarded Access") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { innerPadding ->
        val current = rewardState
        if (current == null) {
            TideLoadingState(modifier = Modifier.padding(innerPadding))
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentPadding = PaddingValues(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                if (feedback != null) {
                    item { TideErrorBanner(feedback.orEmpty(), viewModel::clearFeedback) }
                }

                // LIVE ADMOB REWARDED VIDEO OUTCOME BANNER (Loading / Failed / Dismissed / Earned)
                when (val adState = adUiState) {
                    is RewardedAdUiState.Loading -> item {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.large,
                            color = MaterialTheme.colorScheme.secondaryContainer
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                CircularProgressIndicator(modifier = Modifier.size(22.dp))
                                Text(
                                    "Loading optional rewarded video for ${adState.level.title}...",
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                        }
                    }
                    is RewardedAdUiState.Failed -> item {
                        TideErrorBanner(adState.userMessage, viewModel::resetAdUiState)
                    }
                    is RewardedAdUiState.DismissedWithoutReward -> item {
                        TideErrorBanner(adState.userMessage, viewModel::resetAdUiState)
                    }
                    is RewardedAdUiState.RewardEarned -> item {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.large,
                            color = MaterialTheme.colorScheme.primaryContainer
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        "${adState.level.title} Unlocked",
                                        style = MaterialTheme.typography.titleSmall,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Text(
                                        "Saved locally for offline use until ${formatTs(adState.expiresAtMillis)}.",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                                TextButton(onClick = viewModel::resetAdUiState) {
                                    Text("Dismiss")
                                }
                            }
                        }
                    }
                    else -> Unit
                }

                // FREE LEVEL — NEVER LOCKED BEHIND ADS
                item {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.large,
                        color = MaterialTheme.colorScheme.primaryContainer
                    ) {
                        Column(
                            modifier = Modifier.padding(20.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                "Free Level · Permanently Unlocked",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                "Core self-care tools never require advertisements and always work offline:",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                            FREE_LEVEL_FEATURES.forEach { feat ->
                                Text(
                                    text = "• ${feat.title}: ${feat.description}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                        }
                    }
                }

                // GOOGLE UMP PRIVACY CONSENT CARD
                item {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.large,
                        color = MaterialTheme.colorScheme.surface,
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                if (BuildConfig.DEBUG) "Ad Privacy Consent (Debug Test Mode)" else "Ad Privacy Preferences",
                                style = MaterialTheme.typography.titleSmall
                            )
                            Text(
                                "Consent Status: ${consentState.statusLabel}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            if (BuildConfig.DEBUG) {
                                Text(
                                    "Debug Test Unit ID: ${viewModel.activeRewardedAdUnitId}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            if (activity != null) {
                                OutlinedButton(
                                    onClick = { viewModel.openAdPrivacyOptions(activity) },
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("Manage Ad Privacy Choices")
                                }
                            }
                        }
                    }
                }

                // LEVELS 1 - 4 TIMED REWARD ACCESS
                items(current.levels) { snapshot ->
                    val liveRemaining = if (snapshot.expiresAtMillis != null) {
                        val ms = (snapshot.expiresAtMillis - System.currentTimeMillis()).coerceAtLeast(0L)
                        if (ms > 0L) DefaultRewardAccessManager.formatRemainingDuration(ms) else "Expired"
                    } else {
                        "Locked"
                    }
                    val isBusy = adUiState is RewardedAdUiState.Loading || adUiState is RewardedAdUiState.Showing

                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.large,
                        color = MaterialTheme.colorScheme.surface,
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    "Level ${snapshot.level.levelNumber} · ${snapshot.level.durationHours}h Access",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    snapshot.status.name,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = when (snapshot.status) {
                                        RewardAccessStatus.UNLOCKED -> MaterialTheme.colorScheme.secondary
                                        RewardAccessStatus.EXPIRED -> MaterialTheme.colorScheme.error
                                        RewardAccessStatus.LOCKED -> MaterialTheme.colorScheme.onSurfaceVariant
                                    }
                                )
                            }
                            Text(snapshot.level.title, style = MaterialTheme.typography.titleMedium)
                            Text(
                                snapshot.level.description,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                "Remaining: $liveRemaining",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.secondary
                            )
                            Text(
                                "Unlocked: ${formatTs(snapshot.unlockedAtMillis)}  ·  Expires: ${formatTs(snapshot.expiresAtMillis)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Button(
                                    onClick = { pendingDisclosureLevel = snapshot.level },
                                    enabled = !isBusy && activity != null,
                                    shape = RoundedCornerShape(14.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text(
                                        if (snapshot.isUnlocked) {
                                            "Renew +${snapshot.level.durationHours}h (Optional Ad)"
                                        } else {
                                            "Unlock for ${snapshot.level.durationHours}h (Optional Ad)"
                                        }
                                    )
                                }
                                if (BuildConfig.DEBUG && snapshot.isUnlocked) {
                                    OutlinedButton(
                                        onClick = { viewModel.simulateExpirationForTesting(snapshot.level) },
                                        shape = RoundedCornerShape(14.dp)
                                    ) {
                                        Text("Expire")
                                    }
                                }
                            }
                        }
                    }
                }

                // REWARD HISTORY
                item {
                    Text(
                        "Reward History (${current.history.size})",
                        style = MaterialTheme.typography.titleMedium
                    )
                }

                if (current.history.isEmpty()) {
                    item {
                        TideEmptyState(
                            title = "No reward history yet",
                            subtitle = "Choose any optional level above to review pre-ad details and watch a rewarded video."
                        )
                    }
                } else {
                    items(current.history.take(20)) { record ->
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.medium,
                            color = MaterialTheme.colorScheme.surfaceVariant
                        ) {
                            Column(
                                modifier = Modifier.padding(14.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    "${record.eventType.name} · Level ${record.level.levelNumber} (${record.level.title})",
                                    style = MaterialTheme.typography.labelLarge
                                )
                                Text(
                                    "Unlocked ${formatTs(record.unlockedAtMillis)} → Expires ${formatTs(record.expiresAtMillis)} (${record.verificationSource.name})",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // EXPLICIT PRE-AD DISCLOSURE DIALOG (Feature, Duration, and Optional Notice)
    val disclosureLevel = pendingDisclosureLevel
    if (disclosureLevel != null && activity != null) {
        AlertDialog(
            onDismissRequest = { pendingDisclosureLevel = null },
            title = { Text("Watch Optional Rewarded Ad?") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Feature to unlock: ${disclosureLevel.title}")
                    Text("Access duration: ${disclosureLevel.durationHours} hours (works offline after unlocking).")
                    Text(
                        "Watching this advertisement is completely optional. Rewards are granted only after watching the full video — if you close early or the ad cannot load, no reward is granted and all free self-care features remain ready to use.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        pendingDisclosureLevel = null
                        viewModel.startOptionalRewardedAd(activity, disclosureLevel)
                    }
                ) {
                    Text("Watch Optional Ad")
                }
            },
            dismissButton = {
                TextButton(onClick = { pendingDisclosureLevel = null }) {
                    Text("Keep Using Free Features")
                }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AboutStudioScreen(
    onBack: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("About Violet Dolphin Studio") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = PaddingValues(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            item {
                Image(
                    painter = painterResource(id = R.drawable.ic_daily_tide_brand),
                    contentDescription = "Daily Tide by Violet Dolphin Studio",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(112.dp)
                        .clip(RoundedCornerShape(28.dp))
                )
            }
            item {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Violet Dolphin Studio", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Build · Train · Grow", style = MaterialTheme.typography.titleMedium)
                    Text("Smart Tools. Healthier You.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            item {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = MaterialTheme.shapes.large,
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                ) {
                    Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Our Calm Craft Promise", style = MaterialTheme.typography.titleMedium)
                        Text(
                            text = "Daily Tide was crafted to feel like a peaceful corner of your day—never a noisy feed. Every sip, reflection, mood check-in, and habit is stored strictly on your device using Android Room and DataStore.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "Version ${BuildConfig.VERSION_NAME} (Build ${BuildConfig.VERSION_CODE}) · Offline-First · Zero Cloud Accounts",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary,
                            textAlign = TextAlign.Start
                        )
                    }
                }
            }
            item {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = MaterialTheme.shapes.large,
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "Buy Me a Coffee · Help This Developer",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary,
                            textAlign = TextAlign.Center
                        )
                        Text(
                            text = "Daily Tide is built independently with care. If it brings a calmer rhythm to your day, you can optionally support the developer using any UPI app.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                        Image(
                            painter = painterResource(id = R.drawable.qr_support_developer),
                            contentDescription = "Scan QR to support developer Khushal via UPI",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier
                                .size(220.dp)
                                .clip(RoundedCornerShape(20.dp))
                        )
                        Text(
                            text = "UPI ID: khushalnyk679@okaxis · Khushal",
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
        }
    }
}

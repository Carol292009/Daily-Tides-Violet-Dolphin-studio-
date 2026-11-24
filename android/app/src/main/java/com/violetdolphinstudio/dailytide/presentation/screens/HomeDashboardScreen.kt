package com.violetdolphinstudio.dailytide.presentation.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Book
import androidx.compose.material.icons.outlined.EmojiEvents
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Mood
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Spa
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.violetdolphinstudio.dailytide.domain.model.ChallengeStatus
import com.violetdolphinstudio.dailytide.domain.model.UiState
import com.violetdolphinstudio.dailytide.presentation.components.CalmSectionHeader
import com.violetdolphinstudio.dailytide.presentation.components.DailyProgressRingsCard
import com.violetdolphinstudio.dailytide.presentation.components.HabitCheckRow
import com.violetdolphinstudio.dailytide.presentation.components.HydrationWaveCard
import com.violetdolphinstudio.dailytide.presentation.components.ProgressGardenCard
import com.violetdolphinstudio.dailytide.presentation.components.ShortcutActionCard
import com.violetdolphinstudio.dailytide.presentation.components.TideEmptyState
import com.violetdolphinstudio.dailytide.presentation.components.TideErrorBanner
import com.violetdolphinstudio.dailytide.presentation.components.TideLoadingState
import com.violetdolphinstudio.dailytide.presentation.viewmodel.TodayViewModel
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter

@Composable
fun HomeDashboardScreen(
    viewModel: TodayViewModel,
    onOpenHydration: () -> Unit,
    onOpenMoodCheckIn: () -> Unit,
    onOpenJournal: () -> Unit,
    onOpenMotivation: () -> Unit,
    onOpenHabits: () -> Unit,
    onOpenDailyChallenges: () -> Unit,
    onOpenAchievements: () -> Unit,
    onOpenProgress: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val feedback by viewModel.feedbackMessage.collectAsStateWithLifecycle()

    when (val current = state) {
        is UiState.Loading -> TideLoadingState(modifier = Modifier.fillMaxSize())
        is UiState.Error -> TideEmptyState("Unable to load dashboard", current.message, modifier = Modifier.padding(24.dp))
        is UiState.Empty -> TideEmptyState(current.title, current.subtitle, modifier = Modifier.padding(24.dp))
        is UiState.Content -> {
            val data = current.data
            val greeting = when (LocalTime.now().hour) {
                in 5..11 -> "Good morning"
                in 12..17 -> "Good afternoon"
                else -> "Good evening"
            }
            val dateLabel = LocalDate.now().format(DateTimeFormatter.ofPattern("EEEE, MMMM d"))

            val activeHabits = data.habits.filter { !it.isPaused }
            val completedHabits = activeHabits.count { it.isCompletedToday }
            val habitsProgress = if (activeHabits.isEmpty()) 0f else completedHabits.toFloat() / activeHabits.size.toFloat()

            val careCompleted = (if (data.latestMood != null) 1 else 0) +
                (if (data.challenge?.status == ChallengeStatus.COMPLETED) 1 else 0) +
                (if (data.hydration.isGoalReached) 1 else 0)
            val selfCareProgress = careCompleted.toFloat() / 3f

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp)
            ) {
                // Friendly personalized greeting + Today's date
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = dateLabel,
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "$greeting, ${data.settings.displayName}",
                                style = MaterialTheme.typography.headlineMedium,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                        }
                        IconButton(onClick = onOpenSettings) {
                            Icon(Icons.Outlined.Settings, contentDescription = "Settings")
                        }
                    }
                }

                if (feedback != null) {
                    item { TideErrorBanner(feedback.orEmpty(), viewModel::clearFeedback) }
                }

                // Visually attractive Daily Progress section (3 interactive rings)
                item {
                    DailyProgressRingsCard(
                        hydrationProgress = data.hydration.progressFraction,
                        habitsProgress = habitsProgress,
                        selfCareProgress = selfCareProgress,
                        hydrationDetail = data.settings.unit.formatVolume(data.hydration.consumedMl),
                        habitsDetail = "$completedHabits/${activeHabits.size} done",
                        selfCareDetail = "$careCompleted/3 rituals",
                        onHydrationClick = onOpenHydration,
                        onHabitsClick = onOpenHabits,
                        onProgressClick = onOpenProgress
                    )
                }

                // Daily Motivational Message (tap to open full Motivation screen)
                data.affirmation?.let { affirmation ->
                    item {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(MaterialTheme.shapes.large)
                                .clickable(onClick = onOpenMotivation),
                            shape = MaterialTheme.shapes.large,
                            color = MaterialTheme.colorScheme.primaryContainer
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 20.dp, vertical = 18.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Daily Motivation",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = affirmation.text,
                                        style = MaterialTheme.typography.titleMedium,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                                IconButton(onClick = { viewModel.toggleAffirmationFavorite(affirmation) }) {
                                    Icon(
                                        imageVector = if (affirmation.isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                                        contentDescription = "Save affirmation",
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                }

                // Offline Progress Garden Preview
                item {
                    val todayPts = (if (data.hydration.consumedMl > 0) 20 else 0) +
                        (completedHabits * 15) +
                        (if (data.latestMood != null) 15 else 0) +
                        (if (data.challenge?.status == ChallengeStatus.COMPLETED) 20 else 0)
                    ProgressGardenCard(
                        totalPoints = 140 + todayPts,
                        todayPoints = todayPts,
                        unlockedBadgesCount = 2 + (if (data.hydration.isGoalReached) 1 else 0),
                        compact = true,
                        onClick = onOpenProgress
                    )
                }

                // Hydration Progress Wave Card
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        HydrationWaveCard(
                            state = data.hydration,
                            unit = data.settings.unit,
                            onQuickAdd = viewModel::quickLogWater,
                            onOpenDetails = onOpenHydration
                        )
                        if (data.lastLoggedWaterId != null) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End
                            ) {
                                TextButton(onClick = viewModel::undoLastWaterLog) {
                                    Text("Undo last sip")
                                }
                            }
                        }
                    }
                }

                // Quick Mindful Shortcuts: Mood Check-in & Daily Reflection
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        CalmSectionHeader(title = "Mindful Check-Ins")
                        ShortcutActionCard(
                            title = "Mood Check-In",
                            subtitle = data.latestMood?.let {
                                "Feeling ${it.mood.label} · ${it.mood.gentleSummary}"
                            } ?: "Pause for 10 seconds and notice how your tide feels today.",
                            icon = Icons.Outlined.Mood,
                            tint = MaterialTheme.colorScheme.primary,
                            onClick = onOpenMoodCheckIn
                        )
                        ShortcutActionCard(
                            title = "Daily Reflection & Appreciation",
                            subtitle = data.appreciationPrompt?.promptText
                                ?: "Write privately in your Warm Ivory journal.",
                            icon = Icons.Outlined.Book,
                            tint = MaterialTheme.colorScheme.secondary,
                            onClick = onOpenJournal
                        )
                    }
                }

                // Today's Self-Care Tasks (Daily Quests + Active Habits)
                item {
                    CalmSectionHeader(
                        title = "Today's Self-Care Tasks",
                        trailingActionLabel = "All Habits",
                        onTrailingClick = onOpenHabits
                    )
                }

                item {
                    ShortcutActionCard(
                        title = "Daily Self-Care Quests",
                        subtitle = "5 gentle daily quests (wake-up water, 3 appreciations, 5-min reflection, habit & positive thought) to grow your garden.",
                        icon = Icons.Outlined.Spa,
                        tint = MaterialTheme.colorScheme.tertiary,
                        onClick = onOpenDailyChallenges
                    )
                }

                if (data.habits.isEmpty()) {
                    item {
                        TideEmptyState(
                            title = "Your habit space is calm and open",
                            subtitle = "Add a gentle routine whenever you are ready.",
                            actionLabel = "Add Habit",
                            onAction = onOpenHabits
                        )
                    }
                } else {
                    items(data.habits.take(4), key = { it.id }) { habit ->
                        HabitCheckRow(
                            habit = habit,
                            onToggle = { viewModel.toggleHabit(habit.id) }
                        )
                    }
                }

                // Achievement Progress Shortcut
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        CalmSectionHeader(
                            title = "Achievement Progress",
                            trailingActionLabel = "Collection",
                            onTrailingClick = onOpenAchievements
                        )
                        ShortcutActionCard(
                            title = "Your Milestone Badges & Weekly Recap",
                            subtitle = "Celebrate quiet consistency and craft shareable cards offline.",
                            icon = Icons.Outlined.EmojiEvents,
                            tint = MaterialTheme.colorScheme.primary,
                            onClick = onOpenAchievements
                        )
                        ShortcutActionCard(
                            title = "Daily Affirmations Sanctuary",
                            subtitle = "Explore grounding and uplifting affirmations anytime.",
                            icon = Icons.Outlined.AutoAwesome,
                            tint = MaterialTheme.colorScheme.secondary,
                            onClick = onOpenMotivation
                        )
                    }
                }

                item { Spacer(modifier = Modifier.height(12.dp)) }
            }
        }
    }
}

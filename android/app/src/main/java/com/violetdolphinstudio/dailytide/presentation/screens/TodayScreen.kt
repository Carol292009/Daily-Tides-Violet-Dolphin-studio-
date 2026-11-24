package com.violetdolphinstudio.dailytide.presentation.screens

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.violetdolphinstudio.dailytide.domain.model.ChallengeStatus
import com.violetdolphinstudio.dailytide.domain.model.UiState
import com.violetdolphinstudio.dailytide.presentation.components.CalmSectionHeader
import com.violetdolphinstudio.dailytide.presentation.components.HabitCheckRow
import com.violetdolphinstudio.dailytide.presentation.components.HydrationWaveCard
import com.violetdolphinstudio.dailytide.presentation.components.MoodSelectorRow
import com.violetdolphinstudio.dailytide.presentation.components.TideEmptyState
import com.violetdolphinstudio.dailytide.presentation.components.TideErrorBanner
import com.violetdolphinstudio.dailytide.presentation.components.TideLoadingState
import com.violetdolphinstudio.dailytide.presentation.viewmodel.TodayViewModel
import java.time.LocalTime

@Composable
fun TodayScreen(
    viewModel: TodayViewModel,
    onOpenHydrationDetail: () -> Unit,
    onOpenHabits: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val feedback by viewModel.feedbackMessage.collectAsStateWithLifecycle()
    var appreciationDraft by rememberSaveable { mutableStateOf("") }

    when (val current = state) {
        is UiState.Loading -> TideLoadingState(modifier = Modifier.fillMaxSize())
        is UiState.Error -> BoxErrorFallback(current.message)
        is UiState.Empty -> TideEmptyState(current.title, current.subtitle, modifier = Modifier.padding(20.dp))
        is UiState.Content -> {
            val data = current.data
            val greeting = when (LocalTime.now().hour) {
                in 5..11 -> "Good morning"
                in 12..17 -> "Good afternoon"
                else -> "Good evening"
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp)
            ) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "$greeting, ${data.settings.displayName}",
                                style = MaterialTheme.typography.headlineMedium,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                            Text(
                                text = "Little habits. Better days.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        IconButton(onClick = onOpenSettings) {
                            Icon(
                                imageVector = Icons.Outlined.Settings,
                                contentDescription = "Settings"
                            )
                        }
                    }
                }

                if (feedback != null) {
                    item {
                        TideErrorBanner(
                            message = feedback.orEmpty(),
                            onDismiss = viewModel::clearFeedback
                        )
                    }
                }

                // Daily Affirmation
                data.affirmation?.let { affirmation ->
                    item {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
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
                                        text = "Daily Affirmation",
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
                                        imageVector = if (affirmation.isFavorite) {
                                            Icons.Filled.Favorite
                                        } else {
                                            Icons.Outlined.FavoriteBorder
                                        },
                                        contentDescription = "Save affirmation",
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                }

                // Hydration Wave Card + Undo strip
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        HydrationWaveCard(
                            state = data.hydration,
                            unit = data.settings.unit,
                            onQuickAdd = viewModel::quickLogWater,
                            onOpenDetails = onOpenHydrationDetail
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

                // Daily Mood Check-In
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
                            Text(
                                text = "How does your tide feel right now?",
                                style = MaterialTheme.typography.titleMedium
                            )
                            MoodSelectorRow(
                                selectedMood = data.latestMood?.mood,
                                onSelectMood = { mood -> viewModel.logMood(mood) }
                            )
                            data.latestMood?.let { mood ->
                                Text(
                                    text = mood.mood.gentleSummary,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }

                // Daily Self-Care Challenge
                data.challenge?.let { challengeState ->
                    item {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.large,
                            color = MaterialTheme.colorScheme.surface,
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Column(
                                modifier = Modifier.padding(20.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Today's Self-Care Challenge · ${challengeState.challenge.durationMinutes} min",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.secondary
                                    )
                                    if (challengeState.status != ChallengeStatus.COMPLETED) {
                                        IconButton(onClick = { viewModel.swapDailyChallenge(useMockReward = challengeState.swapsUsed >= 1) }) {
                                            Icon(
                                                imageVector = Icons.Outlined.Refresh,
                                                contentDescription = "Swap challenge"
                                            )
                                        }
                                    }
                                }
                                Text(
                                    text = challengeState.challenge.title,
                                    style = MaterialTheme.typography.titleMedium
                                )
                                Text(
                                    text = challengeState.challenge.description,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                if (challengeState.status == ChallengeStatus.COMPLETED) {
                                    Text(
                                        text = "Completed with care today.",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                } else {
                                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                        Button(
                                            onClick = viewModel::completeDailyChallenge,
                                            shape = RoundedCornerShape(14.dp)
                                        ) {
                                            Text("Mark Done")
                                        }
                                        if (challengeState.swapsUsed >= 1) {
                                            OutlinedButton(
                                                onClick = { viewModel.swapDailyChallenge(useMockReward = true) },
                                                shape = RoundedCornerShape(14.dp)
                                            ) {
                                                Text("Reward Swap")
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Today's Habits
                item {
                    CalmSectionHeader(
                        title = "Today's Habits",
                        trailingActionLabel = "Manage",
                        onTrailingClick = onOpenHabits
                    )
                }

                if (data.habits.isEmpty()) {
                    item {
                        TideEmptyState(
                            title = "Your habit list is calm and open",
                            subtitle = "Add a gentle routine whenever you feel ready.",
                            actionLabel = "Add Habit",
                            onAction = onOpenHabits
                        )
                    }
                } else {
                    items(data.habits, key = { it.id }) { habit ->
                        HabitCheckRow(
                            habit = habit,
                            onToggle = { viewModel.toggleHabit(habit.id) }
                        )
                    }
                }

                // Daily Self-Appreciation Question
                data.appreciationPrompt?.let { prompt ->
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
                                    Text(
                                        text = "Self-Appreciation · ${prompt.category}",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    TextButton(onClick = viewModel::swapPrompt) {
                                        Text("Another question")
                                    }
                                }
                                Text(
                                    text = prompt.promptText,
                                    style = MaterialTheme.typography.titleMedium
                                )
                                OutlinedTextField(
                                    value = appreciationDraft,
                                    onValueChange = { appreciationDraft = it },
                                    placeholder = { Text("Take a moment to appreciate yourself...") },
                                    modifier = Modifier.fillMaxWidth(),
                                    minLines = 2,
                                    shape = RoundedCornerShape(14.dp)
                                )
                                Button(
                                    onClick = {
                                        if (appreciationDraft.isNotBlank()) {
                                            viewModel.saveAppreciationAnswer(appreciationDraft)
                                            appreciationDraft = ""
                                        }
                                    },
                                    enabled = appreciationDraft.isNotBlank(),
                                    shape = RoundedCornerShape(14.dp)
                                ) {
                                    Text("Save to Vault")
                                }
                            }
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(16.dp)) }
            }
        }
    }
}

@Composable
private fun BoxErrorFallback(message: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center
    ) {
        TideEmptyState(
            title = "Something paused unexpectedly",
            subtitle = message
        )
    }
}

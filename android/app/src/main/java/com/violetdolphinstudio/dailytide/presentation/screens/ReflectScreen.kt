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
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.violetdolphinstudio.dailytide.domain.model.AppreciationPrompt
import com.violetdolphinstudio.dailytide.domain.model.UiState
import com.violetdolphinstudio.dailytide.presentation.components.TideEmptyState
import com.violetdolphinstudio.dailytide.presentation.components.TideErrorBanner
import com.violetdolphinstudio.dailytide.presentation.components.TideLoadingState
import com.violetdolphinstudio.dailytide.presentation.viewmodel.ReflectViewModel
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReflectScreen(
    viewModel: ReflectViewModel
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val searchQuery by viewModel.searchQuery.collectAsStateWithLifecycle()
    val feedback by viewModel.feedback.collectAsStateWithLifecycle()

    var selectedTab by rememberSaveable { mutableIntStateOf(0) }
    var guidedMode by rememberSaveable { mutableStateOf(true) }

    // Guided 5 Daily Reflection Questions
    var qHappy by rememberSaveable { mutableStateOf("") }
    var qAccomplished by rememberSaveable { mutableStateOf("") }
    var qGrateful by rememberSaveable { mutableStateOf("") }
    var qLearned by rememberSaveable { mutableStateOf("") }
    var qImprove by rememberSaveable { mutableStateOf("") }

    var draftTitle by rememberSaveable { mutableStateOf("") }
    var draftBody by rememberSaveable { mutableStateOf("") }

    // Self-Appreciation state
    var selectedPromptIndex by rememberSaveable { mutableIntStateOf(0) }
    var appreciationDraft by rememberSaveable { mutableStateOf("") }

    val dateFormatter = DateTimeFormatter.ofPattern("MMM d, yyyy")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text("Reflect & Appreciate", style = MaterialTheme.typography.headlineMedium)

        if (feedback != null) {
            TideErrorBanner(feedback.orEmpty(), viewModel::clearFeedback)
        }

        val tabs = listOf("Daily Reflection", "Self-Appreciation", "Saved Quotes")
        SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
            tabs.forEachIndexed { index, label ->
                SegmentedButton(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    shape = SegmentedButtonDefaults.itemShape(index, tabs.size)
                ) {
                    Text(label, maxLines = 1)
                }
            }
        }

        when (val current = state) {
            is UiState.Loading -> TideLoadingState()
            is UiState.Error -> TideEmptyState("Unable to open journal", current.message)
            is UiState.Empty -> TideEmptyState(current.title, current.subtitle)
            is UiState.Content -> {
                val data = current.data
                when (selectedTab) {
                    0 -> {
                        LazyColumn(
                            contentPadding = PaddingValues(bottom = 24.dp),
                            verticalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            item {
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = MaterialTheme.shapes.large,
                                    color = MaterialTheme.colorScheme.surface,
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                                ) {
                                    Column(
                                        modifier = Modifier.padding(18.dp),
                                        verticalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text("Daily Reflection", style = MaterialTheme.typography.titleMedium)
                                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                FilterChip(
                                                    selected = guidedMode,
                                                    onClick = { guidedMode = true },
                                                    label = { Text("Guided 5Q") }
                                                )
                                                FilterChip(
                                                    selected = !guidedMode,
                                                    onClick = { guidedMode = false },
                                                    label = { Text("Freeform") }
                                                )
                                            }
                                        }

                                        OutlinedTextField(
                                            value = draftTitle,
                                            onValueChange = { draftTitle = it },
                                            placeholder = { Text("Optional title") },
                                            singleLine = true,
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(14.dp)
                                        )

                                        if (guidedMode) {
                                            OutlinedTextField(
                                                value = qHappy,
                                                onValueChange = { qHappy = it },
                                                label = { Text("What made me happy today?") },
                                                modifier = Modifier.fillMaxWidth(),
                                                shape = RoundedCornerShape(14.dp)
                                            )
                                            OutlinedTextField(
                                                value = qAccomplished,
                                                onValueChange = { qAccomplished = it },
                                                label = { Text("What did I accomplish?") },
                                                modifier = Modifier.fillMaxWidth(),
                                                shape = RoundedCornerShape(14.dp)
                                            )
                                            OutlinedTextField(
                                                value = qGrateful,
                                                onValueChange = { qGrateful = it },
                                                label = { Text("What am I grateful for?") },
                                                modifier = Modifier.fillMaxWidth(),
                                                shape = RoundedCornerShape(14.dp)
                                            )
                                            OutlinedTextField(
                                                value = qLearned,
                                                onValueChange = { qLearned = it },
                                                label = { Text("What did I learn today?") },
                                                modifier = Modifier.fillMaxWidth(),
                                                shape = RoundedCornerShape(14.dp)
                                            )
                                            OutlinedTextField(
                                                value = qImprove,
                                                onValueChange = { qImprove = it },
                                                label = { Text("What can I improve tomorrow?") },
                                                modifier = Modifier.fillMaxWidth(),
                                                shape = RoundedCornerShape(14.dp)
                                            )
                                            val hasAnyGuided = listOf(qHappy, qAccomplished, qGrateful, qLearned, qImprove)
                                                .any { it.isNotBlank() }
                                            Button(
                                                onClick = {
                                                    val composed = buildList {
                                                        if (qHappy.isNotBlank()) add("What made me happy today?\n${qHappy.trim()}")
                                                        if (qAccomplished.isNotBlank()) add("What did I accomplish?\n${qAccomplished.trim()}")
                                                        if (qGrateful.isNotBlank()) add("What am I grateful for?\n${qGrateful.trim()}")
                                                        if (qLearned.isNotBlank()) add("What did I learn today?\n${qLearned.trim()}")
                                                        if (qImprove.isNotBlank()) add("What can I improve tomorrow?\n${qImprove.trim()}")
                                                    }.joinToString("\n\n")
                                                    viewModel.saveEntry(
                                                        draftTitle.ifBlank { "Daily Guided Reflection" },
                                                        composed
                                                    )
                                                    draftTitle = ""
                                                    qHappy = ""
                                                    qAccomplished = ""
                                                    qGrateful = ""
                                                    qLearned = ""
                                                    qImprove = ""
                                                },
                                                enabled = hasAnyGuided,
                                                shape = RoundedCornerShape(14.dp)
                                            ) {
                                                Text("Save Reflection Locally")
                                            }
                                        } else {
                                            OutlinedTextField(
                                                value = draftBody,
                                                onValueChange = { draftBody = it },
                                                placeholder = { Text("What is on your mind today? Stored only on this device.") },
                                                minLines = 4,
                                                modifier = Modifier.fillMaxWidth(),
                                                shape = RoundedCornerShape(14.dp)
                                            )
                                            Button(
                                                onClick = {
                                                    viewModel.saveEntry(draftTitle, draftBody)
                                                    draftTitle = ""
                                                    draftBody = ""
                                                },
                                                enabled = draftBody.isNotBlank(),
                                                shape = RoundedCornerShape(14.dp)
                                            ) {
                                                Text("Save Reflection Locally")
                                            }
                                        }
                                    }
                                }
                            }

                            item {
                                OutlinedTextField(
                                    value = searchQuery,
                                    onValueChange = viewModel::updateSearch,
                                    placeholder = { Text("Search reflections locally...") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(14.dp)
                                )
                            }

                            if (data.entries.isEmpty()) {
                                item {
                                    TideEmptyState(
                                        title = "Quiet pages await",
                                        subtitle = "Your personal reflections stay completely private on this device."
                                    )
                                }
                            } else {
                                items(data.entries, key = { it.id }) { entry ->
                                    Surface(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = MaterialTheme.shapes.medium,
                                        color = MaterialTheme.colorScheme.surface,
                                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                                    ) {
                                        Column(modifier = Modifier.padding(16.dp)) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Column(modifier = Modifier.weight(1f)) {
                                                    Text(entry.title, style = MaterialTheme.typography.titleMedium)
                                                    Text(
                                                        LocalDate.ofEpochDay(entry.dateEpochDay).format(dateFormatter),
                                                        style = MaterialTheme.typography.labelMedium,
                                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                                    )
                                                }
                                                IconButton(onClick = { viewModel.deleteEntry(entry.id) }) {
                                                    Icon(Icons.Outlined.DeleteOutline, contentDescription = "Delete entry")
                                                }
                                            }
                                            Spacer(modifier = Modifier.height(6.dp))
                                            Text(entry.body, style = MaterialTheme.typography.bodyMedium)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    1 -> {
                        val fallbackPrompts = listOf(
                            AppreciationPrompt("pr_love_self", "One thing I love about myself.", "Self-Love"),
                            AppreciationPrompt("pr_difficult", "Something difficult I handled.", "Resilience"),
                            AppreciationPrompt("pr_small_win", "A small achievement I am proud of.", "Small Wins"),
                            AppreciationPrompt("pr_kindness", "Something kind I did today.", "Kindness")
                        )
                        val prompts = data.appreciationPrompts.ifEmpty { fallbackPrompts }
                        val activePrompt = prompts[selectedPromptIndex % prompts.size]

                        LazyColumn(
                            contentPadding = PaddingValues(bottom = 24.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            item {
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = MaterialTheme.shapes.large,
                                    color = MaterialTheme.colorScheme.primaryContainer
                                ) {
                                    Column(
                                        modifier = Modifier.padding(18.dp),
                                        verticalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Text(
                                            text = "Daily Self-Appreciation · ${activePrompt.category}",
                                            style = MaterialTheme.typography.labelMedium,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                        Text(
                                            text = activePrompt.promptText,
                                            style = MaterialTheme.typography.titleLarge,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            prompts.take(4).forEachIndexed { idx, p ->
                                                FilterChip(
                                                    selected = selectedPromptIndex % prompts.size == idx,
                                                    onClick = { selectedPromptIndex = idx },
                                                    label = { Text(p.category) }
                                                )
                                            }
                                        }
                                        OutlinedTextField(
                                            value = appreciationDraft,
                                            onValueChange = { appreciationDraft = it },
                                            placeholder = { Text("Write something kind you want to remember...") },
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(14.dp)
                                        )
                                        Button(
                                            onClick = {
                                                viewModel.saveAppreciation(activePrompt, appreciationDraft)
                                                appreciationDraft = ""
                                            },
                                            enabled = appreciationDraft.isNotBlank(),
                                            shape = RoundedCornerShape(14.dp)
                                        ) {
                                            Text("Save to Appreciation Vault")
                                        }
                                    }
                                }
                            }

                            if (data.appreciations.isEmpty()) {
                                item {
                                    TideEmptyState(
                                        title = "Your Appreciation Vault is ready",
                                        subtitle = "Choose a prompt above to celebrate one real thing about yourself today."
                                    )
                                }
                            } else {
                                items(data.appreciations, key = { it.id }) { item ->
                                    Surface(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = MaterialTheme.shapes.medium,
                                        color = MaterialTheme.colorScheme.surface,
                                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(16.dp),
                                            verticalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(
                                                    text = item.promptText,
                                                    style = MaterialTheme.typography.labelLarge,
                                                    color = MaterialTheme.colorScheme.primary,
                                                    modifier = Modifier.weight(1f)
                                                )
                                                IconButton(onClick = { viewModel.deleteAppreciation(item.id) }) {
                                                    Icon(Icons.Outlined.DeleteOutline, contentDescription = "Delete appreciation")
                                                }
                                            }
                                            Text(item.answerText, style = MaterialTheme.typography.bodyLarge)
                                            Text(
                                                text = LocalDate.ofEpochDay(item.dateEpochDay).format(dateFormatter),
                                                style = MaterialTheme.typography.labelMedium,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    else -> {
                        if (data.favoriteAffirmations.isEmpty()) {
                            TideEmptyState(
                                title = "No saved affirmations yet",
                                subtitle = "Tap Save Favorite on any message in the Motivation Library to keep it close."
                            )
                        } else {
                            LazyColumn(
                                contentPadding = PaddingValues(bottom = 24.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                items(data.favoriteAffirmations, key = { it.id }) { aff ->
                                    Surface(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = MaterialTheme.shapes.medium,
                                        color = MaterialTheme.colorScheme.primaryContainer
                                    ) {
                                        Column(modifier = Modifier.padding(18.dp)) {
                                            Text(
                                                text = aff.toneCategory,
                                                style = MaterialTheme.typography.labelMedium,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = aff.text,
                                                style = MaterialTheme.typography.titleMedium,
                                                color = MaterialTheme.colorScheme.onPrimaryContainer
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

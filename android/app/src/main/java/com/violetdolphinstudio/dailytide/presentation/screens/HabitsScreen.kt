package com.violetdolphinstudio.dailytide.presentation.screens

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
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.violetdolphinstudio.dailytide.domain.model.HabitItem
import com.violetdolphinstudio.dailytide.domain.model.HabitTimeOfDay
import com.violetdolphinstudio.dailytide.domain.model.UiState
import com.violetdolphinstudio.dailytide.presentation.components.CalmSectionHeader
import com.violetdolphinstudio.dailytide.presentation.components.HabitCheckRow
import com.violetdolphinstudio.dailytide.presentation.components.TideEmptyState
import com.violetdolphinstudio.dailytide.presentation.components.TideErrorBanner
import com.violetdolphinstudio.dailytide.presentation.components.TideLoadingState
import com.violetdolphinstudio.dailytide.presentation.viewmodel.HabitsViewModel

@Composable
fun HabitsScreen(
    viewModel: HabitsViewModel
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val error by viewModel.errorMessage.collectAsStateWithLifecycle()
    var showEditorDialog by rememberSaveable { mutableStateOf(false) }
    var editingHabitId by rememberSaveable { mutableStateOf<Long?>(null) }
    var title by rememberSaveable { mutableStateOf("") }
    var description by rememberSaveable { mutableStateOf("") }
    var timeOfDay by rememberSaveable { mutableStateOf(HabitTimeOfDay.MORNING) }

    fun openCreate() {
        editingHabitId = null
        title = ""
        description = ""
        timeOfDay = HabitTimeOfDay.MORNING
        showEditorDialog = true
    }

    fun openEdit(habit: HabitItem) {
        editingHabitId = habit.id
        title = habit.title
        description = habit.description
        timeOfDay = habit.timeOfDay
        showEditorDialog = true
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp, vertical = 16.dp)
    ) {
        CalmSectionHeader(
            title = "Daily Habits",
            trailingActionLabel = "+ New Habit",
            onTrailingClick = { openCreate() }
        )
        Text(
            text = "Create, edit, complete, pause, or delete personal habits at your own gentle pace.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(14.dp))

        if (error != null) {
            TideErrorBanner(error.orEmpty(), viewModel::clearError)
            Spacer(modifier = Modifier.height(12.dp))
        }

        when (val current = state) {
            is UiState.Loading -> TideLoadingState()
            is UiState.Error -> TideEmptyState("Unable to load habits", current.message)
            is UiState.Empty -> TideEmptyState(
                title = current.title,
                subtitle = current.subtitle,
                actionLabel = "Create First Habit",
                onAction = { openCreate() }
            )
            is UiState.Content -> {
                LazyColumn(
                    contentPadding = PaddingValues(bottom = 24.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(current.data, key = { it.id }) { habit ->
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            HabitCheckRow(
                                habit = habit,
                                onToggle = { viewModel.toggleHabit(habit.id) }
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End
                            ) {
                                TextButton(onClick = { openEdit(habit) }) {
                                    Text("Edit")
                                }
                                TextButton(onClick = { viewModel.togglePause(habit.id, !habit.isPaused) }) {
                                    Text(if (habit.isPaused) "Resume" else "Pause")
                                }
                                TextButton(onClick = { viewModel.archiveHabit(habit.id) }) {
                                    Text("Delete")
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showEditorDialog) {
        AlertDialog(
            onDismissRequest = { showEditorDialog = false },
            title = { Text(if (editingHabitId != null) "Edit Habit" else "Create Gentle Habit") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Habit name") },
                        placeholder = { Text("Read 10 minutes") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Why it feels good (optional)") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        HabitTimeOfDay.entries.take(3).forEach { slot ->
                            FilterChip(
                                selected = timeOfDay == slot,
                                onClick = { timeOfDay = slot },
                                label = { Text(slot.label) }
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val editId = editingHabitId
                        if (editId != null) {
                            viewModel.updateHabit(editId, title, description, timeOfDay)
                        } else {
                            viewModel.createHabit(title, description, timeOfDay)
                        }
                        showEditorDialog = false
                    },
                    enabled = title.isNotBlank()
                ) {
                    Text(if (editingHabitId != null) "Update Habit" else "Save Habit")
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditorDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

package com.violetdolphinstudio.dailytide.presentation.screens

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.violetdolphinstudio.dailytide.domain.model.MeasurementUnit
import com.violetdolphinstudio.dailytide.domain.model.ReminderFrequency
import com.violetdolphinstudio.dailytide.domain.model.ThemeMode
import com.violetdolphinstudio.dailytide.domain.model.UiState
import com.violetdolphinstudio.dailytide.presentation.components.TideEmptyState
import com.violetdolphinstudio.dailytide.presentation.components.TideErrorBanner
import com.violetdolphinstudio.dailytide.presentation.components.TideLoadingState
import com.violetdolphinstudio.dailytide.presentation.components.VioletDolphinBrandFooter
import com.violetdolphinstudio.dailytide.presentation.viewmodel.SettingsViewModel
import java.time.LocalDate
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onOpenRewardUnlock: () -> Unit = {},
    onOpenAboutStudio: () -> Unit = {},
    onDataCleared: () -> Unit = {},
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val feedback by viewModel.feedback.collectAsStateWithLifecycle()

    var pendingExportJson by remember { mutableStateOf<String?>(null) }
    var pendingPermissionAction by remember { mutableStateOf<(() -> Unit)?>(null) }
    var showClearDataDialog by rememberSaveable { mutableStateOf(false) }

    // Android 13+ POST_NOTIFICATIONS launcher — invoked ONLY when the user explicitly turns ON a reminder
    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            pendingPermissionAction?.invoke()
        } else {
            viewModel.postFeedback(
                "Notification permission not granted. You can enable it later in Android App Settings."
            )
        }
        pendingPermissionAction = null
    }

    fun runWithNotificationPermission(onGranted: () -> Unit) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            onGranted()
            return
        }
        val alreadyGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.POST_NOTIFICATIONS
        ) == PackageManager.PERMISSION_GRANTED
        if (alreadyGranted) {
            onGranted()
        } else {
            pendingPermissionAction = onGranted
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    // Storage Access Framework (SAF) Local JSON Export — 100% offline, user chooses destination folder
    val exportBackupLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        val json = pendingExportJson
        pendingExportJson = null
        if (uri != null && json != null) {
            runCatching {
                context.contentResolver.openOutputStream(uri)?.use { stream ->
                    stream.write(json.toByteArray(Charsets.UTF_8))
                }
            }.onSuccess {
                viewModel.postFeedback("Offline JSON backup saved to your device.")
            }.onFailure {
                viewModel.postFeedback("Could not write backup file to the selected location.")
            }
        }
    }

    // Storage Access Framework (SAF) Local JSON Import — 100% offline, strictly validated before restoring
    val importBackupLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri != null) {
            runCatching {
                context.contentResolver.openInputStream(uri)?.bufferedReader(Charsets.UTF_8)?.use {
                    it.readText()
                } ?: ""
            }.onSuccess { rawJson ->
                viewModel.importLocalBackupJson(rawJson)
            }.onFailure {
                viewModel.postFeedback("Unable to read the selected local backup file.")
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings & Privacy") },
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
            is UiState.Error -> TideEmptyState(
                "Unable to load settings",
                current.message,
                modifier = Modifier.padding(innerPadding).padding(20.dp)
            )
            is UiState.Empty -> TideEmptyState(
                current.title,
                current.subtitle,
                modifier = Modifier.padding(innerPadding).padding(20.dp)
            )
            is UiState.Content -> {
                val settings = current.data
                var nameDraft by rememberSaveable(settings.displayName) { mutableStateOf(settings.displayName) }

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding),
                    contentPadding = PaddingValues(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    if (feedback != null) {
                        item { TideErrorBanner(feedback.orEmpty(), viewModel::clearFeedback) }
                    }

                    // Offline-First Privacy Guarantee Banner
                    item {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.large,
                            color = MaterialTheme.colorScheme.primaryContainer
                        ) {
                            Column(
                                modifier = Modifier.padding(20.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = "100% Offline-First & Private Storage",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                Text(
                                    text = "No login, no cloud database, no internet required, and cloud Auto Backup is disabled. Your journals, moods, and hydration logs never leave your phone.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                        }
                    }

                    // Profile & Hydration Preferences
                    item {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.large,
                            color = MaterialTheme.colorScheme.surface,
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Column(
                                modifier = Modifier.padding(20.dp),
                                verticalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                Text("Personal Profile", style = MaterialTheme.typography.titleMedium)
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    OutlinedTextField(
                                        value = nameDraft,
                                        onValueChange = { nameDraft = it },
                                        label = { Text("Display name") },
                                        singleLine = true,
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(14.dp)
                                    )
                                    Button(
                                        onClick = { viewModel.updateDisplayName(nameDraft) },
                                        shape = RoundedCornerShape(14.dp)
                                    ) {
                                        Text("Save")
                                    }
                                }

                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    MeasurementUnit.entries.forEach { unit ->
                                        FilterChip(
                                            selected = settings.unit == unit,
                                            onClick = { viewModel.updateUnit(unit) },
                                            label = { Text(unit.symbol.uppercase()) }
                                        )
                                    }
                                }

                                Column {
                                    Text(
                                        text = "Daily Water Goal: ${settings.unit.formatVolume(settings.dailyWaterGoalMl)}",
                                        style = MaterialTheme.typography.titleMedium
                                    )
                                    Slider(
                                        value = settings.dailyWaterGoalMl.toFloat(),
                                        onValueChange = {
                                            val rounded = (it / 100f).roundToInt() * 100
                                            viewModel.updateWaterGoal(rounded)
                                        },
                                        valueRange = 1000f..3500f,
                                        steps = 24
                                    )
                                }
                            }
                        }
                    }

                    // Appearance
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
                                Text("Appearance", style = MaterialTheme.typography.titleMedium)
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    ThemeMode.entries.forEach { mode ->
                                        FilterChip(
                                            selected = settings.themeMode == mode,
                                            onClick = { viewModel.updateTheme(mode) },
                                            label = {
                                                Text(
                                                    when (mode) {
                                                        ThemeMode.SYSTEM -> "System"
                                                        ThemeMode.WARM_IVORY -> "Warm Ivory"
                                                        ThemeMode.MIDNIGHT_TIDE -> "Midnight Tide"
                                                    }
                                                )
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Customizable Local WorkManager Reminders (All 4 Categories, Permission On-Demand)
                    item {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.large,
                            color = MaterialTheme.colorScheme.surface,
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Column(
                                modifier = Modifier.padding(20.dp),
                                verticalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text("Customizable Local Reminders", style = MaterialTheme.typography.titleMedium)
                                    Text(
                                        text = "Notification permission is requested only when you enable a reminder. Quiet hours (10:00 PM – 7:30 AM) are always respected.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }

                                // 1. Drinking Water Reminders
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Drinking Water Reminders", style = MaterialTheme.typography.bodyLarge)
                                        Text(
                                            text = "Gentle interval sips via WorkManager",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    Switch(
                                        checked = settings.remindersEnabled,
                                        onCheckedChange = { enabled ->
                                            if (enabled) {
                                                runWithNotificationPermission {
                                                    viewModel.updateReminders(settings, true)
                                                }
                                            } else {
                                                viewModel.updateReminders(settings, false)
                                            }
                                        }
                                    )
                                }
                                if (settings.remindersEnabled) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        listOf(60, 90, 120, 180).forEach { mins ->
                                            FilterChip(
                                                selected = settings.reminderIntervalMinutes == mins,
                                                onClick = { viewModel.updateReminders(settings, true, mins) },
                                                label = { Text("${mins}m") }
                                            )
                                        }
                                    }
                                }

                                HorizontalDivider()

                                // 2. Daily Reflection Reminders
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Daily Reflection Reminders", style = MaterialTheme.typography.bodyLarge)
                                        Text(
                                            text = "Evening journal & appreciation cue",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    Switch(
                                        checked = settings.reflectionRemindersEnabled,
                                        onCheckedChange = { enabled ->
                                            if (enabled) {
                                                runWithNotificationPermission {
                                                    viewModel.updateCategoryReminders(settings, reflectionEnabled = true)
                                                }
                                            } else {
                                                viewModel.updateCategoryReminders(settings, reflectionEnabled = false)
                                            }
                                        }
                                    )
                                }
                                if (settings.reflectionRemindersEnabled) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        listOf(
                                            ReminderFrequency.DAILY,
                                            ReminderFrequency.WEEKDAYS,
                                            ReminderFrequency.EVERY_2_DAYS
                                        ).forEach { freq ->
                                            FilterChip(
                                                selected = settings.reflectionFrequency == freq,
                                                onClick = {
                                                    viewModel.updateCategoryReminders(
                                                        settings,
                                                        reflectionEnabled = true,
                                                        reflectionFrequency = freq
                                                    )
                                                },
                                                label = { Text(freq.label) }
                                            )
                                        }
                                    }
                                }

                                HorizontalDivider()

                                // 3. Habit Reminders
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Habit Reminders", style = MaterialTheme.typography.bodyLarge)
                                        Text(
                                            text = "Gentle check-ins for personal routines",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    Switch(
                                        checked = settings.habitRemindersEnabled,
                                        onCheckedChange = { enabled ->
                                            if (enabled) {
                                                runWithNotificationPermission {
                                                    viewModel.updateCategoryReminders(settings, habitEnabled = true)
                                                }
                                            } else {
                                                viewModel.updateCategoryReminders(settings, habitEnabled = false)
                                            }
                                        }
                                    )
                                }
                                if (settings.habitRemindersEnabled) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        listOf(
                                            ReminderFrequency.DAILY,
                                            ReminderFrequency.WEEKDAYS,
                                            ReminderFrequency.TWICE_DAILY
                                        ).forEach { freq ->
                                            FilterChip(
                                                selected = settings.habitFrequency == freq,
                                                onClick = {
                                                    viewModel.updateCategoryReminders(
                                                        settings,
                                                        habitEnabled = true,
                                                        habitFrequency = freq
                                                    )
                                                },
                                                label = { Text(freq.label) }
                                            )
                                        }
                                    }
                                }

                                HorizontalDivider()

                                // 4. Self-Care Check-In Reminders
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Self-Care Check-In Reminders", style = MaterialTheme.typography.bodyLarge)
                                        Text(
                                            text = "Pause for mood awareness & breath",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    Switch(
                                        checked = settings.selfCareRemindersEnabled,
                                        onCheckedChange = { enabled ->
                                            if (enabled) {
                                                runWithNotificationPermission {
                                                    viewModel.updateCategoryReminders(settings, selfCareEnabled = true)
                                                }
                                            } else {
                                                viewModel.updateCategoryReminders(settings, selfCareEnabled = false)
                                            }
                                        }
                                    )
                                }
                                if (settings.selfCareRemindersEnabled) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        listOf(
                                            ReminderFrequency.DAILY,
                                            ReminderFrequency.EVERY_2_DAYS,
                                            ReminderFrequency.WEEKLY
                                        ).forEach { freq ->
                                            FilterChip(
                                                selected = settings.selfCareFrequency == freq,
                                                onClick = {
                                                    viewModel.updateCategoryReminders(
                                                        settings,
                                                        selfCareEnabled = true,
                                                        selfCareFrequency = freq
                                                    )
                                                },
                                                label = { Text(freq.label) }
                                            )
                                        }
                                    }
                                }

                                HorizontalDivider()

                                // 5. Daily Use Reminder
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Daily Use Reminder", style = MaterialTheme.typography.bodyLarge)
                                        Text(
                                            text = "One calm daily invitation to open Daily Tide",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    Switch(
                                        checked = settings.dailyUseReminderEnabled,
                                        onCheckedChange = { enabled ->
                                            if (enabled) {
                                                runWithNotificationPermission {
                                                    viewModel.updateDailyAndFeedbackReminders(
                                                        settings,
                                                        dailyUseEnabled = true
                                                    )
                                                }
                                            } else {
                                                viewModel.updateDailyAndFeedbackReminders(
                                                    settings,
                                                    dailyUseEnabled = false
                                                )
                                            }
                                        }
                                    )
                                }
                                if (settings.dailyUseReminderEnabled) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        listOf(
                                            (8 * 60 + 30) to "08:30",
                                            (12 * 60 + 30) to "12:30",
                                            (19 * 60 + 30) to "19:30"
                                        ).forEach { (mins, label) ->
                                            FilterChip(
                                                selected = settings.dailyUseReminderTimeMinute == mins,
                                                onClick = {
                                                    viewModel.updateDailyAndFeedbackReminders(
                                                        settings,
                                                        dailyUseEnabled = true,
                                                        dailyUseTimeMinute = mins
                                                    )
                                                },
                                                label = { Text(label) }
                                            )
                                        }
                                    }
                                }

                                HorizontalDivider()

                                // 6. Post-Use Feedback Notification (Sent once politely after use)
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Post-Use Feedback Check-In", style = MaterialTheme.typography.bodyLarge)
                                        Text(
                                            text = if (settings.hasSentPostUseFeedbackNotification) {
                                                "Sent once — thank you for using Daily Tide."
                                            } else {
                                                "One polite feedback invitation after you finish using the app"
                                            },
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    Switch(
                                        checked = settings.feedbackNotificationEnabled,
                                        onCheckedChange = { enabled ->
                                            if (enabled) {
                                                runWithNotificationPermission {
                                                    viewModel.updateDailyAndFeedbackReminders(
                                                        settings,
                                                        feedbackNotificationEnabled = true
                                                    )
                                                }
                                            } else {
                                                viewModel.updateDailyAndFeedbackReminders(
                                                    settings,
                                                    feedbackNotificationEnabled = false
                                                )
                                            }
                                        }
                                    )
                                }
                            }
                        }
                    }

                    // Local Data Management (Export, Import, Clear Application Data)
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
                                Text("Local Data Management", style = MaterialTheme.typography.titleMedium)
                                Text(
                                    text = "Export or import a private JSON backup on your device, or clear all local Room & DataStore data.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )

                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Button(
                                        onClick = {
                                            viewModel.exportLocalBackupJson { json ->
                                                pendingExportJson = json
                                                exportBackupLauncher.launch(
                                                    "daily-tide-backup-${LocalDate.now()}.json"
                                                )
                                            }
                                        },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(14.dp)
                                    ) {
                                        Text("Export JSON")
                                    }
                                    OutlinedButton(
                                        onClick = {
                                            importBackupLauncher.launch(arrayOf("application/json", "*/*"))
                                        },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(14.dp)
                                    ) {
                                        Text("Import JSON")
                                    }
                                }

                                OutlinedButton(
                                    onClick = { showClearDataDialog = true },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(14.dp),
                                    colors = ButtonDefaults.outlinedButtonColors(
                                        contentColor = MaterialTheme.colorScheme.error
                                    )
                                ) {
                                    Text("Clear All Application Data")
                                }
                            }
                        }
                    }

                    // Links to Reward Unlock & About Violet Dolphin Studio
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
                                Text("Studio & Optional Extras", style = MaterialTheme.typography.titleMedium)
                                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                                    Button(
                                        onClick = onOpenRewardUnlock,
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(14.dp)
                                    ) {
                                        Text("Reward Unlocks")
                                    }
                                    Button(
                                        onClick = onOpenAboutStudio,
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(14.dp)
                                    ) {
                                        Text("About Studio")
                                    }
                                }
                            }
                        }
                    }

                    item { VioletDolphinBrandFooter() }
                }

                if (showClearDataDialog) {
                    AlertDialog(
                        onDismissRequest = { showClearDataDialog = false },
                        title = { Text("Clear all local data?") },
                        text = {
                            Text(
                                "This permanently deletes all water logs, mood check-ins, private journal entries, appreciations, habits, and scheduled reminders on this device."
                            )
                        },
                        confirmButton = {
                            Button(
                                onClick = {
                                    showClearDataDialog = false
                                    viewModel.clearAllApplicationData(onDataCleared)
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = MaterialTheme.colorScheme.error
                                )
                            ) {
                                Text("Clear Everything")
                            }
                        },
                        dismissButton = {
                            TextButton(onClick = { showClearDataDialog = false }) {
                                Text("Cancel")
                            }
                        }
                    )
                }
            }
        }
    }
}

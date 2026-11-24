package com.violetdolphinstudio.dailytide.presentation.screens

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.violetdolphinstudio.dailytide.domain.model.UiState
import com.violetdolphinstudio.dailytide.presentation.components.HydrationWaveCard
import com.violetdolphinstudio.dailytide.presentation.components.TideEmptyState
import com.violetdolphinstudio.dailytide.presentation.components.TideErrorBanner
import com.violetdolphinstudio.dailytide.presentation.components.TideLoadingState
import com.violetdolphinstudio.dailytide.presentation.viewmodel.HydrationViewModel
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HydrationDetailScreen(
    viewModel: HydrationViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val error by viewModel.errorMessage.collectAsStateWithLifecycle()
    var newVesselName by rememberSaveable { mutableStateOf("") }
    var newVesselMl by rememberSaveable { mutableStateOf("350") }
    var customSipMl by rememberSaveable { mutableStateOf("200") }
    val timeFormatter = DateTimeFormatter.ofPattern("h:mm a")
    val dateFormatter = DateTimeFormatter.ofPattern("EEE, MMM d")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Hydration Tracker") },
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
            is UiState.Error -> TideEmptyState("Unable to load", current.message, modifier = Modifier.padding(innerPadding).padding(20.dp))
            is UiState.Empty -> TideEmptyState(current.title, current.subtitle, modifier = Modifier.padding(innerPadding).padding(20.dp))
            is UiState.Content -> {
                val data = current.data
                val hydration = data.hydration
                val settings = data.settings
                val history = data.history

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding),
                    contentPadding = PaddingValues(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    if (error != null) {
                        item { TideErrorBanner(error.orEmpty(), viewModel::clearError) }
                    }

                    // Daily Wave Progress & One-Tap Vessel Logging
                    item {
                        HydrationWaveCard(
                            state = hydration,
                            unit = settings.unit,
                            onQuickAdd = { vessel -> viewModel.logCustomAmount(vessel.volumeMl, vessel) },
                            onOpenDetails = {}
                        )
                    }

                    // Personal Customizable Goal (explicitly non-medical)
                    item {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.large,
                            color = MaterialTheme.colorScheme.surface,
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Column(
                                modifier = Modifier.padding(20.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("Personal Daily Target", style = MaterialTheme.typography.titleMedium)
                                    Text(
                                        text = settings.unit.formatVolume(settings.dailyWaterGoalMl),
                                        style = MaterialTheme.typography.titleMedium,
                                        color = MaterialTheme.colorScheme.secondary
                                    )
                                }
                                Text(
                                    text = "Personal target only — hydration needs vary for every body. Customize freely for your routine. Resets automatically at midnight.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Slider(
                                    value = settings.dailyWaterGoalMl.toFloat().coerceIn(800f, 4500f),
                                    onValueChange = {
                                        val rounded = (it / 100f).roundToInt() * 100
                                        viewModel.updateGoal(rounded)
                                    },
                                    valueRange = 800f..4500f,
                                    steps = 36
                                )
                            }
                        }
                    }

                    // Quick Custom Sip
                    item {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.large,
                            color = MaterialTheme.colorScheme.surface,
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                OutlinedTextField(
                                    value = customSipMl,
                                    onValueChange = { customSipMl = it.filter(Char::isDigit) },
                                    label = { Text("Quick amount (ml)") },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(14.dp)
                                )
                                Button(
                                    onClick = {
                                        val ml = customSipMl.toIntOrNull() ?: 0
                                        if (ml >= 10) viewModel.logCustomAmount(ml, null)
                                    },
                                    shape = RoundedCornerShape(14.dp)
                                ) {
                                    Text("+ Log")
                                }
                            }
                        }
                    }

                    // 14-Day Historical Consumption Chart & Recent Totals
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
                                Text("14-Day Historical Consumption", style = MaterialTheme.typography.titleMedium)
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(84.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.Bottom
                                ) {
                                    history.forEach { day ->
                                        val ratio = if (day.goalMl > 0) {
                                            (day.waterMl.toFloat() / day.goalMl.toFloat()).coerceIn(0.08f, 1f)
                                        } else 0.08f
                                        val dayChar = LocalDate.ofEpochDay(day.epochDay)
                                            .dayOfWeek
                                            .getDisplayName(TextStyle.NARROW, Locale.getDefault())
                                        Column(
                                            horizontalAlignment = Alignment.CenterHorizontally,
                                            verticalArrangement = Arrangement.spacedBy(4.dp)
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .width(12.dp)
                                                    .height((60 * ratio).dp)
                                                    .clip(RoundedCornerShape(6.dp))
                                                    .background(
                                                        if (day.waterMl >= day.goalMl) {
                                                            MaterialTheme.colorScheme.tertiary
                                                        } else if (day.waterMl > 0) {
                                                            MaterialTheme.colorScheme.primaryContainer
                                                        } else {
                                                            MaterialTheme.colorScheme.surfaceVariant
                                                        }
                                                    )
                                            )
                                            Text(
                                                text = dayChar,
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                }

                                history.reversed().take(5).forEach { point ->
                                    val label = LocalDate.ofEpochDay(point.epochDay).format(dateFormatter)
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(label, style = MaterialTheme.typography.bodyMedium)
                                        Text(
                                            text = "${settings.unit.formatVolume(point.waterMl)} / ${settings.unit.formatVolume(point.goalMl)}",
                                            style = MaterialTheme.typography.labelLarge,
                                            color = if (point.waterMl >= point.goalMl) {
                                                MaterialTheme.colorScheme.tertiary
                                            } else {
                                                MaterialTheme.colorScheme.onSurfaceVariant
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Custom Water Glasses Manager
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
                                Text("Add Custom Glass Size", style = MaterialTheme.typography.titleMedium)
                                OutlinedTextField(
                                    value = newVesselName,
                                    onValueChange = { newVesselName = it },
                                    label = { Text("Glass name (e.g., Ceramic Mug)") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(14.dp)
                                )
                                OutlinedTextField(
                                    value = newVesselMl,
                                    onValueChange = { newVesselMl = it.filter(Char::isDigit) },
                                    label = { Text("Volume in ml") },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(14.dp)
                                )
                                Button(
                                    onClick = {
                                        val ml = newVesselMl.toIntOrNull() ?: 0
                                        viewModel.addCustomVessel(newVesselName, ml)
                                        newVesselName = ""
                                    },
                                    enabled = newVesselName.isNotBlank() && (newVesselMl.toIntOrNull() ?: 0) >= 25,
                                    shape = RoundedCornerShape(14.dp)
                                ) {
                                    Text("Save Custom Glass")
                                }
                            }
                        }
                    }

                    item {
                        Text("Your Glasses", style = MaterialTheme.typography.titleMedium)
                    }

                    items(hydration.vessels, key = { it.id }) { vessel ->
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.medium,
                            color = MaterialTheme.colorScheme.surface,
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(vessel.name, style = MaterialTheme.typography.titleMedium)
                                    Text(
                                        settings.unit.formatVolume(vessel.volumeMl),
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Button(
                                        onClick = { viewModel.logCustomAmount(vessel.volumeMl, vessel) },
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text("+Log")
                                    }
                                    if (!vessel.isDefault) {
                                        IconButton(onClick = { viewModel.archiveVessel(vessel.id) }) {
                                            Icon(Icons.Outlined.DeleteOutline, contentDescription = "Remove vessel")
                                        }
                                    }
                                }
                            }
                        }
                    }

                    item {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Today's Water Log", style = MaterialTheme.typography.titleMedium)
                    }

                    if (hydration.logs.isEmpty()) {
                        item {
                            TideEmptyState(
                                title = "No sips logged yet today",
                                subtitle = "Tap any glass above whenever you take a calm sip."
                            )
                        }
                    } else {
                        items(hydration.logs, key = { it.id }) { log ->
                            val timeLabel = Instant.ofEpochMilli(log.loggedAtMillis)
                                .atZone(ZoneId.systemDefault())
                                .toLocalTime()
                                .format(timeFormatter)
                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = MaterialTheme.shapes.medium,
                                color = MaterialTheme.colorScheme.surface,
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp, vertical = 12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = "${settings.unit.formatVolume(log.amountMl)} · ${log.vesselName}",
                                            style = MaterialTheme.typography.titleMedium
                                        )
                                        Text(
                                            text = timeLabel,
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    IconButton(onClick = { viewModel.deleteLog(log.id) }) {
                                        Icon(Icons.Outlined.DeleteOutline, contentDescription = "Remove incorrect entry")
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

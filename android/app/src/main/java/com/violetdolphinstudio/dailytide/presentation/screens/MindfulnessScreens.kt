package com.violetdolphinstudio.dailytide.presentation.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
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
import com.violetdolphinstudio.dailytide.domain.model.ChallengeStatus
import com.violetdolphinstudio.dailytide.domain.model.MoodLevel
import com.violetdolphinstudio.dailytide.domain.model.UiState
import com.violetdolphinstudio.dailytide.presentation.components.MoodSelectorRow
import com.violetdolphinstudio.dailytide.presentation.components.TideEmptyState
import com.violetdolphinstudio.dailytide.presentation.components.TideLoadingState
import com.violetdolphinstudio.dailytide.presentation.viewmodel.ReflectViewModel
import com.violetdolphinstudio.dailytide.presentation.viewmodel.TodayViewModel
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun MoodCheckInScreen(
    viewModel: TodayViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var selectedMood by rememberSaveable { mutableStateOf(MoodLevel.CALM) }
    var selectedTags by rememberSaveable { mutableStateOf(setOf<String>()) }
    var note by rememberSaveable { mutableStateOf("") }
    val availableTags = listOf("Rested", "Grateful", "Focused", "Busy", "Outdoors", "Quiet", "Creative", "Tired")
    val dateFormatter = DateTimeFormatter.ofPattern("EEE, MMM d")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mood Tracker") },
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
            contentPadding = PaddingValues(20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            item {
                Text(
                    text = "How does your tide feel right now?",
                    style = MaterialTheme.typography.headlineMedium
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = selectedMood.gentleSummary,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            item {
                MoodSelectorRow(
                    selectedMood = selectedMood,
                    onSelectMood = { selectedMood = it }
                )
            }

            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("What describes this moment?", style = MaterialTheme.typography.titleMedium)
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        availableTags.forEach { tag ->
                            val picked = selectedTags.contains(tag)
                            FilterChip(
                                selected = picked,
                                onClick = {
                                    selectedTags = if (picked) selectedTags - tag else selectedTags + tag
                                },
                                label = { Text(tag) }
                            )
                        }
                    }
                }
            }

            item {
                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    label = { Text("Optional gentle note") },
                    placeholder = { Text("A sentence about what shaped your mood...") },
                    minLines = 3,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp)
                )
            }

            item {
                Button(
                    onClick = {
                        viewModel.logMood(selectedMood, selectedTags.toList(), note)
                        note = ""
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("Save Mood Check-In")
                }
            }

            if (state is UiState.Content) {
                val recentMoods = (state as UiState.Content).data.recentMoods
                item {
                    Text("Recent Mood Tide (${recentMoods.size})", style = MaterialTheme.typography.titleMedium)
                }
                if (recentMoods.isEmpty()) {
                    item {
                        TideEmptyState(
                            title = "No mood entries yet",
                            subtitle = "Save your first check-in above to track your emotional tide offline."
                        )
                    }
                } else {
                    items(recentMoods, key = { it.id }) { entry ->
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.medium,
                            color = MaterialTheme.colorScheme.surface,
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "${entry.mood.label} · ${LocalDate.ofEpochDay(entry.dateEpochDay).format(dateFormatter)}",
                                        style = MaterialTheme.typography.titleMedium
                                    )
                                    if (entry.tags.isNotEmpty()) {
                                        Text(
                                            text = entry.tags.joinToString(" · "),
                                            style = MaterialTheme.typography.labelMedium,
                                            color = MaterialTheme.colorScheme.secondary
                                        )
                                    }
                                    if (!entry.note.isNullOrBlank()) {
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = entry.note,
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                IconButton(onClick = { viewModel.deleteMood(entry.id) }) {
                                    Icon(Icons.Outlined.DeleteOutline, contentDescription = "Delete mood entry")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MotivationScreen(
    todayViewModel: TodayViewModel,
    reflectViewModel: ReflectViewModel,
    onOpenShareCard: () -> Unit,
    onBack: () -> Unit
) {
    val reflectState by reflectViewModel.uiState.collectAsStateWithLifecycle()
    val categories = listOf(
        "All",
        "Favorites",
        "Self-confidence",
        "Discipline",
        "Consistency",
        "Personal growth",
        "Gratitude",
        "New beginnings",
        "Positive thinking"
    )
    var selectedCategory by rememberSaveable { mutableStateOf("All") }
    var searchQuery by rememberSaveable { mutableStateOf("") }
    var spotlightIndex by rememberSaveable { mutableIntStateOf(0) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Motivation Library") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { innerPadding ->
        when (val r = reflectState) {
            is UiState.Loading -> TideLoadingState(modifier = Modifier.padding(innerPadding))
            is UiState.Content -> {
                val allMessages = r.data.allAffirmations
                val filtered = allMessages.filter { msg ->
                    val matchesCategory = when (selectedCategory) {
                        "All" -> true
                        "Favorites" -> msg.isFavorite
                        else -> msg.toneCategory == selectedCategory
                    }
                    val matchesQuery = searchQuery.isBlank() ||
                        msg.text.contains(searchQuery.trim(), ignoreCase = true) ||
                        msg.toneCategory.contains(searchQuery.trim(), ignoreCase = true)
                    matchesCategory && matchesQuery
                }
                val activePool = filtered.ifEmpty { allMessages }
                val featured = activePool.getOrNull(spotlightIndex % activePool.size.coerceAtLeast(1))

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding),
                    contentPadding = PaddingValues(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    if (featured != null) {
                        item {
                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = MaterialTheme.shapes.extraLarge,
                                color = MaterialTheme.colorScheme.primaryContainer
                            ) {
                                Column(
                                    modifier = Modifier.padding(24.dp),
                                    verticalArrangement = Arrangement.spacedBy(14.dp)
                                ) {
                                    Text(
                                        text = "${featured.toneCategory} · ${allMessages.size} Offline Messages",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Text(
                                        text = featured.text,
                                        style = MaterialTheme.typography.headlineMedium,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(
                                            onClick = { reflectViewModel.toggleAffirmationFavorite(featured) },
                                            shape = RoundedCornerShape(14.dp)
                                        ) {
                                            Icon(
                                                imageVector = if (featured.isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                                                contentDescription = null
                                            )
                                            Text(if (featured.isFavorite) " Saved" else " Favorite")
                                        }
                                        OutlinedButton(
                                            onClick = { spotlightIndex += 1 },
                                            shape = RoundedCornerShape(14.dp)
                                        ) {
                                            Text("Next")
                                        }
                                        OutlinedButton(
                                            onClick = onOpenShareCard,
                                            shape = RoundedCornerShape(14.dp)
                                        ) {
                                            Text("Share")
                                        }
                                    }
                                }
                            }
                        }
                    }

                    item {
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = {
                                searchQuery = it
                                spotlightIndex = 0
                            },
                            placeholder = { Text("Search all 105 offline messages...") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp)
                        )
                    }

                    item {
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(categories) { category ->
                                FilterChip(
                                    selected = selectedCategory == category,
                                    onClick = {
                                        selectedCategory = category
                                        spotlightIndex = 0
                                    },
                                    label = { Text(category) }
                                )
                            }
                        }
                    }

                    item {
                        Text(
                            text = "$selectedCategory (${filtered.size})",
                            style = MaterialTheme.typography.titleMedium
                        )
                    }

                    if (filtered.isEmpty()) {
                        item {
                            TideEmptyState(
                                title = "No messages matched",
                                subtitle = "Try another theme or search phrase."
                            )
                        }
                    } else {
                        items(filtered, key = { it.id }) { item ->
                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = MaterialTheme.shapes.medium,
                                color = MaterialTheme.colorScheme.surface,
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = item.toneCategory,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.secondary
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(item.text, style = MaterialTheme.typography.bodyLarge)
                                    }
                                    IconButton(onClick = { reflectViewModel.toggleAffirmationFavorite(item) }) {
                                        Icon(
                                            imageVector = if (item.isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                                            contentDescription = "Toggle favorite",
                                            tint = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else -> TideEmptyState("Unavailable", "Could not load Motivation Library.", modifier = Modifier.padding(innerPadding).padding(20.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DailyChallengesScreen(
    viewModel: TodayViewModel,
    onOpenRewardUnlock: () -> Unit,
    onBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var manualCompletedIds by rememberSaveable { mutableStateOf(setOf<String>()) }
    var positiveThoughtDraft by rememberSaveable { mutableStateOf("") }
    var savedPositiveThought by rememberSaveable { mutableStateOf<String?>(null) }

    val dailyQuests = listOf(
        Triple("drink_wake_water", "Drink water after waking up", "Begin your morning with one calm, hydrating glass (+20 pts)"),
        Triple("appreciate_three", "Write three things you appreciate", "Notice three quiet wins or strengths in your vault (+25 pts)"),
        Triple("reflect_five_min", "Spend five minutes reflecting", "Pause for an unhurried check-in in your private journal (+25 pts)"),
        Triple("complete_habit", "Complete one personal habit", "Check off any habit from your routine at your own pace (+20 pts)"),
        Triple("positive_thought", "Write one positive thought", "Capture one encouraging, grounded sentence for today (+20 pts)")
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Daily Self-Care Quests") },
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
                val data = current.data
                val challenge = data.challenge
                val autoCompleted = buildSet {
                    if (data.hydration.consumedMl > 0) add("drink_wake_water")
                    if (data.habits.any { it.isCompletedToday }) add("complete_habit")
                    if (!savedPositiveThought.isNullOrBlank()) add("positive_thought")
                    addAll(manualCompletedIds)
                }

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding),
                    contentPadding = PaddingValues(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
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
                                    text = "${autoCompleted.size} of ${dailyQuests.size} quests nurtured today",
                                    style = MaterialTheme.typography.titleLarge,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                Text(
                                    text = "Each small quest earns Tide Points that help your offline Progress Garden bloom — zero guilt if you rest.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                        }
                    }

                    items(dailyQuests, key = { it.first }) { (questId, title, subtitle) ->
                        val isDone = autoCompleted.contains(questId)
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.large,
                            color = MaterialTheme.colorScheme.surface,
                            border = BorderStroke(
                                1.dp,
                                if (isDone) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                            )
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
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(title, style = MaterialTheme.typography.titleMedium)
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = subtitle,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    OutlinedButton(
                                        onClick = {
                                            manualCompletedIds = if (manualCompletedIds.contains(questId)) {
                                                manualCompletedIds - questId
                                            } else {
                                                manualCompletedIds + questId
                                            }
                                        },
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text(if (isDone) "Done" else "Mark Done")
                                    }
                                }

                                if (questId == "positive_thought") {
                                    OutlinedTextField(
                                        value = positiveThoughtDraft,
                                        onValueChange = { positiveThoughtDraft = it },
                                        placeholder = { Text("Write one positive thought for today...") },
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(12.dp)
                                    )
                                    Button(
                                        onClick = {
                                            if (positiveThoughtDraft.isNotBlank()) {
                                                savedPositiveThought = positiveThoughtDraft.trim()
                                                manualCompletedIds = manualCompletedIds + "positive_thought"
                                                positiveThoughtDraft = ""
                                            }
                                        },
                                        enabled = positiveThoughtDraft.isNotBlank(),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text("Save Positive Thought")
                                    }
                                    savedPositiveThought?.let { thought ->
                                        Text(
                                            text = "\"$thought\"",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                }
                            }
                        }
                    }

                    if (challenge != null) {
                        item {
                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = MaterialTheme.shapes.extraLarge,
                                color = MaterialTheme.colorScheme.surface,
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                            ) {
                                Column(
                                    modifier = Modifier.padding(22.dp),
                                    verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Text(
                                        text = "Bonus Calm Ritual · ${challenge.challenge.category} · ${challenge.challenge.durationMinutes} min",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = MaterialTheme.colorScheme.secondary
                                    )
                                    Text(
                                        text = challenge.challenge.title,
                                        style = MaterialTheme.typography.headlineSmall
                                    )
                                    Text(
                                        text = challenge.challenge.description,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    if (challenge.status == ChallengeStatus.COMPLETED) {
                                        Text(
                                            text = "Completed with care today (+20 Tide pts).",
                                            style = MaterialTheme.typography.titleMedium,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    } else {
                                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                            Button(
                                                onClick = viewModel::completeDailyChallenge,
                                                shape = RoundedCornerShape(14.dp)
                                            ) {
                                                Text("Complete Ritual")
                                            }
                                            OutlinedButton(
                                                onClick = {
                                                    if (challenge.swapsUsed >= 1) {
                                                        onOpenRewardUnlock()
                                                    } else {
                                                        viewModel.swapDailyChallenge(false)
                                                    }
                                                },
                                                shape = RoundedCornerShape(14.dp)
                                            ) {
                                                Text(if (challenge.swapsUsed >= 1) "Unlock Swap" else "Gentle Swap")
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else -> TideEmptyState("Unavailable", "Could not load quests.", modifier = Modifier.padding(innerPadding).padding(20.dp))
        }
    }
}

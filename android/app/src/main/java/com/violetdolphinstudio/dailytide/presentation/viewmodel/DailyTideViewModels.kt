package com.violetdolphinstudio.dailytide.presentation.viewmodel

import android.app.Activity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.violetdolphinstudio.dailytide.ads.PrivacyConsentUiState
import com.violetdolphinstudio.dailytide.ads.RewardedAdUiState
import com.violetdolphinstudio.dailytide.di.AppContainer
import com.violetdolphinstudio.dailytide.domain.model.Affirmation
import com.violetdolphinstudio.dailytide.domain.model.AppResult
import com.violetdolphinstudio.dailytide.domain.model.AppreciationAnswer
import com.violetdolphinstudio.dailytide.domain.model.AppreciationPrompt
import com.violetdolphinstudio.dailytide.domain.model.DailyActivityPoint
import com.violetdolphinstudio.dailytide.domain.model.DailyChallengeState
import com.violetdolphinstudio.dailytide.domain.model.HabitItem
import com.violetdolphinstudio.dailytide.domain.model.HabitTimeOfDay
import com.violetdolphinstudio.dailytide.domain.model.HydrationDayState
import com.violetdolphinstudio.dailytide.domain.model.JournalEntry
import com.violetdolphinstudio.dailytide.domain.model.LocalDateUtil
import com.violetdolphinstudio.dailytide.domain.model.MeasurementUnit
import com.violetdolphinstudio.dailytide.domain.model.MoodCheckIn
import com.violetdolphinstudio.dailytide.domain.model.MoodLevel
import com.violetdolphinstudio.dailytide.domain.model.ProgressOverview
import com.violetdolphinstudio.dailytide.domain.model.ReminderFrequency
import com.violetdolphinstudio.dailytide.domain.model.ReminderMode
import com.violetdolphinstudio.dailytide.domain.model.ThemeMode
import com.violetdolphinstudio.dailytide.domain.model.UiState
import com.violetdolphinstudio.dailytide.domain.model.UserSettings
import com.violetdolphinstudio.dailytide.domain.model.WaterVessel
import com.violetdolphinstudio.dailytide.rewards.RewardAccessState
import com.violetdolphinstudio.dailytide.rewards.RewardLevel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/**
 * Automatically detects midnight / calendar day rollovers so every daily tracker
 * resets cleanly for the new day while preserving all historical data in Room.
 */
fun currentEpochDayFlow(): Flow<Long> = flow {
    while (true) {
        emit(LocalDateUtil.todayEpochDay())
        delay(30_000L)
    }
}.distinctUntilChanged()

data class TodayDashboardData(
    val settings: UserSettings,
    val hydration: HydrationDayState,
    val latestMood: MoodCheckIn?,
    val recentMoods: List<MoodCheckIn>,
    val affirmation: Affirmation?,
    val challenge: DailyChallengeState?,
    val habits: List<HabitItem>,
    val appreciationPrompt: AppreciationPrompt?,
    val lastLoggedWaterId: Long? = null
)

data class HydrationScreenData(
    val hydration: HydrationDayState,
    val settings: UserSettings,
    val history: List<DailyActivityPoint>
)

class AppRootViewModel(
    private val container: AppContainer
) : ViewModel() {
    val settingsState: StateFlow<UiState<UserSettings>> = container.settingsRepository.settingsFlow
        .map<UserSettings, UiState<UserSettings>> { UiState.Content(it) }
        .catch { emit(UiState.Error("Could not read local preferences.")) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UiState.Loading)

    fun completeOnboarding(
        displayName: String,
        unit: MeasurementUnit,
        dailyGoalMl: Int,
        remindersEnabled: Boolean
    ) {
        viewModelScope.launch {
            container.settingsRepository.completeOnboarding(
                displayName = displayName,
                unit = unit,
                dailyGoalMl = dailyGoalMl,
                remindersEnabled = remindersEnabled
            )
            container.reminderScheduler.syncSchedules(
                UserSettings(
                    hasCompletedOnboarding = true,
                    displayName = displayName,
                    unit = unit,
                    dailyWaterGoalMl = dailyGoalMl,
                    remindersEnabled = remindersEnabled
                )
            )
        }
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class TodayViewModel(
    private val container: AppContainer
) : ViewModel() {

    private val epochDayFlow = currentEpochDayFlow()
    private val todayEpochDay: Long get() = LocalDateUtil.todayEpochDay()

    private val _appreciationPrompt = MutableStateFlow<AppreciationPrompt?>(null)
    private val _lastLoggedWaterId = MutableStateFlow<Long?>(null)
    private val _feedbackMessage = MutableStateFlow<String?>(null)
    val feedbackMessage: StateFlow<String?> = _feedbackMessage.asStateFlow()

    private val latestMoodFlow = epochDayFlow.flatMapLatest { day ->
        container.reflectionRepository.observeTodayMoods(day).map { it.firstOrNull() }
    }

    private val affirmationFlow = combine(epochDayFlow, latestMoodFlow) { day, mood -> day to mood }
        .flatMapLatest { (day, mood) ->
            container.reflectionRepository.observeTodayAffirmation(day, mood?.mood)
        }

    private val corePartFlow = combine(
        container.settingsRepository.settingsFlow,
        epochDayFlow.flatMapLatest { container.hydrationRepository.observeDayHydration(it) },
        latestMoodFlow,
        affirmationFlow
    ) { settings, hydration, mood, affirmation ->
        CorePart(settings, hydration, mood, affirmation)
    }

    private val routinePartFlow = combine(
        epochDayFlow.flatMapLatest { container.habitChallengeRepository.observeDailyChallenge(it) },
        epochDayFlow.flatMapLatest { container.habitChallengeRepository.observeHabitsForDate(it) },
        _appreciationPrompt,
        _lastLoggedWaterId
    ) { challenge, habits, prompt, lastWaterId ->
        RoutinePart(challenge, habits, prompt, lastWaterId)
    }

    val uiState: StateFlow<UiState<TodayDashboardData>> = combine(
        corePartFlow,
        routinePartFlow,
        container.reflectionRepository.observeRecentMoods(20)
    ) { core, routine, recentMoods ->
        UiState.Content(
            TodayDashboardData(
                settings = core.settings,
                hydration = core.hydration,
                latestMood = core.mood,
                recentMoods = recentMoods,
                affirmation = core.affirmation,
                challenge = routine.challenge,
                habits = routine.habits,
                appreciationPrompt = routine.prompt,
                lastLoggedWaterId = routine.lastWaterId
            )
        ) as UiState<TodayDashboardData>
    }
        .catch { emit(UiState.Error("Unable to load today's tide.")) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UiState.Loading)

    private data class CorePart(
        val settings: UserSettings,
        val hydration: HydrationDayState,
        val mood: MoodCheckIn?,
        val affirmation: Affirmation?
    )

    private data class RoutinePart(
        val challenge: DailyChallengeState?,
        val habits: List<HabitItem>,
        val prompt: AppreciationPrompt?,
        val lastWaterId: Long?
    )

    init {
        viewModelScope.launch {
            epochDayFlow.collect { day ->
                container.habitChallengeRepository.ensureDailyChallengeAssigned(day)
                loadTodayPrompt(day, forceSwap = false)
            }
        }
    }

    fun quickLogWater(vessel: WaterVessel) {
        viewModelScope.launch {
            when (val res = container.logWaterUseCase(vessel.volumeMl, vessel, todayEpochDay)) {
                is AppResult.Success -> _lastLoggedWaterId.value = res.data
                is AppResult.Error -> _feedbackMessage.value = res.message
            }
        }
    }

    fun undoLastWaterLog() {
        val logId = _lastLoggedWaterId.value ?: return
        viewModelScope.launch {
            when (val res = container.hydrationRepository.deleteWaterLog(logId)) {
                is AppResult.Success -> _lastLoggedWaterId.value = null
                is AppResult.Error -> _feedbackMessage.value = res.message
            }
        }
    }

    fun logMood(mood: MoodLevel, tags: List<String> = emptyList(), note: String? = null) {
        viewModelScope.launch {
            when (val res = container.reflectionRepository.saveMoodCheckIn(todayEpochDay, mood, tags, note)) {
                is AppResult.Success -> container.evaluateBadgesUseCase(todayEpochDay)
                is AppResult.Error -> _feedbackMessage.value = res.message
            }
        }
    }

    fun deleteMood(moodId: Long) {
        viewModelScope.launch {
            val res = container.reflectionRepository.deleteMoodCheckIn(moodId)
            if (res is AppResult.Error) _feedbackMessage.value = res.message
        }
    }

    fun toggleHabit(habitId: Long) {
        viewModelScope.launch {
            when (val res = container.toggleHabitUseCase(habitId, todayEpochDay)) {
                is AppResult.Success -> Unit
                is AppResult.Error -> _feedbackMessage.value = res.message
            }
        }
    }

    fun completeDailyChallenge() {
        viewModelScope.launch {
            when (val res = container.completeDailyChallengeUseCase(todayEpochDay)) {
                is AppResult.Success -> Unit
                is AppResult.Error -> _feedbackMessage.value = res.message
            }
        }
    }

    fun swapDailyChallenge(useMockReward: Boolean = false) {
        viewModelScope.launch {
            if (useMockReward) {
                container.rewardAccessManager.completeRewardUnlock(RewardLevel.LEVEL_3_SPECIAL_CHALLENGES)
            }
            when (val res = container.habitChallengeRepository.swapDailyChallenge(todayEpochDay, useMockReward)) {
                is AppResult.Success -> Unit
                is AppResult.Error -> _feedbackMessage.value = res.message
            }
        }
    }

    fun toggleAffirmationFavorite(affirmation: Affirmation) {
        viewModelScope.launch {
            container.reflectionRepository.toggleAffirmationFavorite(affirmation.id, !affirmation.isFavorite)
        }
    }

    fun saveAppreciationAnswer(answer: String) {
        val prompt = _appreciationPrompt.value ?: return
        viewModelScope.launch {
            when (val res = container.reflectionRepository.saveAppreciationAnswer(todayEpochDay, prompt, answer)) {
                is AppResult.Success -> {
                    container.evaluateBadgesUseCase(todayEpochDay)
                    _feedbackMessage.value = "Saved to your Appreciation Vault."
                }
                is AppResult.Error -> _feedbackMessage.value = res.message
            }
        }
    }

    fun swapPrompt() {
        viewModelScope.launch { loadTodayPrompt(todayEpochDay, forceSwap = true) }
    }

    fun clearFeedback() {
        _feedbackMessage.value = null
    }

    private suspend fun loadTodayPrompt(epochDay: Long, forceSwap: Boolean) {
        when (val res = container.reflectionRepository.getTodayAppreciationPrompt(epochDay, forceSwap)) {
            is AppResult.Success -> _appreciationPrompt.value = res.data
            is AppResult.Error -> _feedbackMessage.value = res.message
        }
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class HydrationViewModel(
    private val container: AppContainer
) : ViewModel() {
    private val epochDayFlow = currentEpochDayFlow()
    private val todayEpochDay: Long get() = LocalDateUtil.todayEpochDay()
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    val uiState: StateFlow<UiState<HydrationScreenData>> = combine(
        epochDayFlow.flatMapLatest { container.hydrationRepository.observeDayHydration(it) },
        container.settingsRepository.settingsFlow,
        epochDayFlow.flatMapLatest { container.hydrationRepository.observeHydrationHistory(it, 14) }
    ) { hydration, settings, history ->
        UiState.Content(HydrationScreenData(hydration, settings, history)) as UiState<HydrationScreenData>
    }
        .catch { emit(UiState.Error("Could not load hydration history.")) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UiState.Loading)

    fun logCustomAmount(amountMl: Int, vessel: WaterVessel?) {
        viewModelScope.launch {
            val res = container.logWaterUseCase(amountMl, vessel, todayEpochDay)
            if (res is AppResult.Error) _errorMessage.value = res.message
        }
    }

    fun deleteLog(logId: Long) {
        viewModelScope.launch {
            val res = container.hydrationRepository.deleteWaterLog(logId)
            if (res is AppResult.Error) _errorMessage.value = res.message
        }
    }

    fun addCustomVessel(name: String, volumeMl: Int) {
        viewModelScope.launch {
            val res = container.hydrationRepository.saveCustomVessel(name, volumeMl, "glass")
            if (res is AppResult.Error) _errorMessage.value = res.message
        }
    }

    fun archiveVessel(vesselId: Long) {
        viewModelScope.launch {
            val res = container.hydrationRepository.archiveVessel(vesselId)
            if (res is AppResult.Error) _errorMessage.value = res.message
        }
    }

    fun updateGoal(goalMl: Int) {
        viewModelScope.launch {
            val res = container.settingsRepository.updateWaterGoal(goalMl)
            if (res is AppResult.Error) _errorMessage.value = res.message
        }
    }

    fun clearError() {
        _errorMessage.value = null
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class HabitsViewModel(
    private val container: AppContainer
) : ViewModel() {
    private val epochDayFlow = currentEpochDayFlow()
    private val todayEpochDay: Long get() = LocalDateUtil.todayEpochDay()
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    val uiState: StateFlow<UiState<List<HabitItem>>> =
        epochDayFlow
            .flatMapLatest { container.habitChallengeRepository.observeHabitsForDate(it) }
            .map { list ->
                if (list.isEmpty()) {
                    UiState.Empty(
                        title = "No habits yet",
                        subtitle = "Create one small daily habit to start your calm rhythm."
                    )
                } else {
                    UiState.Content(list)
                }
            }
            .catch { emit(UiState.Error("Could not load habits.")) }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UiState.Loading)

    fun toggleHabit(habitId: Long) {
        viewModelScope.launch {
            val res = container.toggleHabitUseCase(habitId, todayEpochDay)
            if (res is AppResult.Error) _errorMessage.value = res.message
        }
    }

    fun createHabit(title: String, description: String, timeOfDay: HabitTimeOfDay) {
        viewModelScope.launch {
            val res = container.habitChallengeRepository.createHabit(
                title = title,
                description = description,
                timeOfDay = timeOfDay,
                accentKey = "violet"
            )
            if (res is AppResult.Error) _errorMessage.value = res.message
        }
    }

    fun updateHabit(habitId: Long, title: String, description: String, timeOfDay: HabitTimeOfDay) {
        viewModelScope.launch {
            val res = container.habitChallengeRepository.updateHabit(
                habitId = habitId,
                title = title,
                description = description,
                timeOfDay = timeOfDay
            )
            if (res is AppResult.Error) _errorMessage.value = res.message
        }
    }

    fun togglePause(habitId: Long, paused: Boolean) {
        viewModelScope.launch {
            val res = container.habitChallengeRepository.toggleHabitPause(habitId, paused)
            if (res is AppResult.Error) _errorMessage.value = res.message
        }
    }

    fun archiveHabit(habitId: Long) {
        viewModelScope.launch {
            val res = container.habitChallengeRepository.archiveHabit(habitId)
            if (res is AppResult.Error) _errorMessage.value = res.message
        }
    }

    fun clearError() {
        _errorMessage.value = null
    }
}

data class ReflectScreenData(
    val entries: List<JournalEntry>,
    val appreciations: List<AppreciationAnswer>,
    val appreciationPrompts: List<AppreciationPrompt>,
    val allAffirmations: List<Affirmation>,
    val favoriteAffirmations: List<Affirmation>
)

@OptIn(ExperimentalCoroutinesApi::class)
class ReflectViewModel(
    private val container: AppContainer
) : ViewModel() {
    private val todayEpochDay: Long get() = LocalDateUtil.todayEpochDay()
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _feedback = MutableStateFlow<String?>(null)
    val feedback: StateFlow<String?> = _feedback.asStateFlow()

    private val journalAndAppreciationFlow = combine(
        _searchQuery.flatMapLatest { container.reflectionRepository.observeJournalEntries(it) },
        container.reflectionRepository.observeAppreciationAnswers(),
        container.reflectionRepository.observeAllAppreciationPrompts()
    ) { entries, appreciations, prompts ->
        Triple(entries, appreciations, prompts)
    }

    val uiState: StateFlow<UiState<ReflectScreenData>> = combine(
        journalAndAppreciationFlow,
        container.reflectionRepository.observeAllAffirmations(),
        container.reflectionRepository.observeFavoriteAffirmations()
    ) { (entries, appreciations, prompts), allAffirmations, favorites ->
        UiState.Content(
            ReflectScreenData(
                entries = entries,
                appreciations = appreciations,
                appreciationPrompts = prompts,
                allAffirmations = allAffirmations,
                favoriteAffirmations = favorites
            )
        ) as UiState<ReflectScreenData>
    }
        .catch { emit(UiState.Error("Could not load reflections.")) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UiState.Loading)

    fun updateSearch(query: String) {
        _searchQuery.value = query
    }

    fun saveEntry(title: String, body: String, entryId: Long? = null) {
        viewModelScope.launch {
            when (val res = container.saveReflectionAndCheckBadgesUseCase.saveJournal(entryId, title, body)) {
                is AppResult.Success -> _feedback.value = "Reflection saved locally."
                is AppResult.Error -> _feedback.value = res.message
            }
        }
    }

    fun deleteEntry(entryId: Long) {
        viewModelScope.launch {
            val res = container.reflectionRepository.deleteJournalEntry(entryId)
            if (res is AppResult.Error) _feedback.value = res.message
        }
    }

    fun saveAppreciation(prompt: AppreciationPrompt, answerText: String) {
        viewModelScope.launch {
            when (val res = container.reflectionRepository.saveAppreciationAnswer(todayEpochDay, prompt, answerText)) {
                is AppResult.Success -> {
                    container.evaluateBadgesUseCase(todayEpochDay)
                    _feedback.value = "Saved to your Self-Appreciation Vault."
                }
                is AppResult.Error -> _feedback.value = res.message
            }
        }
    }

    fun deleteAppreciation(answerId: Long) {
        viewModelScope.launch {
            val res = container.reflectionRepository.deleteAppreciationAnswer(answerId)
            if (res is AppResult.Error) _feedback.value = res.message
        }
    }

    fun toggleAffirmationFavorite(affirmation: Affirmation) {
        viewModelScope.launch {
            container.reflectionRepository.toggleAffirmationFavorite(affirmation.id, !affirmation.isFavorite)
        }
    }

    fun clearFeedback() {
        _feedback.value = null
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class ProgressViewModel(
    private val container: AppContainer
) : ViewModel() {
    private val epochDayFlow = currentEpochDayFlow()
    private val todayEpochDay: Long get() = LocalDateUtil.todayEpochDay()
    private val _feedback = MutableStateFlow<String?>(null)
    val feedback: StateFlow<String?> = _feedback.asStateFlow()

    val uiState: StateFlow<UiState<Pair<ProgressOverview, UserSettings>>> = combine(
        epochDayFlow.flatMapLatest { container.progressRepository.observeProgressOverview(it) },
        container.settingsRepository.settingsFlow
    ) { overview, settings ->
        UiState.Content(overview to settings) as UiState<Pair<ProgressOverview, UserSettings>>
    }
        .catch { emit(UiState.Error("Could not load progress overview.")) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UiState.Loading)

    val rewardAccessState: StateFlow<RewardAccessState?> =
        container.rewardAccessManager.observeRewardAccessState()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    val adUiState: StateFlow<RewardedAdUiState> = container.rewardedAdController.adUiState
    val consentState: StateFlow<PrivacyConsentUiState> = container.privacyConsentManager.consentState

    fun refreshWeeklySummary() {
        viewModelScope.launch {
            when (val res = container.buildWeeklySummaryUseCase(todayEpochDay)) {
                is AppResult.Success -> _feedback.value = "Weekly Tide summary updated."
                is AppResult.Error -> _feedback.value = res.message
            }
        }
    }

    fun startOptionalVisualThemesAd(activity: Activity) {
        container.rewardedAdController.loadAndShowRewardedAd(
            activity = activity,
            level = RewardLevel.LEVEL_4_VISUAL_THEMES
        )
    }

    fun clearAdUiState() {
        container.rewardedAdController.resetAdState()
    }

    fun clearFeedback() {
        _feedback.value = null
    }
}

class SettingsViewModel(
    private val container: AppContainer
) : ViewModel() {
    private val _feedback = MutableStateFlow<String?>(null)
    val feedback: StateFlow<String?> = _feedback.asStateFlow()

    val uiState: StateFlow<UiState<UserSettings>> = container.settingsRepository.settingsFlow
        .map<UserSettings, UiState<UserSettings>> { UiState.Content(it) }
        .catch { emit(UiState.Error("Unable to load settings.")) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UiState.Loading)

    val rewardAccessState: StateFlow<RewardAccessState?> =
        container.rewardAccessManager.observeRewardAccessState()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    val adUiState: StateFlow<RewardedAdUiState> = container.rewardedAdController.adUiState
    val consentState: StateFlow<PrivacyConsentUiState> = container.privacyConsentManager.consentState
    val activeRewardedAdUnitId: String = container.rewardedAdController.activeAdUnitId

    fun updateDisplayName(name: String) {
        viewModelScope.launch {
            val res = container.settingsRepository.updateDisplayName(name)
            _feedback.value = if (res is AppResult.Success) "Name updated." else (res as AppResult.Error).message
        }
    }

    fun updateUnit(unit: MeasurementUnit) {
        viewModelScope.launch { container.settingsRepository.updateUnit(unit) }
    }

    fun updateTheme(themeMode: ThemeMode) {
        viewModelScope.launch { container.settingsRepository.updateThemeMode(themeMode) }
    }

    fun updateWaterGoal(goalMl: Int) {
        viewModelScope.launch { container.settingsRepository.updateWaterGoal(goalMl) }
    }

    fun updateReminders(
        current: UserSettings,
        enabled: Boolean,
        intervalMinutes: Int = current.reminderIntervalMinutes
    ) {
        viewModelScope.launch {
            container.settingsRepository.updateReminderSettings(
                enabled = enabled,
                mode = ReminderMode.INTERVAL,
                intervalMinutes = intervalMinutes,
                quietStartMinute = current.quietHoursStartMinute,
                quietEndMinute = current.quietHoursEndMinute
            )
            val updated = current.copy(
                remindersEnabled = enabled,
                reminderIntervalMinutes = intervalMinutes
            )
            container.reminderScheduler.syncSchedules(updated)
            _feedback.value = if (enabled) {
                "Drinking water reminders scheduled every $intervalMinutes min."
            } else {
                "Drinking water reminders paused."
            }
        }
    }

    fun updateCategoryReminders(
        current: UserSettings,
        reflectionEnabled: Boolean = current.reflectionRemindersEnabled,
        reflectionFrequency: ReminderFrequency = current.reflectionFrequency,
        reflectionTimeMinute: Int = current.reflectionTimeMinute,
        habitEnabled: Boolean = current.habitRemindersEnabled,
        habitFrequency: ReminderFrequency = current.habitFrequency,
        habitTimeMinute: Int = current.habitTimeMinute,
        selfCareEnabled: Boolean = current.selfCareRemindersEnabled,
        selfCareFrequency: ReminderFrequency = current.selfCareFrequency,
        selfCareTimeMinute: Int = current.selfCareTimeMinute
    ) {
        viewModelScope.launch {
            container.settingsRepository.updateCategoryReminders(
                reflectionEnabled = reflectionEnabled,
                reflectionFrequency = reflectionFrequency,
                reflectionTimeMinute = reflectionTimeMinute,
                habitEnabled = habitEnabled,
                habitFrequency = habitFrequency,
                habitTimeMinute = habitTimeMinute,
                selfCareEnabled = selfCareEnabled,
                selfCareFrequency = selfCareFrequency,
                selfCareTimeMinute = selfCareTimeMinute
            )
            val updated = current.copy(
                reflectionRemindersEnabled = reflectionEnabled,
                reflectionFrequency = reflectionFrequency,
                reflectionTimeMinute = reflectionTimeMinute,
                habitRemindersEnabled = habitEnabled,
                habitFrequency = habitFrequency,
                habitTimeMinute = habitTimeMinute,
                selfCareRemindersEnabled = selfCareEnabled,
                selfCareFrequency = selfCareFrequency,
                selfCareTimeMinute = selfCareTimeMinute
            )
            container.reminderScheduler.syncSchedules(updated)
            _feedback.value = "Local reminder schedule updated."
        }
    }

    fun updateDailyAndFeedbackReminders(
        current: UserSettings,
        dailyUseEnabled: Boolean = current.dailyUseReminderEnabled,
        dailyUseTimeMinute: Int = current.dailyUseReminderTimeMinute,
        feedbackNotificationEnabled: Boolean = current.feedbackNotificationEnabled
    ) {
        viewModelScope.launch {
            container.settingsRepository.updateDailyAndFeedbackReminders(
                dailyUseEnabled = dailyUseEnabled,
                dailyUseTimeMinute = dailyUseTimeMinute,
                feedbackNotificationEnabled = feedbackNotificationEnabled
            )
            val updated = current.copy(
                dailyUseReminderEnabled = dailyUseEnabled,
                dailyUseReminderTimeMinute = dailyUseTimeMinute,
                feedbackNotificationEnabled = feedbackNotificationEnabled
            )
            container.reminderScheduler.syncSchedules(updated)
            _feedback.value = "Daily check-in & feedback notification settings updated."
        }
    }

    fun exportLocalBackupJson(onReady: (String) -> Unit) {
        viewModelScope.launch {
            when (val res = container.localDataBackupManager.exportAllToJson()) {
                is AppResult.Success -> onReady(res.data)
                is AppResult.Error -> _feedback.value = res.message
            }
        }
    }

    fun importLocalBackupJson(rawJson: String) {
        viewModelScope.launch {
            when (val res = container.localDataBackupManager.importFromJson(rawJson)) {
                is AppResult.Success -> _feedback.value = res.data
                is AppResult.Error -> _feedback.value = res.message
            }
        }
    }

    fun clearAllApplicationData(onCleared: () -> Unit) {
        viewModelScope.launch {
            when (val res = container.localDataBackupManager.clearAllApplicationData()) {
                is AppResult.Success -> {
                    _feedback.value = "All local data cleared."
                    onCleared()
                }
                is AppResult.Error -> _feedback.value = res.message
            }
        }
    }

    fun postFeedback(message: String) {
        _feedback.value = message
    }

    fun startOptionalRewardedAd(activity: Activity, level: RewardLevel) {
        container.rewardedAdController.loadAndShowRewardedAd(activity, level)
    }

    fun openAdPrivacyOptions(activity: Activity) {
        container.privacyConsentManager.showPrivacyOptionsForm(activity) { errorMessage ->
            _feedback.value = errorMessage ?: "Ad privacy preferences updated."
            if (container.privacyConsentManager.canRequestAds) {
                container.rewardedAdController.initializeSdkIfAllowed()
            }
        }
    }

    fun resetAdUiState() {
        container.rewardedAdController.resetAdState()
    }

    fun simulateExpirationForTesting(level: RewardLevel) {
        if (!com.violetdolphinstudio.dailytide.BuildConfig.DEBUG) return
        viewModelScope.launch {
            container.rewardAccessManager.expireLevelNowForTesting(level)
            _feedback.value = "Level ${level.levelNumber} (${level.title}) expired and re-locked."
        }
    }

    fun refreshRewardExpirations() {
        viewModelScope.launch {
            container.rewardAccessManager.sweepExpirations()
        }
    }

    fun clearFeedback() {
        _feedback.value = null
    }
}

class DailyTideViewModelFactory(
    private val container: AppContainer
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = when (modelClass) {
        AppRootViewModel::class.java -> AppRootViewModel(container) as T
        TodayViewModel::class.java -> TodayViewModel(container) as T
        HydrationViewModel::class.java -> HydrationViewModel(container) as T
        HabitsViewModel::class.java -> HabitsViewModel(container) as T
        ReflectViewModel::class.java -> ReflectViewModel(container) as T
        ProgressViewModel::class.java -> ProgressViewModel(container) as T
        SettingsViewModel::class.java -> SettingsViewModel(container) as T
        else -> throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
    }
}

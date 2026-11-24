package com.violetdolphinstudio.dailytide.domain.repository

import com.violetdolphinstudio.dailytide.domain.model.AchievementBadge
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
import com.violetdolphinstudio.dailytide.domain.model.MeasurementUnit
import com.violetdolphinstudio.dailytide.domain.model.MoodCheckIn
import com.violetdolphinstudio.dailytide.domain.model.MoodLevel
import com.violetdolphinstudio.dailytide.domain.model.ProgressOverview
import com.violetdolphinstudio.dailytide.domain.model.ReminderFrequency
import com.violetdolphinstudio.dailytide.domain.model.ReminderMode
import com.violetdolphinstudio.dailytide.domain.model.ThemeMode
import com.violetdolphinstudio.dailytide.domain.model.UserSettings
import com.violetdolphinstudio.dailytide.domain.model.WaterVessel
import com.violetdolphinstudio.dailytide.domain.model.WeeklySummary
import kotlinx.coroutines.flow.Flow

interface SettingsRepository {
    val settingsFlow: Flow<UserSettings>
    suspend fun completeOnboarding(
        displayName: String,
        unit: MeasurementUnit,
        dailyGoalMl: Int,
        remindersEnabled: Boolean
    ): AppResult<Unit>
    suspend fun updateDisplayName(name: String): AppResult<Unit>
    suspend fun updateWaterGoal(goalMl: Int): AppResult<Unit>
    suspend fun updateUnit(unit: MeasurementUnit): AppResult<Unit>
    suspend fun updateThemeMode(themeMode: ThemeMode): AppResult<Unit>
    suspend fun updateReminderSettings(
        enabled: Boolean,
        mode: ReminderMode,
        intervalMinutes: Int,
        quietStartMinute: Int,
        quietEndMinute: Int
    ): AppResult<Unit>
    suspend fun updateCategoryReminders(
        reflectionEnabled: Boolean,
        reflectionFrequency: ReminderFrequency,
        reflectionTimeMinute: Int,
        habitEnabled: Boolean,
        habitFrequency: ReminderFrequency,
        habitTimeMinute: Int,
        selfCareEnabled: Boolean,
        selfCareFrequency: ReminderFrequency,
        selfCareTimeMinute: Int
    ): AppResult<Unit>
    suspend fun updateDailyAndFeedbackReminders(
        dailyUseEnabled: Boolean,
        dailyUseTimeMinute: Int,
        feedbackNotificationEnabled: Boolean
    ): AppResult<Unit>
    suspend fun incrementSessionCount(): AppResult<Int>
    suspend fun markPostUseFeedbackSent(): AppResult<Unit>
    suspend fun updateQuietHours(startMinute: Int, endMinute: Int): AppResult<Unit>
    suspend fun restoreFromBackup(settings: UserSettings): AppResult<Unit>
    suspend fun clearAllPreferences(): AppResult<Unit>
    suspend fun unlockRewardItem(rewardId: String): AppResult<Unit>
}

interface HydrationRepository {
    fun observeDayHydration(dateEpochDay: Long): Flow<HydrationDayState>
    fun observeHydrationHistory(endEpochDay: Long, days: Int = 14): Flow<List<DailyActivityPoint>>
    fun observeVessels(): Flow<List<WaterVessel>>
    suspend fun logWater(dateEpochDay: Long, amountMl: Int, vessel: WaterVessel?): AppResult<Long>
    suspend fun deleteWaterLog(logId: Long): AppResult<Unit>
    suspend fun saveCustomVessel(name: String, volumeMl: Int, iconKey: String): AppResult<Long>
    suspend fun archiveVessel(vesselId: Long): AppResult<Unit>
    suspend fun getLastLoggedTimestamp(dateEpochDay: Long): Long?
    suspend fun getTodayConsumedMl(dateEpochDay: Long): Int
    suspend fun getDefaultVessel(): WaterVessel?
}

interface ReflectionRepository {
    fun observeTodayMoods(dateEpochDay: Long): Flow<List<MoodCheckIn>>
    fun observeRecentMoods(limit: Int = 30): Flow<List<MoodCheckIn>>
    fun observeJournalEntries(query: String = ""): Flow<List<JournalEntry>>
    fun observeAppreciationAnswers(): Flow<List<AppreciationAnswer>>
    fun observeAllAppreciationPrompts(): Flow<List<AppreciationPrompt>>
    fun observeTodayAffirmation(dateEpochDay: Long, latestMood: MoodLevel?): Flow<Affirmation?>
    fun observeAllAffirmations(): Flow<List<Affirmation>>
    fun observeFavoriteAffirmations(): Flow<List<Affirmation>>
    suspend fun getTodayAppreciationPrompt(dateEpochDay: Long, forceSwap: Boolean = false): AppResult<AppreciationPrompt>
    suspend fun saveMoodCheckIn(dateEpochDay: Long, mood: MoodLevel, tags: List<String>, note: String?): AppResult<Long>
    suspend fun deleteMoodCheckIn(moodId: Long): AppResult<Unit>
    suspend fun saveJournalEntry(
        entryId: Long?,
        dateEpochDay: Long,
        title: String,
        body: String,
        mood: MoodLevel?
    ): AppResult<Long>
    suspend fun deleteJournalEntry(entryId: Long): AppResult<Unit>
    suspend fun saveAppreciationAnswer(dateEpochDay: Long, prompt: AppreciationPrompt, answerText: String): AppResult<Long>
    suspend fun deleteAppreciationAnswer(answerId: Long): AppResult<Unit>
    suspend fun toggleAffirmationFavorite(affirmationId: String, isFavorite: Boolean): AppResult<Unit>
}

interface HabitChallengeRepository {
    fun observeHabitsForDate(dateEpochDay: Long): Flow<List<HabitItem>>
    fun observeDailyChallenge(dateEpochDay: Long): Flow<DailyChallengeState?>
    suspend fun ensureDailyChallengeAssigned(dateEpochDay: Long): AppResult<Unit>
    suspend fun completeDailyChallenge(dateEpochDay: Long): AppResult<Unit>
    suspend fun swapDailyChallenge(dateEpochDay: Long, allowExtraSwap: Boolean = false): AppResult<Unit>
    suspend fun skipDailyChallenge(dateEpochDay: Long): AppResult<Unit>
    suspend fun createHabit(
        title: String,
        description: String,
        timeOfDay: HabitTimeOfDay,
        accentKey: String,
        targetCountPerDay: Int = 1
    ): AppResult<Long>
    suspend fun updateHabit(
        habitId: Long,
        title: String,
        description: String,
        timeOfDay: HabitTimeOfDay
    ): AppResult<Unit>
    suspend fun toggleHabitCompletion(habitId: Long, dateEpochDay: Long): AppResult<Boolean>
    suspend fun toggleHabitPause(habitId: Long, isPaused: Boolean): AppResult<Unit>
    suspend fun archiveHabit(habitId: Long): AppResult<Unit>
}

interface ProgressRepository {
    fun observeProgressOverview(todayEpochDay: Long): Flow<ProgressOverview>
    fun observeBadges(): Flow<List<AchievementBadge>>
    fun observeWeeklySummaries(): Flow<List<WeeklySummary>>
    suspend fun evaluateAndUnlockBadges(todayEpochDay: Long): AppResult<List<AchievementBadge>>
    suspend fun generateWeeklySummary(todayEpochDay: Long): AppResult<WeeklySummary>
}

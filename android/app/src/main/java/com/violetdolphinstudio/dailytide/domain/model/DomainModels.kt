package com.violetdolphinstudio.dailytide.domain.model

import java.time.LocalDate

sealed interface AppResult<out T> {
    data class Success<T>(val data: T) : AppResult<T>
    data class Error(val message: String, val cause: Throwable? = null) : AppResult<Nothing>
}

sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data class Content<T>(val data: T) : UiState<T>
    data class Empty(val title: String, val subtitle: String) : UiState<Nothing>
    data class Error(val message: String) : UiState<Nothing>
}

enum class MeasurementUnit(val symbol: String) {
    ML("ml"),
    L("L"),
    OZ("oz");

    fun formatVolume(ml: Int): String = when (this) {
        ML -> "$ml ml"
        L -> {
            val litres = ml / 1000.0
            val formatted = String.format(java.util.Locale.US, "%.2f", litres)
                .trimEnd('0')
                .trimEnd('.')
            "$formatted L"
        }
        OZ -> "${(ml / 29.5735).toInt()} oz"
    }
}

enum class ThemeMode {
    SYSTEM,
    WARM_IVORY,
    MIDNIGHT_TIDE
}

enum class ReminderMode {
    INTERVAL,
    CUSTOM_TIMES
}

enum class ReminderFrequency(val label: String) {
    DAILY("Daily"),
    WEEKDAYS("Weekdays"),
    EVERY_2_DAYS("Every 2 Days"),
    TWICE_DAILY("Twice Daily"),
    WEEKLY("Weekly")
}

enum class MoodLevel(val level: Int, val label: String, val gentleSummary: String) {
    HEAVY(1, "Heavy", "Take things one gentle breath at a time."),
    LOW_TIDE(2, "Low Tide", "Quiet days still count. Be soft with yourself."),
    STEADY(3, "Steady", "Grounded, balanced, and moving at your pace."),
    CALM(4, "Calm", "A clear, unhurried rhythm today."),
    RADIANT(5, "Radiant", "Bright energy—savor what feels good today.");

    companion object {
        fun fromLevel(level: Int): MoodLevel = entries.firstOrNull { it.level == level } ?: STEADY
    }
}

enum class HabitTimeOfDay(val label: String) {
    MORNING("Morning"),
    AFTERNOON("Afternoon"),
    EVENING("Evening"),
    ANYTIME("Anytime")
}

enum class ChallengeStatus {
    ASSIGNED,
    COMPLETED,
    SKIPPED
}

enum class ShareCardTheme(
    val id: String,
    val title: String,
    val isRewardLocked: Boolean
) {
    WARM_IVORY("warm_ivory", "Warm Ivory", false),
    OCEAN_MIST("ocean_mist", "Ocean Mist", false),
    VIOLET_DUSK("violet_dusk", "Violet Dusk", true),
    MIDNIGHT_TIDE("midnight_tide", "Midnight Tide", true)
}

data class UserSettings(
    val hasCompletedOnboarding: Boolean = false,
    val displayName: String = "Friend",
    val unit: MeasurementUnit = MeasurementUnit.ML,
    val dailyWaterGoalMl: Int = 2000,
    val themeMode: ThemeMode = ThemeMode.WARM_IVORY,
    val remindersEnabled: Boolean = false,
    val reminderMode: ReminderMode = ReminderMode.INTERVAL,
    val reminderIntervalMinutes: Int = 120,
    val reflectionRemindersEnabled: Boolean = false,
    val reflectionFrequency: ReminderFrequency = ReminderFrequency.DAILY,
    val reflectionTimeMinute: Int = 20 * 60 + 30,
    val habitRemindersEnabled: Boolean = false,
    val habitFrequency: ReminderFrequency = ReminderFrequency.DAILY,
    val habitTimeMinute: Int = 9 * 60,
    val selfCareRemindersEnabled: Boolean = false,
    val selfCareFrequency: ReminderFrequency = ReminderFrequency.EVERY_2_DAYS,
    val selfCareTimeMinute: Int = 15 * 60,
    val dailyUseReminderEnabled: Boolean = false,
    val dailyUseReminderTimeMinute: Int = 8 * 60 + 30,
    val feedbackNotificationEnabled: Boolean = true,
    val hasSentPostUseFeedbackNotification: Boolean = false,
    val appSessionCount: Int = 0,
    val quietHoursStartMinute: Int = 22 * 60,
    val quietHoursEndMinute: Int = 7 * 60 + 30,
    val unlockedRewardIds: Set<String> = emptySet()
)

data class WaterVessel(
    val id: Long = 0,
    val name: String,
    val volumeMl: Int,
    val iconKey: String,
    val sortOrder: Int = 0,
    val isDefault: Boolean = false
)

data class WaterLog(
    val id: Long = 0,
    val dateEpochDay: Long,
    val loggedAtMillis: Long,
    val amountMl: Int,
    val vesselId: Long?,
    val vesselName: String
)

data class HydrationDayState(
    val dateEpochDay: Long,
    val consumedMl: Int,
    val goalMl: Int,
    val logs: List<WaterLog>,
    val vessels: List<WaterVessel>
) {
    val progressFraction: Float
        get() = if (goalMl <= 0) 0f else (consumedMl.toFloat() / goalMl.toFloat()).coerceIn(0f, 1.25f)

    val isGoalReached: Boolean
        get() = consumedMl >= goalMl && goalMl > 0
}

data class MoodCheckIn(
    val id: Long = 0,
    val dateEpochDay: Long,
    val createdAtMillis: Long,
    val mood: MoodLevel,
    val tags: List<String>,
    val note: String?
)

data class JournalEntry(
    val id: Long = 0,
    val dateEpochDay: Long,
    val createdAtMillis: Long,
    val updatedAtMillis: Long,
    val title: String,
    val body: String,
    val mood: MoodLevel?,
    val isFavorite: Boolean
)

data class AppreciationPrompt(
    val id: String,
    val promptText: String,
    val category: String
)

data class AppreciationAnswer(
    val id: Long = 0,
    val dateEpochDay: Long,
    val promptId: String,
    val promptText: String,
    val answerText: String,
    val createdAtMillis: Long
)

data class Affirmation(
    val id: String,
    val text: String,
    val toneCategory: String,
    val isFavorite: Boolean
)

data class SelfCareChallenge(
    val id: String,
    val title: String,
    val description: String,
    val category: String,
    val durationMinutes: Int
)

data class DailyChallengeState(
    val dateEpochDay: Long,
    val challenge: SelfCareChallenge,
    val status: ChallengeStatus,
    val swapsUsed: Int
)

data class HabitItem(
    val id: Long = 0,
    val title: String,
    val description: String,
    val timeOfDay: HabitTimeOfDay,
    val accentKey: String,
    val targetCountPerDay: Int = 1,
    val isPaused: Boolean = false,
    val completedTodayCount: Int = 0,
    val isCompletedToday: Boolean = false,
    val recentSevenDays: List<Boolean> = emptyList()
)

data class AchievementBadge(
    val id: String,
    val title: String,
    val description: String,
    val category: String,
    val unlockedAtMillis: Long?,
    val progressCurrent: Int,
    val progressTarget: Int
) {
    val isUnlocked: Boolean get() = unlockedAtMillis != null
}

data class WeeklySummary(
    val weekStartEpochDay: Long,
    val weekEndEpochDay: Long,
    val totalWaterMl: Int,
    val hydrationGoalDaysMet: Int,
    val habitCompletionRate: Float,
    val topHabitTitle: String?,
    val dominantMood: MoodLevel?,
    val challengesCompleted: Int,
    val highlightAppreciation: String?,
    val insightMessage: String,
    val generatedAtMillis: Long
)

data class DailyActivityPoint(
    val epochDay: Long,
    val waterMl: Int,
    val goalMl: Int,
    val habitsCompleted: Int,
    val mood: MoodLevel?
)

data class ProgressOverview(
    val consistencyScorePercent: Int,
    val activeDaysLast21: Int,
    val totalWaterLogsCount: Int,
    val last7Days: List<DailyActivityPoint>,
    val badges: List<AchievementBadge>,
    val latestWeeklySummary: WeeklySummary?
)

object LocalDateUtil {
    fun todayEpochDay(): Long = LocalDate.now().toEpochDay()
}

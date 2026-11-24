package com.violetdolphinstudio.dailytide.data.local.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.violetdolphinstudio.dailytide.domain.model.AppResult
import com.violetdolphinstudio.dailytide.domain.model.MeasurementUnit
import com.violetdolphinstudio.dailytide.domain.model.ReminderFrequency
import com.violetdolphinstudio.dailytide.domain.model.ReminderMode
import com.violetdolphinstudio.dailytide.domain.model.ThemeMode
import com.violetdolphinstudio.dailytide.domain.model.UserSettings
import com.violetdolphinstudio.dailytide.domain.repository.SettingsRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

private val Context.dailyTideDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "daily_tide_preferences"
)

class UserPreferencesDataStore(
    private val context: Context
) : SettingsRepository {

    private object Keys {
        val HAS_ONBOARDED = booleanPreferencesKey("has_completed_onboarding")
        val DISPLAY_NAME = stringPreferencesKey("display_name")
        val UNIT = stringPreferencesKey("measurement_unit")
        val WATER_GOAL_ML = intPreferencesKey("daily_water_goal_ml")
        val THEME_MODE = stringPreferencesKey("theme_mode")
        val REMINDERS_ENABLED = booleanPreferencesKey("reminders_enabled")
        val REMINDER_MODE = stringPreferencesKey("reminder_mode")
        val REMINDER_INTERVAL_MIN = intPreferencesKey("reminder_interval_min")
        val REFLECTION_ENABLED = booleanPreferencesKey("reflection_reminders_enabled")
        val REFLECTION_FREQ = stringPreferencesKey("reflection_frequency")
        val REFLECTION_TIME_MIN = intPreferencesKey("reflection_time_min")
        val HABIT_ENABLED = booleanPreferencesKey("habit_reminders_enabled")
        val HABIT_FREQ = stringPreferencesKey("habit_frequency")
        val HABIT_TIME_MIN = intPreferencesKey("habit_time_min")
        val SELF_CARE_ENABLED = booleanPreferencesKey("self_care_reminders_enabled")
        val SELF_CARE_FREQ = stringPreferencesKey("self_care_frequency")
        val SELF_CARE_TIME_MIN = intPreferencesKey("self_care_time_min")
        val DAILY_USE_ENABLED = booleanPreferencesKey("daily_use_reminder_enabled")
        val DAILY_USE_TIME_MIN = intPreferencesKey("daily_use_reminder_time_min")
        val FEEDBACK_NOTIF_ENABLED = booleanPreferencesKey("feedback_notification_enabled")
        val FEEDBACK_NOTIF_SENT = booleanPreferencesKey("has_sent_post_use_feedback")
        val APP_SESSION_COUNT = intPreferencesKey("app_session_count")
        val QUIET_START_MIN = intPreferencesKey("quiet_hours_start_min")
        val QUIET_END_MIN = intPreferencesKey("quiet_hours_end_min")
        val UNLOCKED_REWARDS = stringSetPreferencesKey("unlocked_reward_ids")
    }

    override val settingsFlow: Flow<UserSettings> = context.dailyTideDataStore.data
        .catch { exception ->
            if (exception is IOException) {
                emit(emptyPreferences())
            } else {
                throw exception
            }
        }
        .map { prefs ->
            UserSettings(
                hasCompletedOnboarding = prefs[Keys.HAS_ONBOARDED] ?: false,
                displayName = prefs[Keys.DISPLAY_NAME]?.takeIf { it.isNotBlank() } ?: "Friend",
                unit = prefs[Keys.UNIT]?.let { runCatching { MeasurementUnit.valueOf(it) }.getOrNull() }
                    ?: MeasurementUnit.ML,
                dailyWaterGoalMl = (prefs[Keys.WATER_GOAL_ML] ?: 2000).coerceIn(500, 6000),
                themeMode = prefs[Keys.THEME_MODE]?.let { runCatching { ThemeMode.valueOf(it) }.getOrNull() }
                    ?: ThemeMode.WARM_IVORY,
                // Opt-in only: reminders default OFF so notification permission is only requested when user enables them
                remindersEnabled = prefs[Keys.REMINDERS_ENABLED] ?: false,
                reminderMode = prefs[Keys.REMINDER_MODE]?.let { runCatching { ReminderMode.valueOf(it) }.getOrNull() }
                    ?: ReminderMode.INTERVAL,
                reminderIntervalMinutes = (prefs[Keys.REMINDER_INTERVAL_MIN] ?: 120).coerceIn(30, 360),
                reflectionRemindersEnabled = prefs[Keys.REFLECTION_ENABLED] ?: false,
                reflectionFrequency = prefs[Keys.REFLECTION_FREQ]?.let {
                    runCatching { ReminderFrequency.valueOf(it) }.getOrNull()
                } ?: ReminderFrequency.DAILY,
                reflectionTimeMinute = (prefs[Keys.REFLECTION_TIME_MIN] ?: (20 * 60 + 30)).coerceIn(0, 1439),
                habitRemindersEnabled = prefs[Keys.HABIT_ENABLED] ?: false,
                habitFrequency = prefs[Keys.HABIT_FREQ]?.let {
                    runCatching { ReminderFrequency.valueOf(it) }.getOrNull()
                } ?: ReminderFrequency.DAILY,
                habitTimeMinute = (prefs[Keys.HABIT_TIME_MIN] ?: (9 * 60)).coerceIn(0, 1439),
                selfCareRemindersEnabled = prefs[Keys.SELF_CARE_ENABLED] ?: false,
                selfCareFrequency = prefs[Keys.SELF_CARE_FREQ]?.let {
                    runCatching { ReminderFrequency.valueOf(it) }.getOrNull()
                } ?: ReminderFrequency.EVERY_2_DAYS,
                selfCareTimeMinute = (prefs[Keys.SELF_CARE_TIME_MIN] ?: (15 * 60)).coerceIn(0, 1439),
                dailyUseReminderEnabled = prefs[Keys.DAILY_USE_ENABLED] ?: false,
                dailyUseReminderTimeMinute = (prefs[Keys.DAILY_USE_TIME_MIN] ?: (8 * 60 + 30)).coerceIn(0, 1439),
                feedbackNotificationEnabled = prefs[Keys.FEEDBACK_NOTIF_ENABLED] ?: true,
                hasSentPostUseFeedbackNotification = prefs[Keys.FEEDBACK_NOTIF_SENT] ?: false,
                appSessionCount = (prefs[Keys.APP_SESSION_COUNT] ?: 0).coerceAtLeast(0),
                quietHoursStartMinute = (prefs[Keys.QUIET_START_MIN] ?: (22 * 60)).coerceIn(0, 1439),
                quietHoursEndMinute = (prefs[Keys.QUIET_END_MIN] ?: (7 * 60 + 30)).coerceIn(0, 1439),
                unlockedRewardIds = prefs[Keys.UNLOCKED_REWARDS] ?: emptySet()
            )
        }

    override suspend fun completeOnboarding(
        displayName: String,
        unit: MeasurementUnit,
        dailyGoalMl: Int,
        remindersEnabled: Boolean
    ): AppResult<Unit> = safeEdit { prefs ->
        prefs[Keys.HAS_ONBOARDED] = true
        prefs[Keys.DISPLAY_NAME] = displayName.trim().ifBlank { "Friend" }
        prefs[Keys.UNIT] = unit.name
        prefs[Keys.WATER_GOAL_ML] = dailyGoalMl.coerceIn(500, 6000)
        prefs[Keys.REMINDERS_ENABLED] = remindersEnabled
    }

    override suspend fun updateDisplayName(name: String): AppResult<Unit> = safeEdit { prefs ->
        prefs[Keys.DISPLAY_NAME] = name.trim().ifBlank { "Friend" }
    }

    override suspend fun updateWaterGoal(goalMl: Int): AppResult<Unit> = safeEdit { prefs ->
        prefs[Keys.WATER_GOAL_ML] = goalMl.coerceIn(500, 6000)
    }

    override suspend fun updateUnit(unit: MeasurementUnit): AppResult<Unit> = safeEdit { prefs ->
        prefs[Keys.UNIT] = unit.name
    }

    override suspend fun updateThemeMode(themeMode: ThemeMode): AppResult<Unit> = safeEdit { prefs ->
        prefs[Keys.THEME_MODE] = themeMode.name
    }

    override suspend fun updateReminderSettings(
        enabled: Boolean,
        mode: ReminderMode,
        intervalMinutes: Int,
        quietStartMinute: Int,
        quietEndMinute: Int
    ): AppResult<Unit> = safeEdit { prefs ->
        prefs[Keys.REMINDERS_ENABLED] = enabled
        prefs[Keys.REMINDER_MODE] = mode.name
        prefs[Keys.REMINDER_INTERVAL_MIN] = intervalMinutes.coerceIn(30, 360)
        prefs[Keys.QUIET_START_MIN] = quietStartMinute.coerceIn(0, 1439)
        prefs[Keys.QUIET_END_MIN] = quietEndMinute.coerceIn(0, 1439)
    }

    override suspend fun updateCategoryReminders(
        reflectionEnabled: Boolean,
        reflectionFrequency: ReminderFrequency,
        reflectionTimeMinute: Int,
        habitEnabled: Boolean,
        habitFrequency: ReminderFrequency,
        habitTimeMinute: Int,
        selfCareEnabled: Boolean,
        selfCareFrequency: ReminderFrequency,
        selfCareTimeMinute: Int
    ): AppResult<Unit> = safeEdit { prefs ->
        prefs[Keys.REFLECTION_ENABLED] = reflectionEnabled
        prefs[Keys.REFLECTION_FREQ] = reflectionFrequency.name
        prefs[Keys.REFLECTION_TIME_MIN] = reflectionTimeMinute.coerceIn(0, 1439)
        prefs[Keys.HABIT_ENABLED] = habitEnabled
        prefs[Keys.HABIT_FREQ] = habitFrequency.name
        prefs[Keys.HABIT_TIME_MIN] = habitTimeMinute.coerceIn(0, 1439)
        prefs[Keys.SELF_CARE_ENABLED] = selfCareEnabled
        prefs[Keys.SELF_CARE_FREQ] = selfCareFrequency.name
        prefs[Keys.SELF_CARE_TIME_MIN] = selfCareTimeMinute.coerceIn(0, 1439)
    }

    override suspend fun updateDailyAndFeedbackReminders(
        dailyUseEnabled: Boolean,
        dailyUseTimeMinute: Int,
        feedbackNotificationEnabled: Boolean
    ): AppResult<Unit> = safeEdit { prefs ->
        prefs[Keys.DAILY_USE_ENABLED] = dailyUseEnabled
        prefs[Keys.DAILY_USE_TIME_MIN] = dailyUseTimeMinute.coerceIn(0, 1439)
        prefs[Keys.FEEDBACK_NOTIF_ENABLED] = feedbackNotificationEnabled
    }

    override suspend fun incrementSessionCount(): AppResult<Int> = try {
        var nextCount = 1
        context.dailyTideDataStore.edit { prefs ->
            nextCount = (prefs[Keys.APP_SESSION_COUNT] ?: 0) + 1
            prefs[Keys.APP_SESSION_COUNT] = nextCount
        }
        AppResult.Success(nextCount)
    } catch (e: Exception) {
        AppResult.Error("Unable to update local session count.", e)
    }

    override suspend fun markPostUseFeedbackSent(): AppResult<Unit> = safeEdit { prefs ->
        prefs[Keys.FEEDBACK_NOTIF_SENT] = true
    }

    override suspend fun updateQuietHours(startMinute: Int, endMinute: Int): AppResult<Unit> =
        safeEdit { prefs ->
            prefs[Keys.QUIET_START_MIN] = startMinute.coerceIn(0, 1439)
            prefs[Keys.QUIET_END_MIN] = endMinute.coerceIn(0, 1439)
        }

    override suspend fun restoreFromBackup(settings: UserSettings): AppResult<Unit> =
        safeEdit { prefs ->
            prefs[Keys.HAS_ONBOARDED] = settings.hasCompletedOnboarding
            prefs[Keys.DISPLAY_NAME] = settings.displayName.trim().ifBlank { "Friend" }
            prefs[Keys.UNIT] = settings.unit.name
            prefs[Keys.WATER_GOAL_ML] = settings.dailyWaterGoalMl.coerceIn(500, 6000)
            prefs[Keys.THEME_MODE] = settings.themeMode.name
            prefs[Keys.REMINDERS_ENABLED] = settings.remindersEnabled
            prefs[Keys.REMINDER_MODE] = settings.reminderMode.name
            prefs[Keys.REMINDER_INTERVAL_MIN] = settings.reminderIntervalMinutes.coerceIn(30, 360)
            prefs[Keys.REFLECTION_ENABLED] = settings.reflectionRemindersEnabled
            prefs[Keys.REFLECTION_FREQ] = settings.reflectionFrequency.name
            prefs[Keys.REFLECTION_TIME_MIN] = settings.reflectionTimeMinute.coerceIn(0, 1439)
            prefs[Keys.HABIT_ENABLED] = settings.habitRemindersEnabled
            prefs[Keys.HABIT_FREQ] = settings.habitFrequency.name
            prefs[Keys.HABIT_TIME_MIN] = settings.habitTimeMinute.coerceIn(0, 1439)
            prefs[Keys.SELF_CARE_ENABLED] = settings.selfCareRemindersEnabled
            prefs[Keys.SELF_CARE_FREQ] = settings.selfCareFrequency.name
            prefs[Keys.SELF_CARE_TIME_MIN] = settings.selfCareTimeMinute.coerceIn(0, 1439)
            prefs[Keys.DAILY_USE_ENABLED] = settings.dailyUseReminderEnabled
            prefs[Keys.DAILY_USE_TIME_MIN] = settings.dailyUseReminderTimeMinute.coerceIn(0, 1439)
            prefs[Keys.FEEDBACK_NOTIF_ENABLED] = settings.feedbackNotificationEnabled
            prefs[Keys.FEEDBACK_NOTIF_SENT] = settings.hasSentPostUseFeedbackNotification
            prefs[Keys.QUIET_START_MIN] = settings.quietHoursStartMinute.coerceIn(0, 1439)
            prefs[Keys.QUIET_END_MIN] = settings.quietHoursEndMinute.coerceIn(0, 1439)
            prefs[Keys.UNLOCKED_REWARDS] = settings.unlockedRewardIds
        }

    override suspend fun clearAllPreferences(): AppResult<Unit> = safeEdit { prefs ->
        prefs.clear()
    }

    override suspend fun unlockRewardItem(rewardId: String): AppResult<Unit> = safeEdit { prefs ->
        val existing = prefs[Keys.UNLOCKED_REWARDS] ?: emptySet()
        prefs[Keys.UNLOCKED_REWARDS] = existing + rewardId
    }

    private suspend fun safeEdit(
        block: (androidx.datastore.preferences.core.MutablePreferences) -> Unit
    ): AppResult<Unit> = try {
        context.dailyTideDataStore.edit(block)
        AppResult.Success(Unit)
    } catch (e: Exception) {
        AppResult.Error("Unable to save preferences locally.", e)
    }
}

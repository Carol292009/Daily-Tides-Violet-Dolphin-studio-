package com.violetdolphinstudio.dailytide.notifications

import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.violetdolphinstudio.dailytide.domain.model.ReminderFrequency
import com.violetdolphinstudio.dailytide.domain.model.UserSettings
import java.time.LocalTime
import java.util.concurrent.TimeUnit

class ReminderScheduler(
    private val context: Context
) {
    private val workManager: WorkManager
        get() = WorkManager.getInstance(context)

    fun syncSchedules(settings: UserSettings) {
        // 1. Drinking water reminders
        if (settings.remindersEnabled) {
            val interval = settings.reminderIntervalMinutes.toLong().coerceAtLeast(30L)
            val hydrationRequest = PeriodicWorkRequestBuilder<HydrationReminderWorker>(
                interval,
                TimeUnit.MINUTES
            ).build()

            workManager.enqueueUniquePeriodicWork(
                HYDRATION_WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                hydrationRequest
            )
        } else {
            workManager.cancelUniqueWork(HYDRATION_WORK_NAME)
        }

        // 2. Daily reflection reminders
        if (settings.reflectionRemindersEnabled) {
            val repeatHours = frequencyToHours(settings.reflectionFrequency)
            val delayMin = computeInitialDelayMinutes(settings.reflectionTimeMinute)
            val reflectionRequest = PeriodicWorkRequestBuilder<ReflectionReminderWorker>(
                repeatHours,
                TimeUnit.HOURS
            )
                .setInitialDelay(delayMin, TimeUnit.MINUTES)
                .build()

            workManager.enqueueUniquePeriodicWork(
                REFLECTION_WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                reflectionRequest
            )
        } else {
            workManager.cancelUniqueWork(REFLECTION_WORK_NAME)
        }

        // 3. Habit reminders
        if (settings.habitRemindersEnabled) {
            val repeatHours = frequencyToHours(settings.habitFrequency)
            val delayMin = computeInitialDelayMinutes(settings.habitTimeMinute)
            val habitRequest = PeriodicWorkRequestBuilder<HabitReminderWorker>(
                repeatHours,
                TimeUnit.HOURS
            )
                .setInitialDelay(delayMin, TimeUnit.MINUTES)
                .build()

            workManager.enqueueUniquePeriodicWork(
                HABIT_WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                habitRequest
            )
        } else {
            workManager.cancelUniqueWork(HABIT_WORK_NAME)
        }

        // 4. Self-care check-in reminders
        if (settings.selfCareRemindersEnabled) {
            val repeatHours = frequencyToHours(settings.selfCareFrequency)
            val delayMin = computeInitialDelayMinutes(settings.selfCareTimeMinute)
            val selfCareRequest = PeriodicWorkRequestBuilder<SelfCareCheckInWorker>(
                repeatHours,
                TimeUnit.HOURS
            )
                .setInitialDelay(delayMin, TimeUnit.MINUTES)
                .build()

            workManager.enqueueUniquePeriodicWork(
                SELF_CARE_WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                selfCareRequest
            )
        } else {
            workManager.cancelUniqueWork(SELF_CARE_WORK_NAME)
        }

        // 5. Daily Use Reminder (gentle daily invitation to open Daily Tide)
        if (settings.dailyUseReminderEnabled) {
            val delayMin = computeInitialDelayMinutes(settings.dailyUseReminderTimeMinute)
            val dailyUseRequest = PeriodicWorkRequestBuilder<DailyUseReminderWorker>(
                24L,
                TimeUnit.HOURS
            )
                .setInitialDelay(delayMin, TimeUnit.MINUTES)
                .build()

            workManager.enqueueUniquePeriodicWork(
                DAILY_USE_WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                dailyUseRequest
            )
        } else {
            workManager.cancelUniqueWork(DAILY_USE_WORK_NAME)
        }

        if (!settings.feedbackNotificationEnabled) {
            workManager.cancelUniqueWork(POST_USE_FEEDBACK_WORK_NAME)
        }

        // Weekly summary runs locally only when onboarding is finished and at least one reminder is opted in
        val anyOptedIn = settings.remindersEnabled ||
            settings.reflectionRemindersEnabled ||
            settings.habitRemindersEnabled ||
            settings.selfCareRemindersEnabled ||
            settings.dailyUseReminderEnabled
        if (anyOptedIn) {
            val weeklyRequest = PeriodicWorkRequestBuilder<WeeklySummaryWorker>(
                7,
                TimeUnit.DAYS
            ).build()

            workManager.enqueueUniquePeriodicWork(
                WEEKLY_WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                weeklyRequest
            )
        } else {
            workManager.cancelUniqueWork(WEEKLY_WORK_NAME)
        }
    }

    /**
     * Schedules a single polite post-use feedback notification 30 minutes after backgrounding
     * the app, once the user has completed at least 2 sessions and has not received it yet.
     */
    fun schedulePostUseFeedbackIfEligible(settings: UserSettings) {
        if (!settings.feedbackNotificationEnabled ||
            settings.hasSentPostUseFeedbackNotification ||
            !settings.hasCompletedOnboarding ||
            settings.appSessionCount < 2
        ) {
            return
        }

        val feedbackRequest = androidx.work.OneTimeWorkRequestBuilder<PostUseFeedbackWorker>()
            .setInitialDelay(30L, TimeUnit.MINUTES)
            .build()

        workManager.enqueueUniqueWork(
            POST_USE_FEEDBACK_WORK_NAME,
            androidx.work.ExistingWorkPolicy.KEEP,
            feedbackRequest
        )
    }

    fun cancelAllReminders() {
        workManager.cancelUniqueWork(HYDRATION_WORK_NAME)
        workManager.cancelUniqueWork(REFLECTION_WORK_NAME)
        workManager.cancelUniqueWork(HABIT_WORK_NAME)
        workManager.cancelUniqueWork(SELF_CARE_WORK_NAME)
        workManager.cancelUniqueWork(DAILY_USE_WORK_NAME)
        workManager.cancelUniqueWork(POST_USE_FEEDBACK_WORK_NAME)
        workManager.cancelUniqueWork(WEEKLY_WORK_NAME)
    }

    private fun frequencyToHours(frequency: ReminderFrequency): Long = when (frequency) {
        ReminderFrequency.TWICE_DAILY -> 12L
        ReminderFrequency.DAILY, ReminderFrequency.WEEKDAYS -> 24L
        ReminderFrequency.EVERY_2_DAYS -> 48L
        ReminderFrequency.WEEKLY -> 24L * 7L
    }

    private fun computeInitialDelayMinutes(targetMinuteOfDay: Int): Long {
        val now = LocalTime.now()
        val nowMin = now.hour * 60 + now.minute
        val diff = targetMinuteOfDay - nowMin
        return if (diff > 0) diff.toLong() else (1440 + diff).toLong()
    }

    companion object {
        private const val HYDRATION_WORK_NAME = "daily_tide_hydration_reminders"
        private const val REFLECTION_WORK_NAME = "daily_tide_reflection_reminders"
        private const val HABIT_WORK_NAME = "daily_tide_habit_reminders"
        private const val SELF_CARE_WORK_NAME = "daily_tide_self_care_reminders"
        private const val DAILY_USE_WORK_NAME = "daily_tide_daily_use_reminder"
        private const val POST_USE_FEEDBACK_WORK_NAME = "daily_tide_post_use_feedback"
        private const val WEEKLY_WORK_NAME = "daily_tide_weekly_summary"
    }
}

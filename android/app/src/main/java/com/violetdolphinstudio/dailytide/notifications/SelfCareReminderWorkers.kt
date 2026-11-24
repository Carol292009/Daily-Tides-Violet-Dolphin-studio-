package com.violetdolphinstudio.dailytide.notifications

import android.Manifest
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.violetdolphinstudio.dailytide.DailyTideApplication
import com.violetdolphinstudio.dailytide.MainActivity
import com.violetdolphinstudio.dailytide.R
import com.violetdolphinstudio.dailytide.domain.model.ReminderFrequency
import kotlinx.coroutines.flow.first
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalTime

internal fun shouldFireForFrequency(frequency: ReminderFrequency, date: LocalDate = LocalDate.now()): Boolean =
    when (frequency) {
        ReminderFrequency.DAILY, ReminderFrequency.TWICE_DAILY -> true
        ReminderFrequency.WEEKDAYS -> date.dayOfWeek !in setOf(DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)
        ReminderFrequency.EVERY_2_DAYS -> (date.toEpochDay() % 2L) == 0L
        ReminderFrequency.WEEKLY -> date.dayOfWeek == DayOfWeek.SUNDAY
    }

internal fun postLocalGentleNotification(
    context: Context,
    channelId: String,
    notificationId: Int,
    requestCode: Int,
    title: String,
    body: String,
    targetTab: String
) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
        ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.POST_NOTIFICATIONS
        ) != PackageManager.PERMISSION_GRANTED
    ) {
        return
    }

    val openIntent = Intent(context, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        putExtra(MainActivity.EXTRA_START_TAB, targetTab)
    }
    val openPending = PendingIntent.getActivity(
        context,
        requestCode,
        openIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val notification = NotificationCompat.Builder(context, channelId)
        .setSmallIcon(R.drawable.ic_violet_dolphin_crest)
        .setContentTitle(title)
        .setContentText(body)
        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
        .setAutoCancel(true)
        .setContentIntent(openPending)
        .build()

    NotificationManagerCompat.from(context).notify(notificationId, notification)
}

/**
 * Local WorkManager worker for Daily Reflection reminders (100% offline, respects quiet hours & frequency).
 */
class ReflectionReminderWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val container = (applicationContext as DailyTideApplication).container
        val settings = container.settingsRepository.settingsFlow.first()
        if (!settings.reflectionRemindersEnabled) return Result.success()

        val now = LocalTime.now()
        val nowMinutes = now.hour * 60 + now.minute
        if (HydrationReminderWorker.isWithinQuietHours(nowMinutes, settings.quietHoursStartMinute, settings.quietHoursEndMinute)) {
            return Result.success()
        }
        if (!shouldFireForFrequency(settings.reflectionFrequency)) {
            return Result.success()
        }

        postLocalGentleNotification(
            context = applicationContext,
            channelId = NotificationChannels.REFLECTION_CHANNEL_ID,
            notificationId = NotificationChannels.REFLECTION_NOTIFICATION_ID,
            requestCode = 201,
            title = "Daily Tide · Reflection",
            body = "Take five quiet minutes to reflect or save something you appreciate, ${settings.displayName}.",
            targetTab = "reflect"
        )
        return Result.success()
    }
}

/**
 * Local WorkManager worker for Habit reminders (100% offline, respects quiet hours & frequency).
 */
class HabitReminderWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val container = (applicationContext as DailyTideApplication).container
        val settings = container.settingsRepository.settingsFlow.first()
        if (!settings.habitRemindersEnabled) return Result.success()

        val now = LocalTime.now()
        val nowMinutes = now.hour * 60 + now.minute
        if (HydrationReminderWorker.isWithinQuietHours(nowMinutes, settings.quietHoursStartMinute, settings.quietHoursEndMinute)) {
            return Result.success()
        }
        if (!shouldFireForFrequency(settings.habitFrequency)) {
            return Result.success()
        }

        postLocalGentleNotification(
            context = applicationContext,
            channelId = NotificationChannels.HABITS_CHANNEL_ID,
            notificationId = NotificationChannels.HABITS_NOTIFICATION_ID,
            requestCode = 202,
            title = "Daily Tide · Little Habits",
            body = "A gentle check-in with your daily habits whenever you feel ready, ${settings.displayName}.",
            targetTab = "habits"
        )
        return Result.success()
    }
}

/**
 * Local WorkManager worker for Self-Care Check-In reminders (100% offline, respects quiet hours & frequency).
 */
class SelfCareCheckInWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val container = (applicationContext as DailyTideApplication).container
        val settings = container.settingsRepository.settingsFlow.first()
        if (!settings.selfCareRemindersEnabled) return Result.success()

        val now = LocalTime.now()
        val nowMinutes = now.hour * 60 + now.minute
        if (HydrationReminderWorker.isWithinQuietHours(nowMinutes, settings.quietHoursStartMinute, settings.quietHoursEndMinute)) {
            return Result.success()
        }
        if (!shouldFireForFrequency(settings.selfCareFrequency)) {
            return Result.success()
        }

        postLocalGentleNotification(
            context = applicationContext,
            channelId = NotificationChannels.SELF_CARE_CHANNEL_ID,
            notificationId = NotificationChannels.SELF_CARE_NOTIFICATION_ID,
            requestCode = 203,
            title = "Daily Tide · Self-Care Check-In",
            body = "Drop your shoulders, take a slow breath, and check in with your mood today.",
            targetTab = "today"
        )
        return Result.success()
    }
}

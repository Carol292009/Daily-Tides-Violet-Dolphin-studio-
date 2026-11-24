package com.violetdolphinstudio.dailytide.notifications

import android.Manifest
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.violetdolphinstudio.dailytide.DailyTideApplication
import com.violetdolphinstudio.dailytide.MainActivity
import com.violetdolphinstudio.dailytide.R
import kotlinx.coroutines.flow.first
import java.time.LocalTime

/**
 * 100% Offline WorkManager worker for the daily invitation to use Daily Tide.
 * Respects opt-in preference, Android 13+ POST_NOTIFICATIONS permission, and Quiet Hours.
 */
class DailyUseReminderWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val container = (applicationContext as DailyTideApplication).container
        val settings = container.settingsRepository.settingsFlow.first()
        if (!settings.dailyUseReminderEnabled) return Result.success()

        val now = LocalTime.now()
        val nowMinutes = now.hour * 60 + now.minute
        if (HydrationReminderWorker.isWithinQuietHours(
                nowMinutes,
                settings.quietHoursStartMinute,
                settings.quietHoursEndMinute
            )
        ) {
            return Result.success()
        }

        val greetingName = settings.displayName.takeIf { it.isNotBlank() && it != "Friend" }
            ?.let { ", $it" }
            ?: ""

        postLocalGentleNotification(
            context = applicationContext,
            channelId = NotificationChannels.DAILY_USE_CHANNEL_ID,
            notificationId = NotificationChannels.DAILY_USE_NOTIFICATION_ID,
            requestCode = 206,
            title = "Daily Tide · Your Calm Check-In Awaits",
            body = "Ready for a gentle sip of water, a mood check-in, or one small habit today$greetingName?",
            targetTab = "today"
        )
        return Result.success()
    }
}

/**
 * 100% Offline WorkManager worker for a single polite post-use feedback notification.
 *
 * Triggered once after the user finishes using Daily Tide (after >= 2 sessions) so it never
 * interrupts first launch and never spams repeatedly.
 */
class PostUseFeedbackWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val container = (applicationContext as DailyTideApplication).container
        val settings = container.settingsRepository.settingsFlow.first()
        if (!settings.feedbackNotificationEnabled || settings.hasSentPostUseFeedbackNotification) {
            return Result.success()
        }

        val now = LocalTime.now()
        val nowMinutes = now.hour * 60 + now.minute
        if (HydrationReminderWorker.isWithinQuietHours(
                nowMinutes,
                settings.quietHoursStartMinute,
                settings.quietHoursEndMinute
            )
        ) {
            // Retry later once outside quiet hours without marking as sent
            return Result.retry()
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(
                applicationContext,
                Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return Result.success()
        }

        // Open Google Play listing for optional rating/feedback, with safe fallback to Daily Tide
        val playStoreIntent = Intent(
            Intent.ACTION_VIEW,
            Uri.parse("https://play.google.com/store/apps/details?id=${applicationContext.packageName}")
        ).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        val fallbackIntent = Intent(applicationContext, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(MainActivity.EXTRA_START_TAB, "today")
        }
        val targetIntent = if (playStoreIntent.resolveActivity(applicationContext.packageManager) != null) {
            playStoreIntent
        } else {
            fallbackIntent
        }

        val pendingIntent = PendingIntent.getActivity(
            applicationContext,
            207,
            targetIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(
            applicationContext,
            NotificationChannels.FEEDBACK_CHANNEL_ID
        )
            .setSmallIcon(R.drawable.ic_violet_dolphin_crest)
            .setContentTitle("How is Daily Tide feeling so far?")
            .setContentText("Thank you for spending time with Daily Tide. Tap to share quick feedback with Violet Dolphin Studio.")
            .setStyle(
                NotificationCompat.BigTextStyle().bigText(
                    "Thank you for spending time with Daily Tide. Your feedback helps Violet Dolphin Studio keep your self-care space calm and useful."
                )
            )
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        NotificationManagerCompat.from(applicationContext).notify(
            NotificationChannels.FEEDBACK_NOTIFICATION_ID,
            notification
        )

        container.settingsRepository.markPostUseFeedbackSent()
        return Result.success()
    }
}

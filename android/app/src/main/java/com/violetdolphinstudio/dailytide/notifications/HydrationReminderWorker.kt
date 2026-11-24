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
import com.violetdolphinstudio.dailytide.domain.model.LocalDateUtil
import kotlinx.coroutines.flow.first
import java.time.LocalTime

class HydrationReminderWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val container = (applicationContext as DailyTideApplication).container
        val settings = container.settingsRepository.settingsFlow.first()

        if (!settings.remindersEnabled) return Result.success()

        // Respect quiet hours (sleep window) strictly
        val nowTime = LocalTime.now()
        val nowMinutes = nowTime.hour * 60 + nowTime.minute
        if (isWithinQuietHours(nowMinutes, settings.quietHoursStartMinute, settings.quietHoursEndMinute)) {
            return Result.success()
        }

        val today = LocalDateUtil.todayEpochDay()
        val consumedMl = container.hydrationRepository.getTodayConsumedMl(today)
        if (consumedMl >= settings.dailyWaterGoalMl) {
            // Goal already met — skip silently without interrupting
            return Result.success()
        }

        // Smart local skip if user logged water within the last 45 minutes
        val lastLogMillis = container.hydrationRepository.getLastLoggedTimestamp(today)
        if (lastLogMillis != null && (System.currentTimeMillis() - lastLogMillis) < 45 * 60 * 1000L) {
            return Result.success()
        }

        showGentleHydrationNotification(settings.displayName)
        return Result.success()
    }

    private fun showGentleHydrationNotification(name: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(
                applicationContext,
                Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val messages = listOf(
            "A gentle pause for a sip of water, $name.",
            "Take a quiet breath and refresh with a glass of water.",
            "Little sips keep your tide steady today.",
            "Whenever you have a calm moment, a glass of water awaits."
        )
        val body = messages[(System.currentTimeMillis() / 60_000L).toInt().mod(messages.size)]

        val openIntent = Intent(applicationContext, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(MainActivity.EXTRA_START_TAB, "today")
        }
        val openPending = PendingIntent.getActivity(
            applicationContext,
            100,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val quickLogIntent = Intent(applicationContext, HydrationQuickLogReceiver::class.java).apply {
            action = HydrationQuickLogReceiver.ACTION_QUICK_LOG_WATER
        }
        val quickLogPending = PendingIntent.getBroadcast(
            applicationContext,
            101,
            quickLogIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(
            applicationContext,
            NotificationChannels.HYDRATION_CHANNEL_ID
        )
            .setSmallIcon(R.drawable.ic_violet_dolphin_crest)
            .setContentTitle("Daily Tide")
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(openPending)
            .addAction(0, applicationContext.getString(R.string.action_log_glass), quickLogPending)
            .build()

        NotificationManagerCompat.from(applicationContext)
            .notify(NotificationChannels.HYDRATION_NOTIFICATION_ID, notification)
    }

    companion object {
        fun isWithinQuietHours(nowMinutes: Int, startMinutes: Int, endMinutes: Int): Boolean {
            return if (startMinutes < endMinutes) {
                nowMinutes in startMinutes until endMinutes
            } else {
                // Wraps across midnight (e.g., 22:00 to 07:30)
                nowMinutes >= startMinutes || nowMinutes < endMinutes
            }
        }
    }
}

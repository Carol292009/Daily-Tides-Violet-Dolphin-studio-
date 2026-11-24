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
import com.violetdolphinstudio.dailytide.domain.model.AppResult
import com.violetdolphinstudio.dailytide.domain.model.LocalDateUtil

class WeeklySummaryWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val container = (applicationContext as DailyTideApplication).container
        val result = container.buildWeeklySummaryUseCase(LocalDateUtil.todayEpochDay())

        if (result is AppResult.Success) {
            postWeeklyNotification()
        }
        return Result.success()
    }

    private fun postWeeklyNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(
                applicationContext,
                Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val intent = Intent(applicationContext, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(MainActivity.EXTRA_START_TAB, "progress")
        }
        val pending = PendingIntent.getActivity(
            applicationContext,
            102,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(
            applicationContext,
            NotificationChannels.WEEKLY_SUMMARY_CHANNEL_ID
        )
            .setSmallIcon(R.drawable.ic_violet_dolphin_crest)
            .setContentTitle("Your Weekly Tide is ready")
            .setContentText("Take a calm minute to appreciate your rhythm this week.")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setAutoCancel(true)
            .setContentIntent(pending)
            .build()

        NotificationManagerCompat.from(applicationContext)
            .notify(NotificationChannels.WEEKLY_SUMMARY_NOTIFICATION_ID, notification)
    }
}

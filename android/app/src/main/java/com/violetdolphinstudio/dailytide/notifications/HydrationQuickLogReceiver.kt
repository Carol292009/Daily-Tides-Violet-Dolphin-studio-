package com.violetdolphinstudio.dailytide.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationManagerCompat
import com.violetdolphinstudio.dailytide.DailyTideApplication
import com.violetdolphinstudio.dailytide.domain.model.LocalDateUtil
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class HydrationQuickLogReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != ACTION_QUICK_LOG_WATER) return

        val pendingResult = goAsync()
        val app = context.applicationContext as DailyTideApplication
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val vessel = app.container.hydrationRepository.getDefaultVessel()
                val amount = vessel?.volumeMl ?: 250
                app.container.logWaterUseCase(
                    amountMl = amount,
                    vessel = vessel,
                    dateEpochDay = LocalDateUtil.todayEpochDay()
                )
                NotificationManagerCompat.from(context)
                    .cancel(NotificationChannels.HYDRATION_NOTIFICATION_ID)
            } finally {
                pendingResult.finish()
            }
        }
    }

    companion object {
        const val ACTION_QUICK_LOG_WATER = "com.violetdolphinstudio.dailytide.ACTION_QUICK_LOG_WATER"
    }
}

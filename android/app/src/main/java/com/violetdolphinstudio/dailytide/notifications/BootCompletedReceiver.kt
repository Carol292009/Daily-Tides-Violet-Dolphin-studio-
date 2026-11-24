package com.violetdolphinstudio.dailytide.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.violetdolphinstudio.dailytide.DailyTideApplication
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class BootCompletedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return
        val pendingResult = goAsync()
        val app = context.applicationContext as DailyTideApplication
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val settings = app.container.settingsRepository.settingsFlow.first()
                app.container.reminderScheduler.syncSchedules(settings)
            } finally {
                pendingResult.finish()
            }
        }
    }
}

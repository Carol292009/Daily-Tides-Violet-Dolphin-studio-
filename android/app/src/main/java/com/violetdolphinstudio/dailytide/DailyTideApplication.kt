package com.violetdolphinstudio.dailytide

import android.app.Application
import com.violetdolphinstudio.dailytide.di.AppContainer
import com.violetdolphinstudio.dailytide.notifications.NotificationChannels
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class DailyTideApplication : Application() {

    lateinit var container: AppContainer
        private set

    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        NotificationChannels.registerAll(this)

        applicationScope.launch {
            container.initializeOfflineSanctuary()
        }
    }
}

package com.violetdolphinstudio.dailytide

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.violetdolphinstudio.dailytide.domain.model.ThemeMode
import com.violetdolphinstudio.dailytide.domain.model.UiState
import com.violetdolphinstudio.dailytide.presentation.components.TideEmptyState
import com.violetdolphinstudio.dailytide.presentation.components.TideLoadingState
import com.violetdolphinstudio.dailytide.presentation.navigation.DailyTideAppShell
import com.violetdolphinstudio.dailytide.presentation.theme.DailyTideTheme
import com.violetdolphinstudio.dailytide.presentation.viewmodel.AppRootViewModel
import com.violetdolphinstudio.dailytide.presentation.viewmodel.DailyTideViewModelFactory
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val appContainer = (application as DailyTideApplication).container
        val startTab = intent?.getStringExtra(EXTRA_START_TAB)

        // Increment local session counter on fresh Activity creation (never sent off-device)
        if (savedInstanceState == null) {
            lifecycleScope.launch {
                appContainer.settingsRepository.incrementSessionCount()
            }
        }

        // Gather Google UMP privacy consent asynchronously; initializes Google Mobile Ads SDK
        // only when consent permits. Offline or consent errors never block free features.
        appContainer.privacyConsentManager.gatherConsent(this) { canRequestAds ->
            if (canRequestAds) {
                appContainer.rewardedAdController.initializeSdkIfAllowed()
            }
        }

        setContent {
            val rootViewModel: AppRootViewModel = viewModel(
                factory = DailyTideViewModelFactory(appContainer)
            )
            val settingsState by rootViewModel.settingsState.collectAsStateWithLifecycle()

            val activeTheme = when (val s = settingsState) {
                is UiState.Content -> s.data.themeMode
                else -> ThemeMode.WARM_IVORY
            }

            DailyTideTheme(themeMode = activeTheme) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    when (val s = settingsState) {
                        is UiState.Loading -> TideLoadingState(modifier = Modifier.fillMaxSize())
                        is UiState.Error -> TideEmptyState(
                            title = "Unable to open Daily Tide",
                            subtitle = s.message
                        )
                        is UiState.Empty -> TideEmptyState(s.title, s.subtitle)
                        is UiState.Content -> DailyTideAppShell(
                            container = appContainer,
                            rootViewModel = rootViewModel,
                            hasCompletedOnboarding = s.data.hasCompletedOnboarding,
                            initialTabRoute = startTab
                        )
                    }
                }
            }
        }
    }

    override fun onStop() {
        super.onStop()
        val appContainer = (application as DailyTideApplication).container
        lifecycleScope.launch {
            runCatching {
                val settings = appContainer.settingsRepository.settingsFlow.first()
                appContainer.reminderScheduler.schedulePostUseFeedbackIfEligible(settings)
            }
        }
    }

    companion object {
        const val EXTRA_START_TAB = "extra_start_tab"
    }
}

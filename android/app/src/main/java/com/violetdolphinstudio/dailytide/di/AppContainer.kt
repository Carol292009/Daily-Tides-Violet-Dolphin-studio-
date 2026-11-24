package com.violetdolphinstudio.dailytide.di

import android.content.Context
import com.violetdolphinstudio.dailytide.data.local.LocalDataBackupManager
import com.violetdolphinstudio.dailytide.data.local.datastore.UserPreferencesDataStore
import com.violetdolphinstudio.dailytide.data.local.db.DailyTideDatabase
import com.violetdolphinstudio.dailytide.data.local.db.seeder.OfflineContentSeeder
import com.violetdolphinstudio.dailytide.data.repository.LocalHabitChallengeRepository
import com.violetdolphinstudio.dailytide.data.repository.LocalHydrationRepository
import com.violetdolphinstudio.dailytide.data.repository.LocalProgressRepository
import com.violetdolphinstudio.dailytide.data.repository.LocalReflectionRepository
import com.violetdolphinstudio.dailytide.domain.model.LocalDateUtil
import com.violetdolphinstudio.dailytide.domain.repository.HabitChallengeRepository
import com.violetdolphinstudio.dailytide.domain.repository.HydrationRepository
import com.violetdolphinstudio.dailytide.domain.repository.ProgressRepository
import com.violetdolphinstudio.dailytide.domain.repository.ReflectionRepository
import com.violetdolphinstudio.dailytide.domain.repository.SettingsRepository
import com.violetdolphinstudio.dailytide.domain.usecase.BuildWeeklySummaryUseCase
import com.violetdolphinstudio.dailytide.domain.usecase.CompleteDailyChallengeUseCase
import com.violetdolphinstudio.dailytide.domain.usecase.EvaluateBadgesUseCase
import com.violetdolphinstudio.dailytide.domain.usecase.LogWaterUseCase
import com.violetdolphinstudio.dailytide.domain.usecase.SaveReflectionAndCheckBadgesUseCase
import com.violetdolphinstudio.dailytide.domain.usecase.ToggleHabitUseCase
import com.violetdolphinstudio.dailytide.ads.AdMobConfig
import com.violetdolphinstudio.dailytide.ads.AdMobRewardVerificationProvider
import com.violetdolphinstudio.dailytide.ads.GoogleAdMobRewardedController
import com.violetdolphinstudio.dailytide.ads.GoogleMobileAdsTransport
import com.violetdolphinstudio.dailytide.ads.GooglePrivacyConsentManager
import com.violetdolphinstudio.dailytide.ads.PrivacyConsentManager
import com.violetdolphinstudio.dailytide.ads.RewardedAdController
import com.violetdolphinstudio.dailytide.notifications.ReminderScheduler
import com.violetdolphinstudio.dailytide.rewards.DataStoreRewardAccessStorage
import com.violetdolphinstudio.dailytide.rewards.DefaultRewardAccessManager
import com.violetdolphinstudio.dailytide.rewards.RewardAccessManager
import kotlinx.coroutines.flow.first

class AppContainer(context: Context) {
    private val appContext = context.applicationContext

    val database: DailyTideDatabase by lazy {
        DailyTideDatabase.getInstance(appContext)
    }

    val settingsRepository: SettingsRepository by lazy {
        UserPreferencesDataStore(appContext)
    }

    val hydrationRepository: HydrationRepository by lazy {
        LocalHydrationRepository(
            hydrationDao = database.hydrationDao(),
            settingsRepository = settingsRepository
        )
    }

    val reflectionRepository: ReflectionRepository by lazy {
        LocalReflectionRepository(reflectionDao = database.reflectionDao())
    }

    val habitChallengeRepository: HabitChallengeRepository by lazy {
        LocalHabitChallengeRepository(dao = database.habitChallengeDao())
    }

    val progressRepository: ProgressRepository by lazy {
        LocalProgressRepository(
            hydrationDao = database.hydrationDao(),
            reflectionDao = database.reflectionDao(),
            habitChallengeDao = database.habitChallengeDao(),
            progressBadgeDao = database.progressBadgeDao(),
            settingsRepository = settingsRepository
        )
    }

    val reminderScheduler: ReminderScheduler by lazy {
        ReminderScheduler(appContext)
    }

    val privacyConsentManager: PrivacyConsentManager by lazy {
        GooglePrivacyConsentManager(appContext)
    }

    val rewardAccessManager: RewardAccessManager by lazy {
        DefaultRewardAccessManager(
            storage = DataStoreRewardAccessStorage(appContext),
            verificationProvider = AdMobRewardVerificationProvider()
        )
    }

    val rewardedAdController: RewardedAdController by lazy {
        GoogleAdMobRewardedController(
            consentManager = privacyConsentManager,
            rewardAccessManager = rewardAccessManager,
            transport = GoogleMobileAdsTransport(appContext),
            activeAdUnitId = AdMobConfig.resolveRewardedAdUnitId()
        )
    }

    val localDataBackupManager: LocalDataBackupManager by lazy {
        LocalDataBackupManager(
            database = database,
            settingsRepository = settingsRepository,
            reminderScheduler = reminderScheduler,
            rewardAccessManager = rewardAccessManager
        )
    }

    val logWaterUseCase: LogWaterUseCase by lazy {
        LogWaterUseCase(hydrationRepository, progressRepository)
    }

    val toggleHabitUseCase: ToggleHabitUseCase by lazy {
        ToggleHabitUseCase(habitChallengeRepository, progressRepository)
    }

    val completeDailyChallengeUseCase: CompleteDailyChallengeUseCase by lazy {
        CompleteDailyChallengeUseCase(habitChallengeRepository, progressRepository)
    }

    val evaluateBadgesUseCase: EvaluateBadgesUseCase by lazy {
        EvaluateBadgesUseCase(progressRepository)
    }

    val buildWeeklySummaryUseCase: BuildWeeklySummaryUseCase by lazy {
        BuildWeeklySummaryUseCase(progressRepository)
    }

    val saveReflectionAndCheckBadgesUseCase: SaveReflectionAndCheckBadgesUseCase by lazy {
        SaveReflectionAndCheckBadgesUseCase(reflectionRepository, progressRepository)
    }

    suspend fun initializeOfflineSanctuary() {
        OfflineContentSeeder.seedIfNeeded(database)
        habitChallengeRepository.ensureDailyChallengeAssigned(LocalDateUtil.todayEpochDay())
        rewardAccessManager.sweepExpirations()
        val settings = settingsRepository.settingsFlow.first()
        if (settings.hasCompletedOnboarding) {
            reminderScheduler.syncSchedules(settings)
        }
    }
}

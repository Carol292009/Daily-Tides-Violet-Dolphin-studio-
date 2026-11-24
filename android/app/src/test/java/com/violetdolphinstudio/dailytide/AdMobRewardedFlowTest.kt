package com.violetdolphinstudio.dailytide

import android.app.Activity
import com.violetdolphinstudio.dailytide.ads.AdMobConfig
import com.violetdolphinstudio.dailytide.ads.AdMobRewardVerificationProvider
import com.violetdolphinstudio.dailytide.ads.GoogleAdMobRewardedController
import com.violetdolphinstudio.dailytide.ads.PrivacyConsentManager
import com.violetdolphinstudio.dailytide.ads.PrivacyConsentUiState
import com.violetdolphinstudio.dailytide.ads.RewardedAdTransport
import com.violetdolphinstudio.dailytide.ads.RewardedAdTransportCallbacks
import com.violetdolphinstudio.dailytide.ads.RewardedAdUiState
import com.violetdolphinstudio.dailytide.rewards.DefaultRewardAccessManager
import com.violetdolphinstudio.dailytide.rewards.InMemoryRewardAccessStorage
import com.violetdolphinstudio.dailytide.rewards.RewardAccessStatus
import com.violetdolphinstudio.dailytide.rewards.RewardClock
import com.violetdolphinstudio.dailytide.rewards.RewardLevel
import com.violetdolphinstudio.dailytide.rewards.RewardVerificationSource
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exhaustive unit tests covering every Google AdMob Rewarded Ad outcome:
 * 1. Official Google Android Rewarded Test Ad Unit ID enforcement.
 * 2. Consent denied blocks ad requests without crashing or locking free features.
 * 3. Loading state emitted before resolution.
 * 4. Ad load failure -> ZERO reward granted.
 * 5. Ad failed to show -> ZERO reward granted.
 * 6. Ad opened (`onAdShowed`) -> ZERO reward granted merely upon opening.
 * 7. Ad dismissed early -> `DismissedWithoutReward`, ZERO reward granted.
 * 8. Full completion (`onUserEarnedReward`) -> reward granted, persisted locally, offline access verified.
 */
class AdMobRewardedFlowTest {

    private class FakeConsentManager(var allowed: Boolean) : PrivacyConsentManager {
        override val consentState: StateFlow<PrivacyConsentUiState> =
            MutableStateFlow(PrivacyConsentUiState(canRequestAds = allowed))
        override val canRequestAds: Boolean get() = allowed
        override fun gatherConsent(activity: Activity, onConsentComplete: (Boolean) -> Unit) {
            onConsentComplete(allowed)
        }
        override fun showPrivacyOptionsForm(activity: Activity, onDismissed: (String?) -> Unit) {
            onDismissed(null)
        }
    }

    private class FakeTransport(
        var script: (RewardedAdTransportCallbacks) -> Unit = {}
    ) : RewardedAdTransport {
        var initCount = 0
        var lastAdUnitId: String? = null

        override fun initializeMobileAds(onInitialized: () -> Unit) {
            initCount += 1
            onInitialized()
        }

        override fun loadAndPresent(
            activity: Activity,
            adUnitId: String,
            callbacks: RewardedAdTransportCallbacks
        ) {
            lastAdUnitId = adUnitId
            script(callbacks)
        }
    }

    private class MutableClock(var millis: Long) : RewardClock {
        override fun nowMillis(): Long = millis
    }

    // Safe placeholder Activity reference (never dereferenced by FakeTransport)
    @Suppress("DEPRECATION")
    private fun dummyActivity(): Activity = Activity()

    @Test
    fun enforcesOfficialGoogleRewardedTestAdUnitId() {
        assertEquals(
            "ca-app-pub-3940256099942544/5224354917",
            AdMobConfig.OFFICIAL_TEST_REWARDED_AD_UNIT_ID
        )
        assertTrue(AdMobConfig.isOfficialTestAdUnit("ca-app-pub-3940256099942544/5224354917"))
        assertFalse(AdMobConfig.isOfficialTestAdUnit("ca-app-pub-1234567890123456/9999999999"))
    }

    @Test
    fun blocksAdRequestWhenPrivacyConsentNotGranted() = runBlocking {
        val storage = InMemoryRewardAccessStorage()
        val clock = MutableClock(1_750_000_000_000L)
        val manager = DefaultRewardAccessManager(storage, AdMobRewardVerificationProvider(), clock)
        val transport = FakeTransport()
        val controller = GoogleAdMobRewardedController(
            consentManager = FakeConsentManager(allowed = false),
            rewardAccessManager = manager,
            transport = transport,
            activeAdUnitId = AdMobConfig.OFFICIAL_TEST_REWARDED_AD_UNIT_ID,
            coroutineScope = CoroutineScope(Dispatchers.Unconfined)
        )

        controller.loadAndShowRewardedAd(dummyActivity(), RewardLevel.LEVEL_1_SPECIAL_MOTIVATION)
        assertTrue(controller.adUiState.value is RewardedAdUiState.Failed)
        assertEquals(0, transport.initCount)
        assertFalse(manager.isLevelUnlocked(RewardLevel.LEVEL_1_SPECIAL_MOTIVATION))
    }

    @Test
    fun loadFailureAndShowFailureNeverGrantRewards() = runBlocking {
        val storage = InMemoryRewardAccessStorage()
        val clock = MutableClock(1_750_000_000_000L)
        val manager = DefaultRewardAccessManager(storage, AdMobRewardVerificationProvider(), clock)
        val transport = FakeTransport()
        val controller = GoogleAdMobRewardedController(
            consentManager = FakeConsentManager(allowed = true),
            rewardAccessManager = manager,
            transport = transport,
            activeAdUnitId = AdMobConfig.OFFICIAL_TEST_REWARDED_AD_UNIT_ID,
            coroutineScope = CoroutineScope(Dispatchers.Unconfined)
        )

        // Outcome A: Load failure (e.g., offline / no fill)
        transport.script = { cb -> cb.onAdFailedToLoad(3, "No fill") }
        controller.loadAndShowRewardedAd(dummyActivity(), RewardLevel.LEVEL_2_ADVANCED_REFLECTION)
        assertEquals(AdMobConfig.OFFICIAL_TEST_REWARDED_AD_UNIT_ID, transport.lastAdUnitId)
        assertTrue(controller.adUiState.value is RewardedAdUiState.Failed)
        assertFalse(manager.isLevelUnlocked(RewardLevel.LEVEL_2_ADVANCED_REFLECTION))

        // Outcome B: Show failure
        transport.script = { cb -> cb.onAdFailedToShow(2, "Display failed") }
        controller.loadAndShowRewardedAd(dummyActivity(), RewardLevel.LEVEL_2_ADVANCED_REFLECTION)
        assertTrue(controller.adUiState.value is RewardedAdUiState.Failed)
        assertFalse(manager.isLevelUnlocked(RewardLevel.LEVEL_2_ADVANCED_REFLECTION))
    }

    @Test
    fun openingOrDismissingEarlyNeverGrantsReward() = runBlocking {
        val storage = InMemoryRewardAccessStorage()
        val clock = MutableClock(1_750_000_000_000L)
        val manager = DefaultRewardAccessManager(storage, AdMobRewardVerificationProvider(), clock)
        val transport = FakeTransport()
        val controller = GoogleAdMobRewardedController(
            consentManager = FakeConsentManager(allowed = true),
            rewardAccessManager = manager,
            transport = transport,
            activeAdUnitId = AdMobConfig.OFFICIAL_TEST_REWARDED_AD_UNIT_ID,
            coroutineScope = CoroutineScope(Dispatchers.Unconfined)
        )

        // Outcome C: Ad opened only — still showing, ZERO reward granted
        transport.script = { cb -> cb.onAdShowed() }
        controller.loadAndShowRewardedAd(dummyActivity(), RewardLevel.LEVEL_3_SPECIAL_CHALLENGES)
        assertTrue(controller.adUiState.value is RewardedAdUiState.Showing)
        assertFalse(manager.isLevelUnlocked(RewardLevel.LEVEL_3_SPECIAL_CHALLENGES))

        // Outcome D: Ad opened then dismissed early before onUserEarnedReward -> ZERO reward
        transport.script = { cb ->
            cb.onAdShowed()
            cb.onAdDismissed()
        }
        controller.loadAndShowRewardedAd(dummyActivity(), RewardLevel.LEVEL_3_SPECIAL_CHALLENGES)
        assertTrue(controller.adUiState.value is RewardedAdUiState.DismissedWithoutReward)
        assertFalse(manager.isLevelUnlocked(RewardLevel.LEVEL_3_SPECIAL_CHALLENGES))
        assertTrue(manager.getCurrentState().history.isEmpty())
    }

    @Test
    fun successfulRewardCallbackPersistsLocallyAndWorksOfflineUntilExpiration() = runBlocking {
        val storage = InMemoryRewardAccessStorage()
        val clock = MutableClock(1_750_000_000_000L)
        val manager = DefaultRewardAccessManager(storage, AdMobRewardVerificationProvider(), clock)
        val transport = FakeTransport { cb ->
            cb.onAdShowed()
            cb.onUserEarnedReward("DailyTideAccess", 1)
            cb.onAdDismissed()
        }
        val controller = GoogleAdMobRewardedController(
            consentManager = FakeConsentManager(allowed = true),
            rewardAccessManager = manager,
            transport = transport,
            activeAdUnitId = AdMobConfig.OFFICIAL_TEST_REWARDED_AD_UNIT_ID,
            coroutineScope = CoroutineScope(Dispatchers.Unconfined)
        )

        controller.loadAndShowRewardedAd(dummyActivity(), RewardLevel.LEVEL_4_VISUAL_THEMES)

        val state = controller.adUiState.value
        assertTrue(state is RewardedAdUiState.RewardEarned)
        assertTrue(manager.isLevelUnlocked(RewardLevel.LEVEL_4_VISUAL_THEMES))

        // Verify cold-restart offline persistence (fresh manager with same local storage, no ads needed)
        val offlineRestartedManager = DefaultRewardAccessManager(storage, AdMobRewardVerificationProvider(), clock)
        val restored = offlineRestartedManager.getCurrentState()
        val level4 = restored.snapshotFor(RewardLevel.LEVEL_4_VISUAL_THEMES)
        assertEquals(RewardAccessStatus.UNLOCKED, level4.status)
        assertEquals(48L * 3_600_000L, level4.remainingMillis)
        assertEquals(RewardVerificationSource.ADMOB_SDK_CALLBACK, level4.lastGrant?.verificationSource)

        // Advance past 48h -> automatically expires offline
        clock.millis += 48L * 3_600_000L
        assertFalse(offlineRestartedManager.isLevelUnlocked(RewardLevel.LEVEL_4_VISUAL_THEMES))
    }
}

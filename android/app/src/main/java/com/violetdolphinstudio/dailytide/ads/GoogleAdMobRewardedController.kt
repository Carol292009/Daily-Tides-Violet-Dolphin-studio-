package com.violetdolphinstudio.dailytide.ads

import android.app.Activity
import android.content.Context
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.violetdolphinstudio.dailytide.domain.model.AppResult
import com.violetdolphinstudio.dailytide.rewards.RewardAccessManager
import com.violetdolphinstudio.dailytide.rewards.RewardLevel
import com.violetdolphinstudio.dailytide.rewards.RewardVerificationProvider
import com.violetdolphinstudio.dailytide.rewards.RewardVerificationResult
import com.violetdolphinstudio.dailytide.rewards.RewardVerificationSource
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Exhaustive UI state for the optional Google AdMob Rewarded Video lifecycle.
 */
sealed interface RewardedAdUiState {
    data object Idle : RewardedAdUiState
    data class Loading(val level: RewardLevel) : RewardedAdUiState
    data class Showing(val level: RewardLevel) : RewardedAdUiState
    data class Failed(
        val level: RewardLevel,
        val errorCode: Int,
        val userMessage: String
    ) : RewardedAdUiState

    data class DismissedWithoutReward(
        val level: RewardLevel,
        val userMessage: String = "Advertisement closed before completion. No reward was granted — all free features remain available."
    ) : RewardedAdUiState

    data class RewardEarned(
        val level: RewardLevel,
        val rewardType: String,
        val rewardAmount: Int,
        val expiresAtMillis: Long
    ) : RewardedAdUiState
}

/**
 * Clean verification provider recording rewards confirmed strictly via the official
 * Google Mobile Ads [com.google.android.gms.ads.OnUserEarnedRewardListener] callback.
 */
class AdMobRewardVerificationProvider : RewardVerificationProvider {
    override val source: RewardVerificationSource = RewardVerificationSource.ADMOB_SDK_CALLBACK
    override val isLiveAdSdkIntegrated: Boolean = true

    override suspend fun verifyCompletedReward(
        level: RewardLevel,
        nowMillis: Long
    ): RewardVerificationResult {
        return RewardVerificationResult(
            verified = true,
            receiptId = "admob_${level.id}_${nowMillis}_${UUID.randomUUID().toString().take(8)}",
            source = RewardVerificationSource.ADMOB_SDK_CALLBACK,
            verifiedAtMillis = nowMillis
        )
    }
}

/**
 * Abstract contract separating the advertising SDK from ViewModels and core self-care logic.
 */
interface RewardedAdController {
    val adUiState: StateFlow<RewardedAdUiState>
    val activeAdUnitId: String
    val isSdkInitialized: Boolean

    fun initializeSdkIfAllowed()
    fun loadAndShowRewardedAd(activity: Activity, level: RewardLevel)
    fun resetAdState()
}

/**
 * Low-level transport abstraction around Google Mobile Ads [RewardedAd] so every callback
 * outcome (load failure, show failure, opened, dismissed early, and OnUserEarnedReward)
 * can be deterministically unit tested on the JVM without requiring Google Play Services.
 */
interface RewardedAdTransport {
    fun initializeMobileAds(onInitialized: () -> Unit)
    fun loadAndPresent(
        activity: Activity,
        adUnitId: String,
        callbacks: RewardedAdTransportCallbacks
    )
}

interface RewardedAdTransportCallbacks {
    fun onAdFailedToLoad(errorCode: Int, message: String)
    fun onAdShowed()
    fun onAdFailedToShow(errorCode: Int, message: String)
    fun onUserEarnedReward(rewardType: String, rewardAmount: Int)
    fun onAdDismissed()
}

/**
 * Production Android transport powered by the official Google Mobile Ads SDK.
 */
class GoogleMobileAdsTransport(
    private val appContext: Context
) : RewardedAdTransport {

    private val bgScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun initializeMobileAds(onInitialized: () -> Unit) {
        bgScope.launch {
            MobileAds.initialize(appContext) {
                onInitialized()
            }
        }
    }

    override fun loadAndPresent(
        activity: Activity,
        adUnitId: String,
        callbacks: RewardedAdTransportCallbacks
    ) {
        val request = AdMobConfig.buildCleanAdRequest()
        RewardedAd.load(
            activity,
            adUnitId,
            request,
            object : RewardedAdLoadCallback() {
                override fun onAdFailedToLoad(loadAdError: LoadAdError) {
                    callbacks.onAdFailedToLoad(loadAdError.code, loadAdError.message)
                }

                override fun onAdLoaded(rewardedAd: RewardedAd) {
                    rewardedAd.fullScreenContentCallback = object : FullScreenContentCallback() {
                        override fun onAdShowedFullScreenContent() {
                            callbacks.onAdShowed()
                        }

                        override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                            callbacks.onAdFailedToShow(adError.code, adError.message)
                        }

                        override fun onAdDismissedFullScreenContent() {
                            callbacks.onAdDismissed()
                        }
                    }

                    rewardedAd.show(activity) { rewardItem ->
                        callbacks.onUserEarnedReward(rewardItem.type, rewardItem.amount)
                    }
                }
            }
        )
    }
}

/**
 * Orchestrates optional Google AdMob Rewarded Video Ads for Daily Tide.
 *
 * STRICT INVARIANTS:
 * 1. Never triggers forced or unexpected ads — runs ONLY after explicit user selection & disclosure.
 * 2. Initializes Google Mobile Ads SDK only when UMP privacy consent allows requesting ads.
 * 3. Grants a reward ONLY inside [RewardedAdTransportCallbacks.onUserEarnedReward].
 * 4. NEVER grants a reward when an ad merely loads, opens, fails, or is dismissed early.
 * 5. Persists granted rewards locally via [RewardAccessManager] for offline access until expiry.
 */
class GoogleAdMobRewardedController(
    private val consentManager: PrivacyConsentManager,
    private val rewardAccessManager: RewardAccessManager,
    private val transport: RewardedAdTransport,
    override val activeAdUnitId: String = AdMobConfig.resolveRewardedAdUnitId(),
    private val coroutineScope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
) : RewardedAdController {

    private val initialized = AtomicBoolean(false)
    private val _adUiState = MutableStateFlow<RewardedAdUiState>(RewardedAdUiState.Idle)
    override val adUiState: StateFlow<RewardedAdUiState> = _adUiState.asStateFlow()

    override val isSdkInitialized: Boolean
        get() = initialized.get()

    override fun initializeSdkIfAllowed() {
        if (!consentManager.canRequestAds) return
        if (initialized.compareAndSet(false, true)) {
            transport.initializeMobileAds {
                // SDK ready in background; no forced pre-show or unexpected interstitials.
            }
        }
    }

    override fun loadAndShowRewardedAd(activity: Activity, level: RewardLevel) {
        if (!AdMobConfig.isAdUnitUsable(activeAdUnitId)) {
            _adUiState.value = RewardedAdUiState.Failed(
                level = level,
                errorCode = -101,
                userMessage = "Optional rewarded videos are temporarily unavailable in this build. All free self-care features remain ready to use."
            )
            return
        }

        if (!consentManager.canRequestAds) {
            _adUiState.value = RewardedAdUiState.Failed(
                level = level,
                errorCode = -100,
                userMessage = "Ad privacy consent is required before loading optional rewarded ads. You can continue using all free features or review Privacy Options."
            )
            return
        }

        initializeSdkIfAllowed()
        _adUiState.value = RewardedAdUiState.Loading(level)

        var rewardEarnedThisImpression = false
        var earnedType = ""
        var earnedAmount = 0

        transport.loadAndPresent(
            activity = activity,
            adUnitId = activeAdUnitId,
            callbacks = object : RewardedAdTransportCallbacks {
                override fun onAdFailedToLoad(errorCode: Int, message: String) {
                    // Never grant reward on load failure; let user continue using all free features.
                    _adUiState.value = RewardedAdUiState.Failed(
                        level = level,
                        errorCode = errorCode,
                        userMessage = "Could not load optional ad right now (offline or unavailable). All free self-care features remain ready to use."
                    )
                }

                override fun onAdShowed() {
                    // Strictly do NOT grant reward merely because the ad opened.
                    _adUiState.value = RewardedAdUiState.Showing(level)
                }

                override fun onAdFailedToShow(errorCode: Int, message: String) {
                    // Never grant reward on show failure.
                    _adUiState.value = RewardedAdUiState.Failed(
                        level = level,
                        errorCode = errorCode,
                        userMessage = "Unable to display the optional ad right now. All free self-care features remain available."
                    )
                }

                override fun onUserEarnedReward(rewardType: String, rewardAmount: Int) {
                    // ONLY place a reward is marked earned — never on open or early dismiss.
                    rewardEarnedThisImpression = true
                    earnedType = rewardType
                    earnedAmount = rewardAmount
                    coroutineScope.launch {
                        when (val result = rewardAccessManager.completeRewardUnlock(level)) {
                            is AppResult.Success -> {
                                _adUiState.value = RewardedAdUiState.RewardEarned(
                                    level = level,
                                    rewardType = earnedType,
                                    rewardAmount = earnedAmount,
                                    expiresAtMillis = result.data.expiresAtMillis
                                )
                            }
                            is AppResult.Error -> {
                                _adUiState.value = RewardedAdUiState.Failed(
                                    level = level,
                                    errorCode = -200,
                                    userMessage = result.message
                                )
                            }
                        }
                    }
                }

                override fun onAdDismissed() {
                    if (!rewardEarnedThisImpression) {
                        // Dismissed before completion — strictly ZERO reward granted!
                        _adUiState.value = RewardedAdUiState.DismissedWithoutReward(level = level)
                    }
                }
            }
        )
    }

    override fun resetAdState() {
        _adUiState.value = RewardedAdUiState.Idle
    }
}

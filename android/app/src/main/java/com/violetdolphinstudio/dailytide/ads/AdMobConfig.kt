package com.violetdolphinstudio.dailytide.ads

import com.google.android.gms.ads.AdRequest
import com.violetdolphinstudio.dailytide.BuildConfig

/**
 * Isolated AdMob configuration for Daily Tide.
 *
 * - Debug builds ALWAYS use official Google Mobile Ads test IDs.
 * - Release builds strictly REFUSE Google test ad unit IDs so test ads are never served in production.
 */
object AdMobConfig {
    /** Official Google Mobile Ads sample publisher prefix (strictly forbidden in release builds). */
    const val OFFICIAL_TEST_PUBLISHER_PREFIX: String = "ca-app-pub-3940256099942544"

    /** Official Google Mobile Ads Android sample App ID (used in debug builds). */
    const val OFFICIAL_TEST_APP_ID: String = "$OFFICIAL_TEST_PUBLISHER_PREFIX~3347511713"

    /** Official Google Android Rewarded Video Test Ad Unit ID (used in debug builds). */
    const val OFFICIAL_TEST_REWARDED_AD_UNIT_ID: String = "$OFFICIAL_TEST_PUBLISHER_PREFIX/5224354917"

    /**
     * Resolves the active rewarded ad unit ID.
     * - In debug builds: ALWAYS returns [OFFICIAL_TEST_REWARDED_AD_UNIT_ID].
     * - In release builds: returns the configured production unit ID, or empty string if missing
     *   or mistakenly set to a Google test ID.
     */
    fun resolveRewardedAdUnitId(): String {
        if (BuildConfig.DEBUG) {
            return OFFICIAL_TEST_REWARDED_AD_UNIT_ID
        }
        val configured = BuildConfig.ADMOB_REWARDED_AD_UNIT_ID.trim()
        if (configured.isBlank() || isOfficialTestAdUnit(configured)) {
            return ""
        }
        return configured
    }

    fun isOfficialTestAdUnit(adUnitId: String): Boolean =
        adUnitId.trim().startsWith(OFFICIAL_TEST_PUBLISHER_PREFIX)

    fun isAdUnitUsable(adUnitId: String): Boolean {
        val trimmed = adUnitId.trim()
        if (trimmed.isBlank()) return false
        return BuildConfig.DEBUG || !isOfficialTestAdUnit(trimmed)
    }

    /**
     * Builds a clean, privacy-respecting [AdRequest].
     *
     * PRIVACY BOUNDARY:
     * Never attaches user journal entries, moods, appreciation notes, habits, or hydration data.
     */
    fun buildCleanAdRequest(): AdRequest = AdRequest.Builder().build()
}

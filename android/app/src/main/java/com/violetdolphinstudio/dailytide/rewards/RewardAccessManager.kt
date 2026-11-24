package com.violetdolphinstudio.dailytide.rewards

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.violetdolphinstudio.dailytide.domain.model.AppResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

private val Context.rewardAccessDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "daily_tide_reward_access"
)

/**
 * Core self-care features that belong to the FREE LEVEL forever and are never locked behind ads.
 */
data class FreeLevelFeature(
    val id: String,
    val title: String,
    val description: String
)

val FREE_LEVEL_FEATURES: List<FreeLevelFeature> = listOf(
    FreeLevelFeature(
        id = "free_hydration",
        title = "Hydration Tracking",
        description = "Custom daily goals, custom vessels, one-tap logging, history, and automatic daily reset."
    ),
    FreeLevelFeature(
        id = "free_mood",
        title = "Daily Mood Check-In",
        description = "Five calm mood states, context tags, private notes, and local mood timeline."
    ),
    FreeLevelFeature(
        id = "free_reflection",
        title = "Basic Reflection & Self-Appreciation",
        description = "Guided 5-question reflection, freeform journaling, and Self-Appreciation Vault."
    ),
    FreeLevelFeature(
        id = "free_motivation",
        title = "Basic Motivation Library",
        description = "All 105 original offline motivational messages across 7 personal growth themes."
    ),
    FreeLevelFeature(
        id = "free_habits",
        title = "Basic Habit Tracking",
        description = "Create, edit, pause, and complete personal habits plus Progress Garden."
    )
)

/**
 * Configurable Timed Reward Levels for Daily Tide.
 * No live advertisement SDK is integrated yet; completion is verified via [RewardVerificationProvider].
 */
enum class RewardLevel(
    val id: String,
    val levelNumber: Int,
    val title: String,
    val description: String,
    val requiredAdsCount: Int,
    val durationHours: Long
) {
    LEVEL_1_SPECIAL_MOTIVATION(
        id = "level_1_special_motivation",
        levelNumber = 1,
        title = "Special Motivation Collection",
        description = "Curated restorative essays and deep-calm reflection cues. Available offline once unlocked.",
        requiredAdsCount = 1,
        durationHours = 2L
    ),
    LEVEL_2_ADVANCED_REFLECTION(
        id = "level_2_advanced_reflection",
        levelNumber = 2,
        title = "Advanced Reflection Collection",
        description = "Emotional clarity, energy audit, values alignment, and future-self reflection templates.",
        requiredAdsCount = 1,
        durationHours = 24L
    ),
    LEVEL_3_SPECIAL_CHALLENGES(
        id = "level_3_special_challenges",
        levelNumber = 3,
        title = "Special Self-Care Challenges",
        description = "Multi-step restorative calm rituals including Digital Sunset and Five-Senses Grounding.",
        requiredAdsCount = 1,
        durationHours = 24L
    ),
    LEVEL_4_VISUAL_THEMES(
        id = "level_4_visual_themes",
        levelNumber = 4,
        title = "Additional Visual Themes",
        description = "Violet Dusk, Midnight Tide, and Aurora Lagoon themes for local shareable cards.",
        requiredAdsCount = 1,
        durationHours = 48L
    ),
    LEVEL_5_PERSONAL_BMI_HYDRATION(
        id = "level_5_personal_bmi_hydration",
        levelNumber = 5,
        title = "Personal BMI & Safe Hydration Guide",
        description = "Personal height & weight BMI calculator with safe litre hydration range, pacing rhythm, and wellness tips (informational only).",
        requiredAdsCount = 1,
        durationHours = 48L
    );

    val durationMillis: Long
        get() = durationHours * 60L * 60L * 1000L

    companion object {
        fun fromId(id: String): RewardLevel? = entries.firstOrNull { it.id == id }
    }
}

enum class RewardAccessStatus {
    LOCKED,
    UNLOCKED,
    EXPIRED
}

enum class RewardHistoryEventType {
    UNLOCKED,
    RENEWED,
    EXPIRED
}

enum class RewardVerificationSource {
    LOCAL_MOCK,
    ADMOB_SDK_CALLBACK,
    SERVER_VERIFIED
}

data class RewardAccessGrant(
    val level: RewardLevel,
    val unlockedAtMillis: Long,
    val expiresAtMillis: Long,
    val durationHours: Long,
    val verificationSource: RewardVerificationSource,
    val receiptId: String
)

data class RewardHistoryRecord(
    val id: String,
    val level: RewardLevel,
    val eventType: RewardHistoryEventType,
    val timestampMillis: Long,
    val unlockedAtMillis: Long,
    val expiresAtMillis: Long,
    val durationHours: Long,
    val verificationSource: RewardVerificationSource,
    val receiptId: String
)

data class RewardLevelSnapshot(
    val level: RewardLevel,
    val status: RewardAccessStatus,
    val isUnlocked: Boolean,
    val unlockedAtMillis: Long?,
    val expiresAtMillis: Long?,
    val remainingMillis: Long,
    val remainingFormatted: String,
    val lastGrant: RewardAccessGrant?
)

data class RewardAccessState(
    val evaluatedAtMillis: Long,
    val isLiveAdSdkIntegrated: Boolean,
    val verificationSource: RewardVerificationSource,
    val levels: List<RewardLevelSnapshot>,
    val history: List<RewardHistoryRecord>
) {
    val unlockedLevels: Set<RewardLevel>
        get() = levels.filter { it.isUnlocked }.map { it.level }.toSet()

    fun snapshotFor(level: RewardLevel): RewardLevelSnapshot =
        levels.first { it.level == level }
}

data class RewardAccessPersistedPayload(
    val grants: Map<RewardLevel, RewardAccessGrant> = emptyMap(),
    val history: List<RewardHistoryRecord> = emptyList(),
    val recordedExpiredReceiptIds: Set<String> = emptySet()
)

fun interface RewardClock {
    fun nowMillis(): Long
}

class SystemRewardClock : RewardClock {
    override fun nowMillis(): Long = System.currentTimeMillis()
}

data class RewardVerificationResult(
    val verified: Boolean,
    val receiptId: String,
    val source: RewardVerificationSource,
    val verifiedAtMillis: Long,
    val errorMessage: String? = null
)

/**
 * Modular verification boundary for rewarded access.
 *
 * SECURITY LIMITATION DISCLOSURE:
 * Initial release uses [LocalMockRewardVerificationProvider] with locally stored grants
 * and device wall-clock timestamps. Locally stored reward records and device time are
 * convenient for offline-first access but are NOT tamper-proof.
 *
 * In a future commercial release, swap this provider with a Server-Side Verification (SSV)
 * implementation without modifying UI screens, ViewModels, or offline local caching.
 */
interface RewardVerificationProvider {
    val source: RewardVerificationSource
    val isLiveAdSdkIntegrated: Boolean
    suspend fun verifyCompletedReward(
        level: RewardLevel,
        nowMillis: Long
    ): RewardVerificationResult
}

class LocalMockRewardVerificationProvider : RewardVerificationProvider {
    override val source: RewardVerificationSource = RewardVerificationSource.LOCAL_MOCK
    override val isLiveAdSdkIntegrated: Boolean = false

    override suspend fun verifyCompletedReward(
        level: RewardLevel,
        nowMillis: Long
    ): RewardVerificationResult {
        return RewardVerificationResult(
            verified = true,
            receiptId = "mock_${level.id}_${nowMillis}_${UUID.randomUUID().toString().take(8)}",
            source = RewardVerificationSource.LOCAL_MOCK,
            verifiedAtMillis = nowMillis
        )
    }
}

interface RewardAccessStorage {
    val payloadFlow: Flow<RewardAccessPersistedPayload>
    suspend fun read(): RewardAccessPersistedPayload
    suspend fun write(payload: RewardAccessPersistedPayload)
    suspend fun clear()
}

/**
 * Pure in-memory storage adapter for fast JVM unit tests.
 */
class InMemoryRewardAccessStorage(
    initial: RewardAccessPersistedPayload = RewardAccessPersistedPayload()
) : RewardAccessStorage {
    private val state = MutableStateFlow(initial)
    override val payloadFlow: Flow<RewardAccessPersistedPayload> = state
    override suspend fun read(): RewardAccessPersistedPayload = state.value
    override suspend fun write(payload: RewardAccessPersistedPayload) {
        state.value = payload
    }
    override suspend fun clear() {
        state.value = RewardAccessPersistedPayload()
    }
}

/**
 * Dedicated local DataStore persistence for timed reward grants and reward history.
 * Works 100% offline in airplane mode and survives process restarts and reboots.
 */
class DataStoreRewardAccessStorage(
    private val context: Context
) : RewardAccessStorage {
    private val payloadKey = stringPreferencesKey("reward_access_payload_json_v1")

    override val payloadFlow: Flow<RewardAccessPersistedPayload> =
        context.rewardAccessDataStore.data.map { prefs ->
            decodePayload(prefs[payloadKey])
        }

    override suspend fun read(): RewardAccessPersistedPayload =
        decodePayload(context.rewardAccessDataStore.data.first()[payloadKey])

    override suspend fun write(payload: RewardAccessPersistedPayload) {
        val encoded = encodePayload(payload)
        context.rewardAccessDataStore.edit { prefs ->
            prefs[payloadKey] = encoded
        }
    }

    override suspend fun clear() {
        context.rewardAccessDataStore.edit { prefs ->
            prefs.remove(payloadKey)
        }
    }

    companion object {
        fun encodePayload(payload: RewardAccessPersistedPayload): String {
            val root = JSONObject()
            val grantsJson = JSONObject()
            payload.grants.forEach { (level, grant) ->
                grantsJson.put(
                    level.id,
                    JSONObject().apply {
                        put("levelId", grant.level.id)
                        put("unlockedAtMillis", grant.unlockedAtMillis)
                        put("expiresAtMillis", grant.expiresAtMillis)
                        put("durationHours", grant.durationHours)
                        put("verificationSource", grant.verificationSource.name)
                        put("receiptId", grant.receiptId)
                    }
                )
            }
            root.put("grants", grantsJson)

            val historyArr = JSONArray()
            payload.history.take(100).forEach { record ->
                historyArr.put(
                    JSONObject().apply {
                        put("id", record.id)
                        put("levelId", record.level.id)
                        put("eventType", record.eventType.name)
                        put("timestampMillis", record.timestampMillis)
                        put("unlockedAtMillis", record.unlockedAtMillis)
                        put("expiresAtMillis", record.expiresAtMillis)
                        put("durationHours", record.durationHours)
                        put("verificationSource", record.verificationSource.name)
                        put("receiptId", record.receiptId)
                    }
                )
            }
            root.put("history", historyArr)
            root.put("recordedExpiredReceiptIds", JSONArray(payload.recordedExpiredReceiptIds.toList()))
            return root.toString()
        }

        fun decodePayload(raw: String?): RewardAccessPersistedPayload {
            if (raw.isNullOrBlank()) return RewardAccessPersistedPayload()
            return try {
                val root = JSONObject(raw)
                val grants = mutableMapOf<RewardLevel, RewardAccessGrant>()
                val grantsJson = root.optJSONObject("grants")
                if (grantsJson != null) {
                    val keys = grantsJson.keys()
                    while (keys.hasNext()) {
                        val key = keys.next()
                        val level = RewardLevel.fromId(key) ?: continue
                        val obj = grantsJson.optJSONObject(key) ?: continue
                        val source = runCatching {
                            RewardVerificationSource.valueOf(obj.optString("verificationSource", "LOCAL_MOCK"))
                        }.getOrDefault(RewardVerificationSource.LOCAL_MOCK)
                        grants[level] = RewardAccessGrant(
                            level = level,
                            unlockedAtMillis = obj.optLong("unlockedAtMillis", 0L),
                            expiresAtMillis = obj.optLong("expiresAtMillis", 0L),
                            durationHours = obj.optLong("durationHours", level.durationHours),
                            verificationSource = source,
                            receiptId = obj.optString("receiptId", "")
                        )
                    }
                }

                val history = mutableListOf<RewardHistoryRecord>()
                val historyArr = root.optJSONArray("history")
                if (historyArr != null) {
                    for (i in 0 until historyArr.length()) {
                        val obj = historyArr.optJSONObject(i) ?: continue
                        val level = RewardLevel.fromId(obj.optString("levelId")) ?: continue
                        val eventType = runCatching {
                            RewardHistoryEventType.valueOf(obj.optString("eventType", "UNLOCKED"))
                        }.getOrDefault(RewardHistoryEventType.UNLOCKED)
                        val source = runCatching {
                            RewardVerificationSource.valueOf(obj.optString("verificationSource", "LOCAL_MOCK"))
                        }.getOrDefault(RewardVerificationSource.LOCAL_MOCK)
                        history += RewardHistoryRecord(
                            id = obj.optString("id", "rh_$i"),
                            level = level,
                            eventType = eventType,
                            timestampMillis = obj.optLong("timestampMillis", 0L),
                            unlockedAtMillis = obj.optLong("unlockedAtMillis", 0L),
                            expiresAtMillis = obj.optLong("expiresAtMillis", 0L),
                            durationHours = obj.optLong("durationHours", level.durationHours),
                            verificationSource = source,
                            receiptId = obj.optString("receiptId", "")
                        )
                    }
                }

                val expiredIds = buildSet {
                    val arr = root.optJSONArray("recordedExpiredReceiptIds")
                    if (arr != null) {
                        for (i in 0 until arr.length()) {
                            val id = arr.optString(i)
                            if (id.isNotBlank()) add(id)
                        }
                    }
                }

                RewardAccessPersistedPayload(
                    grants = grants,
                    history = history,
                    recordedExpiredReceiptIds = expiredIds
                )
            } catch (_: Exception) {
                RewardAccessPersistedPayload()
            }
        }
    }
}

interface RewardAccessManager {
    fun observeRewardAccessState(): Flow<RewardAccessState>
    suspend fun getCurrentState(): RewardAccessState
    suspend fun isLevelUnlocked(level: RewardLevel): Boolean
    suspend fun completeRewardUnlock(level: RewardLevel): AppResult<RewardAccessGrant>
    suspend fun sweepExpirations(): RewardAccessState
    suspend fun expireLevelNowForTesting(level: RewardLevel): AppResult<Unit>
    suspend fun clearAllRewardData(): AppResult<Unit>
}

/**
 * Independent, configurable, testable RewardAccessManager for Daily Tide.
 *
 * Manages timed access grants (Levels 1–4), live remaining access time, automatic expiration,
 * persistent local history, and offline feature availability after unlocking.
 */
class DefaultRewardAccessManager(
    private val storage: RewardAccessStorage,
    private val verificationProvider: RewardVerificationProvider = LocalMockRewardVerificationProvider(),
    private val clock: RewardClock = SystemRewardClock()
) : RewardAccessManager {

    override fun observeRewardAccessState(): Flow<RewardAccessState> =
        storage.payloadFlow.map { payload ->
            buildState(payload, clock.nowMillis())
        }

    override suspend fun getCurrentState(): RewardAccessState {
        return sweepExpirations()
    }

    override suspend fun isLevelUnlocked(level: RewardLevel): Boolean {
        return sweepExpirations().snapshotFor(level).isUnlocked
    }

    override suspend fun completeRewardUnlock(level: RewardLevel): AppResult<RewardAccessGrant> {
        return try {
            val now = clock.nowMillis()
            val verification = verificationProvider.verifyCompletedReward(level, now)
            if (!verification.verified) {
                return AppResult.Error(verification.errorMessage ?: "Reward verification failed.")
            }

            val current = reconcileExpirations(storage.read(), now).first
            val existingGrant = current.grants[level]
            val wasActive = existingGrant != null && existingGrant.expiresAtMillis > now

            val grant = RewardAccessGrant(
                level = level,
                unlockedAtMillis = now,
                expiresAtMillis = now + level.durationMillis,
                durationHours = level.durationHours,
                verificationSource = verification.source,
                receiptId = verification.receiptId
            )

            val historyEntry = RewardHistoryRecord(
                id = "rh_${now}_${UUID.randomUUID().toString().take(6)}",
                level = level,
                eventType = if (wasActive) RewardHistoryEventType.RENEWED else RewardHistoryEventType.UNLOCKED,
                timestampMillis = now,
                unlockedAtMillis = grant.unlockedAtMillis,
                expiresAtMillis = grant.expiresAtMillis,
                durationHours = grant.durationHours,
                verificationSource = grant.verificationSource,
                receiptId = grant.receiptId
            )

            val updatedGrants = current.grants.toMutableMap().apply {
                put(level, grant)
            }
            val updatedPayload = current.copy(
                grants = updatedGrants,
                history = (listOf(historyEntry) + current.history).take(100)
            )
            storage.write(updatedPayload)
            AppResult.Success(grant)
        } catch (e: Exception) {
            AppResult.Error("Unable to persist local reward grant.", e)
        }
    }

    override suspend fun sweepExpirations(): RewardAccessState {
        val now = clock.nowMillis()
        val raw = storage.read()
        val (reconciled, changed) = reconcileExpirations(raw, now)
        if (changed) {
            storage.write(reconciled)
        }
        return buildState(reconciled, now)
    }

    override suspend fun expireLevelNowForTesting(level: RewardLevel): AppResult<Unit> {
        return try {
            val now = clock.nowMillis()
            val current = storage.read()
            val existing = current.grants[level] ?: return AppResult.Success(Unit)
            val expiredGrant = existing.copy(expiresAtMillis = minOf(existing.expiresAtMillis, now))
            val updatedGrants = current.grants.toMutableMap().apply {
                put(level, expiredGrant)
            }
            val (reconciled, _) = reconcileExpirations(current.copy(grants = updatedGrants), now)
            storage.write(reconciled)
            AppResult.Success(Unit)
        } catch (e: Exception) {
            AppResult.Error("Unable to expire reward level.", e)
        }
    }

    override suspend fun clearAllRewardData(): AppResult<Unit> {
        return try {
            storage.clear()
            AppResult.Success(Unit)
        } catch (e: Exception) {
            AppResult.Error("Unable to clear reward access records.", e)
        }
    }

    private fun reconcileExpirations(
        payload: RewardAccessPersistedPayload,
        nowMillis: Long
    ): Pair<RewardAccessPersistedPayload, Boolean> {
        var changed = false
        val newHistory = payload.history.toMutableList()
        val newExpiredIds = payload.recordedExpiredReceiptIds.toMutableSet()

        payload.grants.forEach { (level, grant) ->
            if (grant.expiresAtMillis <= nowMillis && !newExpiredIds.contains(grant.receiptId)) {
                newExpiredIds += grant.receiptId
                newHistory.add(
                    0,
                    RewardHistoryRecord(
                        id = "rh_exp_${grant.receiptId}",
                        level = level,
                        eventType = RewardHistoryEventType.EXPIRED,
                        timestampMillis = nowMillis,
                        unlockedAtMillis = grant.unlockedAtMillis,
                        expiresAtMillis = grant.expiresAtMillis,
                        durationHours = grant.durationHours,
                        verificationSource = grant.verificationSource,
                        receiptId = grant.receiptId
                    )
                )
                changed = true
            }
        }

        if (!changed) return payload to false
        return payload.copy(
            history = newHistory.take(100),
            recordedExpiredReceiptIds = newExpiredIds
        ) to true
    }

    private fun buildState(
        payload: RewardAccessPersistedPayload,
        nowMillis: Long
    ): RewardAccessState {
        val snapshots = RewardLevel.entries.map { level ->
            val grant = payload.grants[level]
            if (grant == null) {
                RewardLevelSnapshot(
                    level = level,
                    status = RewardAccessStatus.LOCKED,
                    isUnlocked = false,
                    unlockedAtMillis = null,
                    expiresAtMillis = null,
                    remainingMillis = 0L,
                    remainingFormatted = "Locked",
                    lastGrant = null
                )
            } else {
                val remaining = (grant.expiresAtMillis - nowMillis).coerceAtLeast(0L)
                val active = remaining > 0L
                RewardLevelSnapshot(
                    level = level,
                    status = if (active) RewardAccessStatus.UNLOCKED else RewardAccessStatus.EXPIRED,
                    isUnlocked = active,
                    unlockedAtMillis = grant.unlockedAtMillis,
                    expiresAtMillis = grant.expiresAtMillis,
                    remainingMillis = remaining,
                    remainingFormatted = if (active) formatRemainingDuration(remaining) else "Expired",
                    lastGrant = grant
                )
            }
        }

        return RewardAccessState(
            evaluatedAtMillis = nowMillis,
            isLiveAdSdkIntegrated = verificationProvider.isLiveAdSdkIntegrated,
            verificationSource = verificationProvider.source,
            levels = snapshots,
            history = payload.history
        )
    }

    companion object {
        fun formatRemainingDuration(remainingMillis: Long): String {
            if (remainingMillis <= 0L) return "Expired"
            val totalSeconds = remainingMillis / 1000L
            val hours = totalSeconds / 3600L
            val minutes = (totalSeconds % 3600L) / 60L
            val seconds = totalSeconds % 60L
            return when {
                hours >= 1L -> "${hours}h ${minutes}m remaining"
                minutes >= 1L -> "${minutes}m ${seconds}s remaining"
                else -> "${seconds}s remaining"
            }
        }
    }
}

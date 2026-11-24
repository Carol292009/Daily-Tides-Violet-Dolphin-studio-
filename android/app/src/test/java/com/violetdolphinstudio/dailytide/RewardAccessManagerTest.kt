package com.violetdolphinstudio.dailytide

import com.violetdolphinstudio.dailytide.domain.model.AppResult
import com.violetdolphinstudio.dailytide.rewards.DefaultRewardAccessManager
import com.violetdolphinstudio.dailytide.rewards.FREE_LEVEL_FEATURES
import com.violetdolphinstudio.dailytide.rewards.InMemoryRewardAccessStorage
import com.violetdolphinstudio.dailytide.rewards.RewardAccessStatus
import com.violetdolphinstudio.dailytide.rewards.RewardClock
import com.violetdolphinstudio.dailytide.rewards.RewardHistoryEventType
import com.violetdolphinstudio.dailytide.rewards.RewardLevel
import com.violetdolphinstudio.dailytide.rewards.RewardVerificationProvider
import com.violetdolphinstudio.dailytide.rewards.RewardVerificationResult
import com.violetdolphinstudio.dailytide.rewards.RewardVerificationSource
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class RewardAccessManagerTest {

    private class MutableTestClock(var currentMillis: Long) : RewardClock {
        override fun nowMillis(): Long = currentMillis
        fun advanceHours(hours: Long) {
            currentMillis += hours * 60L * 60L * 1000L
        }
    }

    @Test
    fun freeLevelAlwaysContainsCoreFiveSelfCareFeatures() {
        val titles = FREE_LEVEL_FEATURES.map { it.title }
        assertEquals(5, titles.size)
        assertTrue(titles.any { it.contains("Hydration", ignoreCase = true) })
        assertTrue(titles.any { it.contains("Mood", ignoreCase = true) })
        assertTrue(titles.any { it.contains("Reflection", ignoreCase = true) })
        assertTrue(titles.any { it.contains("Motivation", ignoreCase = true) })
        assertTrue(titles.any { it.contains("Habit", ignoreCase = true) })
    }

    @Test
    fun timedLevelsUnlockWithExactDurationsAndExpireAutomatically() = runBlocking {
        val clock = MutableTestClock(1_700_000_000_000L)
        val storage = InMemoryRewardAccessStorage()
        val manager = DefaultRewardAccessManager(storage = storage, clock = clock)

        // Initially all 4 levels are LOCKED
        val initial = manager.getCurrentState()
        assertTrue(initial.unlockedLevels.isEmpty())
        assertTrue(initial.levels.all { it.status == RewardAccessStatus.LOCKED })

        // Unlock all 4 levels at t = 0
        val l1 = manager.completeRewardUnlock(RewardLevel.LEVEL_1_SPECIAL_MOTIVATION)
        val l2 = manager.completeRewardUnlock(RewardLevel.LEVEL_2_ADVANCED_REFLECTION)
        val l3 = manager.completeRewardUnlock(RewardLevel.LEVEL_3_SPECIAL_CHALLENGES)
        val l4 = manager.completeRewardUnlock(RewardLevel.LEVEL_4_VISUAL_THEMES)
        assertTrue(l1 is AppResult.Success && l2 is AppResult.Success && l3 is AppResult.Success && l4 is AppResult.Success)

        val activeState = manager.getCurrentState()
        assertEquals(4, activeState.unlockedLevels.size)
        assertEquals(2L * 3_600_000L, activeState.snapshotFor(RewardLevel.LEVEL_1_SPECIAL_MOTIVATION).remainingMillis)
        assertEquals(24L * 3_600_000L, activeState.snapshotFor(RewardLevel.LEVEL_2_ADVANCED_REFLECTION).remainingMillis)
        assertEquals(24L * 3_600_000L, activeState.snapshotFor(RewardLevel.LEVEL_3_SPECIAL_CHALLENGES).remainingMillis)
        assertEquals(48L * 3_600_000L, activeState.snapshotFor(RewardLevel.LEVEL_4_VISUAL_THEMES).remainingMillis)

        // Advance 2 hours: Level 1 auto-expires, Levels 2, 3, 4 stay unlocked offline
        clock.advanceHours(2L)
        val after2h = manager.getCurrentState()
        assertEquals(RewardAccessStatus.EXPIRED, after2h.snapshotFor(RewardLevel.LEVEL_1_SPECIAL_MOTIVATION).status)
        assertFalse(after2h.snapshotFor(RewardLevel.LEVEL_1_SPECIAL_MOTIVATION).isUnlocked)
        assertTrue(after2h.snapshotFor(RewardLevel.LEVEL_2_ADVANCED_REFLECTION).isUnlocked)
        assertTrue(after2h.snapshotFor(RewardLevel.LEVEL_3_SPECIAL_CHALLENGES).isUnlocked)
        assertTrue(after2h.snapshotFor(RewardLevel.LEVEL_4_VISUAL_THEMES).isUnlocked)
        assertEquals(1, after2h.history.count { it.eventType == RewardHistoryEventType.EXPIRED })

        // Calling sweep again is idempotent (does not duplicate EXPIRED history events)
        val after2hAgain = manager.getCurrentState()
        assertEquals(1, after2hAgain.history.count { it.eventType == RewardHistoryEventType.EXPIRED })

        // Advance to 24 hours: Levels 2 & 3 auto-expire, Level 4 still has 24 hours left
        clock.advanceHours(22L)
        val after24h = manager.getCurrentState()
        assertEquals(RewardAccessStatus.EXPIRED, after24h.snapshotFor(RewardLevel.LEVEL_2_ADVANCED_REFLECTION).status)
        assertEquals(RewardAccessStatus.EXPIRED, after24h.snapshotFor(RewardLevel.LEVEL_3_SPECIAL_CHALLENGES).status)
        assertTrue(after24h.snapshotFor(RewardLevel.LEVEL_4_VISUAL_THEMES).isUnlocked)
        assertEquals(24L * 3_600_000L, after24h.snapshotFor(RewardLevel.LEVEL_4_VISUAL_THEMES).remainingMillis)

        // Advance to 48 hours: Level 4 expires too
        clock.advanceHours(24L)
        val after48h = manager.getCurrentState()
        assertEquals(RewardAccessStatus.EXPIRED, after48h.snapshotFor(RewardLevel.LEVEL_4_VISUAL_THEMES).status)
        assertTrue(after48h.unlockedLevels.isEmpty())
    }

    @Test
    fun persistenceRenewalAndCustomServerVerificationProviderWorkCleanly() = runBlocking {
        val clock = MutableTestClock(1_700_000_000_000L)
        val sharedStorage = InMemoryRewardAccessStorage()
        val serverVerifier = object : RewardVerificationProvider {
            override val source: RewardVerificationSource = RewardVerificationSource.SERVER_VERIFIED
            override val isLiveAdSdkIntegrated: Boolean = true
            override suspend fun verifyCompletedReward(
                level: RewardLevel,
                nowMillis: Long
            ): RewardVerificationResult = RewardVerificationResult(
                verified = true,
                receiptId = "ssv_receipt_${level.levelNumber}_$nowMillis",
                source = RewardVerificationSource.SERVER_VERIFIED,
                verifiedAtMillis = nowMillis
            )
        }

        val manager1 = DefaultRewardAccessManager(
            storage = sharedStorage,
            verificationProvider = serverVerifier,
            clock = clock
        )
        manager1.completeRewardUnlock(RewardLevel.LEVEL_1_SPECIAL_MOTIVATION)

        // Advance 1 hour and renew while still active -> logs RENEWED
        clock.advanceHours(1L)
        manager1.completeRewardUnlock(RewardLevel.LEVEL_1_SPECIAL_MOTIVATION)

        // Re-create manager (simulates cold restart) using same persistent storage
        val manager2 = DefaultRewardAccessManager(
            storage = sharedStorage,
            verificationProvider = serverVerifier,
            clock = clock
        )
        val restored = manager2.getCurrentState()
        assertTrue(restored.snapshotFor(RewardLevel.LEVEL_1_SPECIAL_MOTIVATION).isUnlocked)
        assertEquals(RewardVerificationSource.SERVER_VERIFIED, restored.verificationSource)
        assertEquals(RewardHistoryEventType.RENEWED, restored.history.first().eventType)

        // Clear data resets all grants and history
        manager2.clearAllRewardData()
        val cleared = manager2.getCurrentState()
        assertTrue(cleared.unlockedLevels.isEmpty())
        assertTrue(cleared.history.isEmpty())
    }
}

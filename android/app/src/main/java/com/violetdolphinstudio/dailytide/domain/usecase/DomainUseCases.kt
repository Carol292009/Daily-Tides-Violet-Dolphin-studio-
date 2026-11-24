package com.violetdolphinstudio.dailytide.domain.usecase

import com.violetdolphinstudio.dailytide.domain.model.AchievementBadge
import com.violetdolphinstudio.dailytide.domain.model.AppResult
import com.violetdolphinstudio.dailytide.domain.model.LocalDateUtil
import com.violetdolphinstudio.dailytide.domain.model.WaterVessel
import com.violetdolphinstudio.dailytide.domain.model.WeeklySummary
import com.violetdolphinstudio.dailytide.domain.repository.HabitChallengeRepository
import com.violetdolphinstudio.dailytide.domain.repository.HydrationRepository
import com.violetdolphinstudio.dailytide.domain.repository.ProgressRepository
import com.violetdolphinstudio.dailytide.domain.repository.ReflectionRepository

class LogWaterUseCase(
    private val hydrationRepository: HydrationRepository,
    private val progressRepository: ProgressRepository
) {
    suspend operator fun invoke(
        amountMl: Int,
        vessel: WaterVessel?,
        dateEpochDay: Long = LocalDateUtil.todayEpochDay()
    ): AppResult<Long> {
        val result = hydrationRepository.logWater(dateEpochDay, amountMl, vessel)
        if (result is AppResult.Success) {
            progressRepository.evaluateAndUnlockBadges(dateEpochDay)
        }
        return result
    }
}

class ToggleHabitUseCase(
    private val habitChallengeRepository: HabitChallengeRepository,
    private val progressRepository: ProgressRepository
) {
    suspend operator fun invoke(
        habitId: Long,
        dateEpochDay: Long = LocalDateUtil.todayEpochDay()
    ): AppResult<Boolean> {
        val result = habitChallengeRepository.toggleHabitCompletion(habitId, dateEpochDay)
        if (result is AppResult.Success) {
            progressRepository.evaluateAndUnlockBadges(dateEpochDay)
        }
        return result
    }
}

class CompleteDailyChallengeUseCase(
    private val habitChallengeRepository: HabitChallengeRepository,
    private val progressRepository: ProgressRepository
) {
    suspend operator fun invoke(
        dateEpochDay: Long = LocalDateUtil.todayEpochDay()
    ): AppResult<Unit> {
        val result = habitChallengeRepository.completeDailyChallenge(dateEpochDay)
        if (result is AppResult.Success) {
            progressRepository.evaluateAndUnlockBadges(dateEpochDay)
        }
        return result
    }
}

class EvaluateBadgesUseCase(
    private val progressRepository: ProgressRepository
) {
    suspend operator fun invoke(
        todayEpochDay: Long = LocalDateUtil.todayEpochDay()
    ): AppResult<List<AchievementBadge>> = progressRepository.evaluateAndUnlockBadges(todayEpochDay)
}

class BuildWeeklySummaryUseCase(
    private val progressRepository: ProgressRepository
) {
    suspend operator fun invoke(
        todayEpochDay: Long = LocalDateUtil.todayEpochDay()
    ): AppResult<WeeklySummary> = progressRepository.generateWeeklySummary(todayEpochDay)
}

class SaveReflectionAndCheckBadgesUseCase(
    private val reflectionRepository: ReflectionRepository,
    private val progressRepository: ProgressRepository
) {
    suspend fun saveJournal(
        entryId: Long?,
        title: String,
        body: String,
        dateEpochDay: Long = LocalDateUtil.todayEpochDay()
    ): AppResult<Long> {
        val result = reflectionRepository.saveJournalEntry(entryId, dateEpochDay, title, body, null)
        if (result is AppResult.Success) {
            progressRepository.evaluateAndUnlockBadges(dateEpochDay)
        }
        return result
    }
}

package com.violetdolphinstudio.dailytide.data.repository

import com.violetdolphinstudio.dailytide.data.local.db.dao.HabitChallengeDao
import com.violetdolphinstudio.dailytide.data.local.db.dao.HydrationDao
import com.violetdolphinstudio.dailytide.data.local.db.dao.ProgressBadgeDao
import com.violetdolphinstudio.dailytide.data.local.db.dao.ReflectionDao
import com.violetdolphinstudio.dailytide.data.local.db.entity.AppreciationAnswerEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.DailyChallengeLogEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.DailyGoalEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.HabitEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.HabitLogEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.JournalEntryEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.MoodCheckInEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.WaterLogEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.WaterVesselEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.WeeklySummaryEntity
import com.violetdolphinstudio.dailytide.domain.model.AchievementBadge
import com.violetdolphinstudio.dailytide.domain.model.Affirmation
import com.violetdolphinstudio.dailytide.domain.model.AppResult
import com.violetdolphinstudio.dailytide.domain.model.AppreciationAnswer
import com.violetdolphinstudio.dailytide.domain.model.AppreciationPrompt
import com.violetdolphinstudio.dailytide.domain.model.ChallengeStatus
import com.violetdolphinstudio.dailytide.domain.model.DailyActivityPoint
import com.violetdolphinstudio.dailytide.domain.model.DailyChallengeState
import com.violetdolphinstudio.dailytide.domain.model.HabitItem
import com.violetdolphinstudio.dailytide.domain.model.HabitTimeOfDay
import com.violetdolphinstudio.dailytide.domain.model.HydrationDayState
import com.violetdolphinstudio.dailytide.domain.model.JournalEntry
import com.violetdolphinstudio.dailytide.domain.model.MoodCheckIn
import com.violetdolphinstudio.dailytide.domain.model.MoodLevel
import com.violetdolphinstudio.dailytide.domain.model.ProgressOverview
import com.violetdolphinstudio.dailytide.domain.model.SelfCareChallenge
import com.violetdolphinstudio.dailytide.domain.model.WaterLog
import com.violetdolphinstudio.dailytide.domain.model.WaterVessel
import com.violetdolphinstudio.dailytide.domain.model.WeeklySummary
import com.violetdolphinstudio.dailytide.domain.repository.HabitChallengeRepository
import com.violetdolphinstudio.dailytide.domain.repository.HydrationRepository
import com.violetdolphinstudio.dailytide.domain.repository.ProgressRepository
import com.violetdolphinstudio.dailytide.domain.repository.ReflectionRepository
import com.violetdolphinstudio.dailytide.domain.repository.SettingsRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlin.math.abs
import kotlin.math.roundToInt

class LocalHydrationRepository(
    private val hydrationDao: HydrationDao,
    private val settingsRepository: SettingsRepository
) : HydrationRepository {

    override fun observeDayHydration(dateEpochDay: Long): Flow<HydrationDayState> =
        combine(
            hydrationDao.observeLogsForDate(dateEpochDay),
            hydrationDao.observeDailyGoal(dateEpochDay),
            hydrationDao.observeActiveVessels(),
            settingsRepository.settingsFlow
        ) { logs, dailyGoal, vessels, settings ->
            val resolvedGoal = dailyGoal?.waterGoalMl ?: settings.dailyWaterGoalMl
            val domainLogs = logs.map {
                WaterLog(
                    id = it.id,
                    dateEpochDay = it.dateEpochDay,
                    loggedAtMillis = it.loggedAtMillis,
                    amountMl = it.amountMl,
                    vesselId = it.vesselId,
                    vesselName = it.vesselNameSnapshot
                )
            }
            val domainVessels = vessels.map {
                WaterVessel(
                    id = it.id,
                    name = it.name,
                    volumeMl = it.volumeMl,
                    iconKey = it.iconKey,
                    sortOrder = it.sortOrder,
                    isDefault = it.isDefault
                )
            }
            HydrationDayState(
                dateEpochDay = dateEpochDay,
                consumedMl = domainLogs.sumOf { it.amountMl },
                goalMl = resolvedGoal,
                logs = domainLogs,
                vessels = domainVessels
            )
        }

    override fun observeHydrationHistory(
        endEpochDay: Long,
        days: Int
    ): Flow<List<DailyActivityPoint>> {
        val count = days.coerceAtLeast(1)
        val startEpochDay = endEpochDay - (count - 1).toLong()
        return combine(
            hydrationDao.observeLogsBetween(startEpochDay, endEpochDay),
            hydrationDao.observeDailyGoalsBetween(startEpochDay, endEpochDay),
            settingsRepository.settingsFlow
        ) { logs, goals, settings ->
            (0 until count).map { offset ->
                val day = startEpochDay + offset
                val totalMl = logs.filter { it.dateEpochDay == day }.sumOf { it.amountMl }
                val goalMl = goals.firstOrNull { it.dateEpochDay == day }?.waterGoalMl
                    ?: settings.dailyWaterGoalMl
                DailyActivityPoint(
                    epochDay = day,
                    waterMl = totalMl,
                    goalMl = goalMl,
                    completedHabits = 0,
                    mood = null
                )
            }
        }
    }

    override fun observeVessels(): Flow<List<WaterVessel>> =
        hydrationDao.observeActiveVessels().map { list ->
            list.map {
                WaterVessel(
                    id = it.id,
                    name = it.name,
                    volumeMl = it.volumeMl,
                    iconKey = it.iconKey,
                    sortOrder = it.sortOrder,
                    isDefault = it.isDefault
                )
            }
        }

    override suspend fun logWater(
        dateEpochDay: Long,
        amountMl: Int,
        vessel: WaterVessel?
    ): AppResult<Long> = try {
        require(amountMl > 0) { "Amount must be positive." }
        val settings = settingsRepository.settingsFlow.first()
        hydrationDao.upsertDailyGoal(
            DailyGoalEntity(dateEpochDay = dateEpochDay, waterGoalMl = settings.dailyWaterGoalMl)
        )
        val id = hydrationDao.insertWaterLog(
            WaterLogEntity(
                dateEpochDay = dateEpochDay,
                loggedAtMillis = System.currentTimeMillis(),
                amountMl = amountMl,
                vesselId = vessel?.id,
                vesselNameSnapshot = vessel?.name ?: "Custom Sip"
            )
        )
        AppResult.Success(id)
    } catch (e: Exception) {
        AppResult.Error("Could not log water locally.", e)
    }

    override suspend fun deleteWaterLog(logId: Long): AppResult<Unit> = try {
        hydrationDao.deleteWaterLog(logId)
        AppResult.Success(Unit)
    } catch (e: Exception) {
        AppResult.Error("Could not remove water entry.", e)
    }

    override suspend fun saveCustomVessel(
        name: String,
        volumeMl: Int,
        iconKey: String
    ): AppResult<Long> = try {
        val trimmed = name.trim()
        require(trimmed.isNotEmpty()) { "Vessel name is required." }
        require(volumeMl in 25..3000) { "Volume must be between 25 ml and 3000 ml." }
        val currentCount = hydrationDao.vesselCount()
        val id = hydrationDao.insertVessel(
            WaterVesselEntity(
                name = trimmed,
                volumeMl = volumeMl,
                iconKey = iconKey,
                sortOrder = currentCount,
                isDefault = false
            )
        )
        AppResult.Success(id)
    } catch (e: Exception) {
        AppResult.Error(e.message ?: "Could not save custom glass.", e)
    }

    override suspend fun archiveVessel(vesselId: Long): AppResult<Unit> = try {
        hydrationDao.archiveVessel(vesselId)
        AppResult.Success(Unit)
    } catch (e: Exception) {
        AppResult.Error("Could not archive vessel.", e)
    }

    override suspend fun getLastLoggedTimestamp(dateEpochDay: Long): Long? =
        hydrationDao.getLastLoggedTimestamp(dateEpochDay)

    override suspend fun getTodayConsumedMl(dateEpochDay: Long): Int =
        hydrationDao.getTotalWaterForDate(dateEpochDay)

    override suspend fun getDefaultVessel(): WaterVessel? =
        hydrationDao.getDefaultVessel()?.let {
            WaterVessel(it.id, it.name, it.volumeMl, it.iconKey, it.sortOrder, it.isDefault)
        }
}

class LocalReflectionRepository(
    private val reflectionDao: ReflectionDao
) : ReflectionRepository {

    override fun observeTodayMoods(dateEpochDay: Long): Flow<List<MoodCheckIn>> =
        reflectionDao.observeMoodsForDate(dateEpochDay).map { list ->
            list.map {
                MoodCheckIn(
                    id = it.id,
                    dateEpochDay = it.dateEpochDay,
                    createdAtMillis = it.createdAtMillis,
                    mood = MoodLevel.fromLevel(it.moodLevel),
                    tags = it.tagsCsv.split(",").map { t -> t.trim() }.filter { t -> t.isNotEmpty() },
                    note = it.shortNote
                )
            }
        }

    override fun observeRecentMoods(limit: Int): Flow<List<MoodCheckIn>> =
        reflectionDao.observeRecentMoods(limit).map { list ->
            list.map {
                MoodCheckIn(
                    id = it.id,
                    dateEpochDay = it.dateEpochDay,
                    createdAtMillis = it.createdAtMillis,
                    mood = MoodLevel.fromLevel(it.moodLevel),
                    tags = it.tagsCsv.split(",").map { t -> t.trim() }.filter { t -> t.isNotEmpty() },
                    note = it.shortNote
                )
            }
        }

    override fun observeJournalEntries(query: String): Flow<List<JournalEntry>> {
        val source = if (query.isBlank()) {
            reflectionDao.observeAllJournalEntries()
        } else {
            reflectionDao.searchJournalEntries(query.trim())
        }
        return source.map { entries ->
            entries.map {
                JournalEntry(
                    id = it.id,
                    dateEpochDay = it.dateEpochDay,
                    createdAtMillis = it.createdAtMillis,
                    updatedAtMillis = it.updatedAtMillis,
                    title = it.title,
                    body = it.body,
                    mood = it.moodLevel?.let(MoodLevel::fromLevel),
                    isFavorite = it.isFavorite
                )
            }
        }
    }

    override fun observeAppreciationAnswers(): Flow<List<AppreciationAnswer>> =
        reflectionDao.observeAppreciationAnswers().map { list ->
            list.map {
                AppreciationAnswer(
                    id = it.id,
                    dateEpochDay = it.dateEpochDay,
                    promptId = it.promptId,
                    promptText = it.promptSnapshot,
                    answerText = it.answerText,
                    createdAtMillis = it.createdAtMillis
                )
            }
        }

    override fun observeAllAppreciationPrompts(): Flow<List<AppreciationPrompt>> =
        reflectionDao.observeAllPrompts().map { list ->
            list.map { AppreciationPrompt(it.id, it.promptText, it.category) }
        }

    override fun observeTodayAffirmation(
        dateEpochDay: Long,
        latestMood: MoodLevel?
    ): Flow<Affirmation?> = reflectionDao.observeAllAffirmations().map { all ->
        if (all.isEmpty()) return@map null
        val preferredCategory = when (latestMood) {
            MoodLevel.HEAVY, MoodLevel.LOW_TIDE -> "New beginnings"
            MoodLevel.STEADY -> "Consistency"
            MoodLevel.CALM -> "Positive thinking"
            MoodLevel.RADIANT -> "Gratitude"
            null -> null
        }
        val pool = preferredCategory?.let { cat ->
            all.filter { it.toneCategory == cat }.ifEmpty { all }
        } ?: all
        val index = (abs(dateEpochDay.toInt()) % pool.size)
        val picked = pool[index]
        Affirmation(picked.id, picked.text, picked.toneCategory, picked.isFavorite)
    }

    override fun observeAllAffirmations(): Flow<List<Affirmation>> =
        reflectionDao.observeAllAffirmations().map { list ->
            list.map { Affirmation(it.id, it.text, it.toneCategory, it.isFavorite) }
        }

    override fun observeFavoriteAffirmations(): Flow<List<Affirmation>> =
        reflectionDao.observeFavoriteAffirmations().map { list ->
            list.map { Affirmation(it.id, it.text, it.toneCategory, it.isFavorite) }
        }

    override suspend fun getTodayAppreciationPrompt(
        dateEpochDay: Long,
        forceSwap: Boolean
    ): AppResult<AppreciationPrompt> = try {
        val current = if (!forceSwap) reflectionDao.getPromptShownOnDate(dateEpochDay) else null
        val chosen = current ?: run {
            val ordered = reflectionDao.getAllPromptsOrdered()
            require(ordered.isNotEmpty()) { "No appreciation prompts available locally." }
            val candidate = if (forceSwap && ordered.size > 1) {
                ordered.firstOrNull { it.lastShownEpochDay != dateEpochDay } ?: ordered.first()
            } else {
                ordered.first()
            }
            reflectionDao.markPromptShown(candidate.id, dateEpochDay)
            candidate
        }
        AppResult.Success(AppreciationPrompt(chosen.id, chosen.promptText, chosen.category))
    } catch (e: Exception) {
        AppResult.Error("Unable to load today's appreciation question.", e)
    }

    override suspend fun saveMoodCheckIn(
        dateEpochDay: Long,
        mood: MoodLevel,
        tags: List<String>,
        note: String?
    ): AppResult<Long> = try {
        val id = reflectionDao.insertMoodCheckIn(
            MoodCheckInEntity(
                dateEpochDay = dateEpochDay,
                createdAtMillis = System.currentTimeMillis(),
                moodLevel = mood.level,
                tagsCsv = tags.joinToString(","),
                shortNote = note?.trim()?.takeIf { it.isNotEmpty() }
            )
        )
        AppResult.Success(id)
    } catch (e: Exception) {
        AppResult.Error("Could not save mood check-in.", e)
    }

    override suspend fun deleteMoodCheckIn(moodId: Long): AppResult<Unit> = try {
        reflectionDao.deleteMoodCheckIn(moodId)
        AppResult.Success(Unit)
    } catch (e: Exception) {
        AppResult.Error("Could not delete mood check-in.", e)
    }

    override suspend fun saveJournalEntry(
        entryId: Long?,
        dateEpochDay: Long,
        title: String,
        body: String,
        mood: MoodLevel?
    ): AppResult<Long> = try {
        val cleanBody = body.trim()
        require(cleanBody.isNotEmpty()) { "Write a few words before saving." }
        val now = System.currentTimeMillis()
        val id = reflectionDao.upsertJournalEntry(
            JournalEntryEntity(
                id = entryId ?: 0L,
                dateEpochDay = dateEpochDay,
                createdAtMillis = now,
                updatedAtMillis = now,
                title = title.trim().ifEmpty { "Daily Reflection" },
                body = cleanBody,
                moodLevel = mood?.level
            )
        )
        AppResult.Success(id)
    } catch (e: Exception) {
        AppResult.Error(e.message ?: "Could not save reflection.", e)
    }

    override suspend fun deleteJournalEntry(entryId: Long): AppResult<Unit> = try {
        reflectionDao.deleteJournalEntry(entryId)
        AppResult.Success(Unit)
    } catch (e: Exception) {
        AppResult.Error("Could not delete entry.", e)
    }

    override suspend fun saveAppreciationAnswer(
        dateEpochDay: Long,
        prompt: AppreciationPrompt,
        answerText: String
    ): AppResult<Long> = try {
        val clean = answerText.trim()
        require(clean.isNotEmpty()) { "Please write a brief appreciation note." }
        val id = reflectionDao.upsertAppreciationAnswer(
            AppreciationAnswerEntity(
                dateEpochDay = dateEpochDay,
                promptId = prompt.id,
                promptSnapshot = prompt.promptText,
                answerText = clean,
                createdAtMillis = System.currentTimeMillis()
            )
        )
        AppResult.Success(id)
    } catch (e: Exception) {
        AppResult.Error(e.message ?: "Could not save appreciation.", e)
    }

    override suspend fun deleteAppreciationAnswer(answerId: Long): AppResult<Unit> = try {
        reflectionDao.deleteAppreciationAnswer(answerId)
        AppResult.Success(Unit)
    } catch (e: Exception) {
        AppResult.Error("Could not delete appreciation entry.", e)
    }

    override suspend fun toggleAffirmationFavorite(
        affirmationId: String,
        isFavorite: Boolean
    ): AppResult<Unit> = try {
        reflectionDao.updateAffirmationFavorite(affirmationId, isFavorite)
        AppResult.Success(Unit)
    } catch (e: Exception) {
        AppResult.Error("Could not update favorite.", e)
    }
}

class LocalHabitChallengeRepository(
    private val dao: HabitChallengeDao
) : HabitChallengeRepository {

    override fun observeHabitsForDate(dateEpochDay: Long): Flow<List<HabitItem>> {
        val startEpoch = dateEpochDay - 6L
        return combine(
            dao.observeActiveHabits(),
            dao.observeHabitLogsBetween(startEpoch, dateEpochDay)
        ) { habits, logs ->
            val logsByHabit = logs.groupBy { it.habitId }
            habits.map { habit ->
                val hLogs = logsByHabit[habit.id].orEmpty()
                val todayLog = hLogs.firstOrNull { it.dateEpochDay == dateEpochDay }
                val recent7 = (0..6).map { offset ->
                    val day = startEpoch + offset
                    hLogs.any { it.dateEpochDay == day && it.isCompleted }
                }
                HabitItem(
                    id = habit.id,
                    title = habit.title,
                    description = habit.description,
                    timeOfDay = runCatching { HabitTimeOfDay.valueOf(habit.timeOfDay) }
                        .getOrDefault(HabitTimeOfDay.ANYTIME),
                    accentKey = habit.accentKey,
                    targetCountPerDay = habit.targetCountPerDay,
                    isPaused = habit.isPaused,
                    completedTodayCount = todayLog?.completedCount ?: 0,
                    isCompletedToday = todayLog?.isCompleted ?: false,
                    recentSevenDays = recent7
                )
            }
        }
    }

    override fun observeDailyChallenge(dateEpochDay: Long): Flow<DailyChallengeState?> =
        dao.observeDailyChallengeLog(dateEpochDay).map { log ->
            val activeLog = log ?: return@map null
            val challenge = dao.getChallengeById(activeLog.challengeId) ?: return@map null
            DailyChallengeState(
                dateEpochDay = activeLog.dateEpochDay,
                challenge = SelfCareChallenge(
                    id = challenge.id,
                    title = challenge.title,
                    description = challenge.description,
                    category = challenge.category,
                    durationMinutes = challenge.durationMinutes
                ),
                status = runCatching { ChallengeStatus.valueOf(activeLog.status) }
                    .getOrDefault(ChallengeStatus.ASSIGNED),
                swapsUsed = activeLog.swapsUsed
            )
        }

    override suspend fun ensureDailyChallengeAssigned(dateEpochDay: Long): AppResult<Unit> = try {
        if (dao.getDailyChallengeLog(dateEpochDay) == null) {
            val all = dao.getAllChallenges()
            if (all.isNotEmpty()) {
                val chosen = all[abs(dateEpochDay.toInt()) % all.size]
                dao.upsertDailyChallengeLog(
                    DailyChallengeLogEntity(
                        dateEpochDay = dateEpochDay,
                        challengeId = chosen.id,
                        status = ChallengeStatus.ASSIGNED.name,
                        swapsUsed = 0
                    )
                )
            }
        }
        AppResult.Success(Unit)
    } catch (e: Exception) {
        AppResult.Error("Could not prepare today's challenge.", e)
    }

    override suspend fun completeDailyChallenge(dateEpochDay: Long): AppResult<Unit> = try {
        val current = dao.getDailyChallengeLog(dateEpochDay)
            ?: return AppResult.Error("No challenge assigned for today.")
        dao.upsertDailyChallengeLog(
            current.copy(
                status = ChallengeStatus.COMPLETED.name,
                completedAtMillis = System.currentTimeMillis()
            )
        )
        AppResult.Success(Unit)
    } catch (e: Exception) {
        AppResult.Error("Could not complete challenge.", e)
    }

    override suspend fun swapDailyChallenge(
        dateEpochDay: Long,
        allowExtraSwap: Boolean
    ): AppResult<Unit> = try {
        val current = dao.getDailyChallengeLog(dateEpochDay)
            ?: return AppResult.Error("No challenge assigned yet.")
        if (current.swapsUsed >= 1 && !allowExtraSwap) {
            return AppResult.Error("Your free gentle swap for today has been used.")
        }
        val all = dao.getAllChallenges()
        val next = all.firstOrNull { it.id != current.challengeId } ?: all.first()
        val rotated = all[(all.indexOfFirst { it.id == current.challengeId } + 1).coerceAtLeast(0) % all.size]
        dao.upsertDailyChallengeLog(
            current.copy(
                challengeId = rotated.id.ifEmpty { next.id },
                status = ChallengeStatus.ASSIGNED.name,
                swapsUsed = current.swapsUsed + 1,
                completedAtMillis = null
            )
        )
        AppResult.Success(Unit)
    } catch (e: Exception) {
        AppResult.Error("Could not swap today's challenge.", e)
    }

    override suspend fun skipDailyChallenge(dateEpochDay: Long): AppResult<Unit> = try {
        val current = dao.getDailyChallengeLog(dateEpochDay)
            ?: return AppResult.Error("No challenge assigned yet.")
        dao.upsertDailyChallengeLog(current.copy(status = ChallengeStatus.SKIPPED.name))
        AppResult.Success(Unit)
    } catch (e: Exception) {
        AppResult.Error("Could not skip challenge.", e)
    }

    override suspend fun createHabit(
        title: String,
        description: String,
        timeOfDay: HabitTimeOfDay,
        accentKey: String,
        targetCountPerDay: Int
    ): AppResult<Long> = try {
        val cleanTitle = title.trim()
        require(cleanTitle.isNotEmpty()) { "Habit name cannot be empty." }
        val sort = dao.activeHabitCount()
        val id = dao.insertHabit(
            HabitEntity(
                title = cleanTitle,
                description = description.trim(),
                timeOfDay = timeOfDay.name,
                accentKey = accentKey,
                targetCountPerDay = targetCountPerDay.coerceIn(1, 10),
                createdAtMillis = System.currentTimeMillis(),
                sortOrder = sort
            )
        )
        AppResult.Success(id)
    } catch (e: Exception) {
        AppResult.Error(e.message ?: "Could not create habit.", e)
    }

    override suspend fun updateHabit(
        habitId: Long,
        title: String,
        description: String,
        timeOfDay: HabitTimeOfDay
    ): AppResult<Unit> = try {
        val cleanTitle = title.trim()
        require(cleanTitle.isNotEmpty()) { "Habit name cannot be empty." }
        dao.updateHabitDetails(habitId, cleanTitle, description.trim(), timeOfDay.name)
        AppResult.Success(Unit)
    } catch (e: Exception) {
        AppResult.Error(e.message ?: "Could not update habit.", e)
    }

    override suspend fun toggleHabitCompletion(
        habitId: Long,
        dateEpochDay: Long
    ): AppResult<Boolean> = try {
        val existing = dao.getHabitLog(habitId, dateEpochDay)
        val nowCompleted = !(existing?.isCompleted ?: false)
        dao.upsertHabitLog(
            HabitLogEntity(
                id = existing?.id ?: 0L,
                habitId = habitId,
                dateEpochDay = dateEpochDay,
                completedCount = if (nowCompleted) 1 else 0,
                isCompleted = nowCompleted,
                completedAtMillis = System.currentTimeMillis()
            )
        )
        AppResult.Success(nowCompleted)
    } catch (e: Exception) {
        AppResult.Error("Could not update habit.", e)
    }

    override suspend fun toggleHabitPause(habitId: Long, isPaused: Boolean): AppResult<Unit> = try {
        dao.updateHabitPause(habitId, isPaused)
        AppResult.Success(Unit)
    } catch (e: Exception) {
        AppResult.Error("Could not update pause state.", e)
    }

    override suspend fun archiveHabit(habitId: Long): AppResult<Unit> = try {
        dao.archiveHabit(habitId)
        AppResult.Success(Unit)
    } catch (e: Exception) {
        AppResult.Error("Could not archive habit.", e)
    }
}

class LocalProgressRepository(
    private val hydrationDao: HydrationDao,
    private val reflectionDao: ReflectionDao,
    private val habitChallengeDao: HabitChallengeDao,
    private val progressBadgeDao: ProgressBadgeDao,
    private val settingsRepository: SettingsRepository
) : ProgressRepository {

    override fun observeProgressOverview(todayEpochDay: Long): Flow<ProgressOverview> {
        val start21 = todayEpochDay - 20L
        val start7 = todayEpochDay - 6L
        return combine(
            hydrationDao.observeLogsBetween(start21, todayEpochDay),
            hydrationDao.observeDailyGoalsBetween(start7, todayEpochDay),
            habitChallengeDao.observeHabitLogsBetween(start21, todayEpochDay),
            reflectionDao.observeMoodsBetween(start21, todayEpochDay),
            progressBadgeDao.observeAllBadges(),
            progressBadgeDao.observeWeeklySummaries(),
            settingsRepository.settingsFlow
        ) { flows ->
            @Suppress("UNCHECKED_CAST")
            val waterLogs = flows[0] as List<WaterLogEntity>
            @Suppress("UNCHECKED_CAST")
            val dailyGoals = flows[1] as List<DailyGoalEntity>
            @Suppress("UNCHECKED_CAST")
            val habitLogs = flows[2] as List<HabitLogEntity>
            @Suppress("UNCHECKED_CAST")
            val moods = flows[3] as List<MoodCheckInEntity>
            @Suppress("UNCHECKED_CAST")
            val badges = flows[4] as List<com.violetdolphinstudio.dailytide.data.local.db.entity.BadgeEntity>
            @Suppress("UNCHECKED_CAST")
            val summaries = flows[5] as List<WeeklySummaryEntity>
            val settings = flows[6] as com.violetdolphinstudio.dailytide.domain.model.UserSettings

            val activeDays = buildSet {
                waterLogs.forEach { add(it.dateEpochDay) }
                habitLogs.filter { it.isCompleted }.forEach { add(it.dateEpochDay) }
                moods.forEach { add(it.dateEpochDay) }
            }
            val consistencyPercent = ((activeDays.size.toFloat() / 21f) * 100f)
                .roundToInt()
                .coerceIn(0, 100)

            val last7 = (0..6).map { offset ->
                val day = start7 + offset
                val dayWater = waterLogs.filter { it.dateEpochDay == day }.sumOf { it.amountMl }
                val dayGoal = dailyGoals.firstOrNull { it.dateEpochDay == day }?.waterGoalMl
                    ?: settings.dailyWaterGoalMl
                val dayHabits = habitLogs.count { it.dateEpochDay == day && it.isCompleted }
                val dayMood = moods.filter { it.dateEpochDay == day }
                    .maxByOrNull { it.createdAtMillis }
                    ?.let { MoodLevel.fromLevel(it.moodLevel) }
                DailyActivityPoint(day, dayWater, dayGoal, dayHabits, dayMood)
            }

            ProgressOverview(
                consistencyScorePercent = consistencyPercent,
                activeDaysLast21 = activeDays.size,
                totalWaterLogsCount = waterLogs.size,
                last7Days = last7,
                badges = badges.map {
                    AchievementBadge(
                        id = it.id,
                        title = it.title,
                        description = it.description,
                        category = it.category,
                        unlockedAtMillis = it.unlockedAtMillis,
                        progressCurrent = it.progressCurrent,
                        progressTarget = it.progressTarget
                    )
                },
                latestWeeklySummary = summaries.firstOrNull()?.toDomain()
            )
        }
    }

    override fun observeBadges(): Flow<List<AchievementBadge>> =
        progressBadgeDao.observeAllBadges().map { list ->
            list.map {
                AchievementBadge(
                    id = it.id,
                    title = it.title,
                    description = it.description,
                    category = it.category,
                    unlockedAtMillis = it.unlockedAtMillis,
                    progressCurrent = it.progressCurrent,
                    progressTarget = it.progressTarget
                )
            }
        }

    override fun observeWeeklySummaries(): Flow<List<WeeklySummary>> =
        progressBadgeDao.observeWeeklySummaries().map { list -> list.map { it.toDomain() } }

    override suspend fun evaluateAndUnlockBadges(
        todayEpochDay: Long
    ): AppResult<List<AchievementBadge>> = try {
        val waterCount = hydrationDao.totalWaterLogsCount()
        val moodCount = reflectionDao.totalMoodCount()
        val appreciationCount = reflectionDao.totalAppreciationCount()
        val journalCount = reflectionDao.totalJournalCount()
        val habitCount = habitChallengeDao.totalCompletedHabitLogs()
        val challengeCount = habitChallengeDao.totalChallengesCompleted()

        val activeWindowLogs = hydrationDao.observeLogsBetween(todayEpochDay - 30L, todayEpochDay).first()
        val distinctDays = activeWindowLogs.map { it.dateEpochDay }.distinct().size

        val progressMap = mapOf(
            "first_ripple" to waterCount,
            "calm_hydration" to waterCount,
            "inner_compass" to moodCount,
            "appreciation_keeper" to appreciationCount,
            "quiet_pages" to journalCount,
            "little_habits" to habitCount,
            "tide_explorer" to challengeCount,
            "gentle_return" to distinctDays
        )

        val now = System.currentTimeMillis()
        val newlyUnlocked = mutableListOf<AchievementBadge>()
        progressBadgeDao.getAllBadgesSnapshot().forEach { badge ->
            val current = (progressMap[badge.id] ?: badge.progressCurrent).coerceAtMost(badge.progressTarget)
            val shouldUnlock = badge.unlockedAtMillis == null && current >= badge.progressTarget
            if (current != badge.progressCurrent || shouldUnlock) {
                val updated = badge.copy(
                    progressCurrent = current,
                    unlockedAtMillis = if (shouldUnlock) now else badge.unlockedAtMillis
                )
                progressBadgeDao.updateBadge(updated)
                if (shouldUnlock) {
                    newlyUnlocked += AchievementBadge(
                        id = updated.id,
                        title = updated.title,
                        description = updated.description,
                        category = updated.category,
                        unlockedAtMillis = updated.unlockedAtMillis,
                        progressCurrent = updated.progressCurrent,
                        progressTarget = updated.progressTarget
                    )
                }
            }
        }
        AppResult.Success(newlyUnlocked)
    } catch (e: Exception) {
        AppResult.Error("Unable to evaluate badges locally.", e)
    }

    override suspend fun generateWeeklySummary(todayEpochDay: Long): AppResult<WeeklySummary> = try {
        val weekStart = todayEpochDay - 6L
        val settings = settingsRepository.settingsFlow.first()
        val waterLogs = hydrationDao.observeLogsBetween(weekStart, todayEpochDay).first()
        val habits = habitChallengeDao.observeActiveHabits().first()
        val habitLogs = habitChallengeDao.observeHabitLogsBetween(weekStart, todayEpochDay).first()
        val moods = reflectionDao.observeMoodsBetween(weekStart, todayEpochDay).first()
        val challengesDone = habitChallengeDao.completedChallengesBetween(weekStart, todayEpochDay)
        val highlight = reflectionDao.getHighlightAppreciationBetween(weekStart, todayEpochDay)

        val totalWater = waterLogs.sumOf { it.amountMl }
        val waterByDay = waterLogs.groupBy { it.dateEpochDay }.mapValues { it.value.sumOf { l -> l.amountMl } }
        val goalDaysMet = waterByDay.count { it.value >= settings.dailyWaterGoalMl }

        val completedHabitLogs = habitLogs.filter { it.isCompleted }
        val possibleSlots = (habits.count { !it.isPaused } * 7).coerceAtLeast(1)
        val completionRate = (completedHabitLogs.size.toFloat() / possibleSlots.toFloat()).coerceIn(0f, 1f)

        val topHabitId = completedHabitLogs.groupingBy { it.habitId }.eachCount().maxByOrNull { it.value }?.key
        val topHabitTitle = habits.firstOrNull { it.id == topHabitId }?.title

        val dominantMoodLevel = moods.groupingBy { it.moodLevel }.eachCount().maxByOrNull { it.value }?.key
        val insight = when {
            goalDaysMet >= 5 -> "A wonderfully steady hydration rhythm this week. Your small sips added up quietly."
            completedHabitLogs.isNotEmpty() -> "You showed up with care across the week—every small check-in counts."
            else -> "A gentle week of rest and reset. Ready whenever you want to begin a fresh tide."
        }

        val entity = WeeklySummaryEntity(
            weekStartEpochDay = weekStart,
            weekEndEpochDay = todayEpochDay,
            totalWaterMl = totalWater,
            hydrationGoalDaysMet = goalDaysMet,
            habitCompletionRate = completionRate,
            topHabitTitle = topHabitTitle,
            dominantMoodLevel = dominantMoodLevel,
            challengesCompleted = challengesDone,
            highlightAppreciation = highlight?.answerText,
            insightMessage = insight,
            generatedAtMillis = System.currentTimeMillis()
        )
        progressBadgeDao.upsertWeeklySummary(entity)
        AppResult.Success(entity.toDomain())
    } catch (e: Exception) {
        AppResult.Error("Unable to compile weekly summary.", e)
    }

    private fun WeeklySummaryEntity.toDomain(): WeeklySummary = WeeklySummary(
        weekStartEpochDay = weekStartEpochDay,
        weekEndEpochDay = weekEndEpochDay,
        totalWaterMl = totalWaterMl,
        hydrationGoalDaysMet = hydrationGoalDaysMet,
        habitCompletionRate = habitCompletionRate,
        topHabitTitle = topHabitTitle,
        dominantMood = dominantMoodLevel?.let(MoodLevel::fromLevel),
        challengesCompleted = challengesCompleted,
        highlightAppreciation = highlightAppreciation,
        insightMessage = insightMessage,
        generatedAtMillis = generatedAtMillis
    )

    private data class ActivitySnapshot(
        val waterLogs: List<WaterLogEntity>,
        val dailyGoals: List<DailyGoalEntity>,
        val habitLogs: List<HabitLogEntity>,
        val moods: List<MoodCheckInEntity>
    )
}

package com.violetdolphinstudio.dailytide.data.local.db.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.violetdolphinstudio.dailytide.data.local.db.entity.AffirmationEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.AppreciationAnswerEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.AppreciationPromptEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.BadgeEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.DailyChallengeLogEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.DailyGoalEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.HabitEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.HabitLogEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.JournalEntryEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.MoodCheckInEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.SelfCareChallengeEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.WaterLogEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.WaterVesselEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.WeeklySummaryEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface HydrationDao {
    @Query("SELECT * FROM water_vessels WHERE isArchived = 0 ORDER BY sortOrder ASC, id ASC")
    fun observeActiveVessels(): Flow<List<WaterVesselEntity>>

    @Query("SELECT * FROM water_vessels WHERE isArchived = 0 AND isDefault = 1 LIMIT 1")
    suspend fun getDefaultVessel(): WaterVesselEntity?

    @Query("SELECT COUNT(*) FROM water_vessels")
    suspend fun vesselCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVessels(vessels: List<WaterVesselEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVessel(vessel: WaterVesselEntity): Long

    @Query("UPDATE water_vessels SET isArchived = 1 WHERE id = :vesselId")
    suspend fun archiveVessel(vesselId: Long)

    @Query("SELECT * FROM water_logs WHERE dateEpochDay = :dateEpochDay ORDER BY loggedAtMillis DESC")
    fun observeLogsForDate(dateEpochDay: Long): Flow<List<WaterLogEntity>>

    @Query("SELECT * FROM water_logs WHERE dateEpochDay BETWEEN :startEpochDay AND :endEpochDay")
    fun observeLogsBetween(startEpochDay: Long, endEpochDay: Long): Flow<List<WaterLogEntity>>

    @Query("SELECT COALESCE(SUM(amountMl), 0) FROM water_logs WHERE dateEpochDay = :dateEpochDay")
    suspend fun getTotalWaterForDate(dateEpochDay: Long): Int

    @Query("SELECT MAX(loggedAtMillis) FROM water_logs WHERE dateEpochDay = :dateEpochDay")
    suspend fun getLastLoggedTimestamp(dateEpochDay: Long): Long?

    @Query("SELECT COUNT(*) FROM water_logs")
    suspend fun totalWaterLogsCount(): Int

    @Insert
    suspend fun insertWaterLog(log: WaterLogEntity): Long

    @Query("DELETE FROM water_logs WHERE id = :logId")
    suspend fun deleteWaterLog(logId: Long)

    @Query("SELECT * FROM daily_goals WHERE dateEpochDay = :dateEpochDay LIMIT 1")
    fun observeDailyGoal(dateEpochDay: Long): Flow<DailyGoalEntity?>

    @Query("SELECT * FROM daily_goals WHERE dateEpochDay BETWEEN :startEpochDay AND :endEpochDay")
    fun observeDailyGoalsBetween(startEpochDay: Long, endEpochDay: Long): Flow<List<DailyGoalEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertDailyGoal(goal: DailyGoalEntity)

    @Query("SELECT * FROM water_vessels ORDER BY sortOrder ASC, id ASC")
    suspend fun getAllVesselsSnapshot(): List<WaterVesselEntity>

    @Query("SELECT * FROM water_logs ORDER BY loggedAtMillis DESC")
    suspend fun getAllWaterLogsSnapshot(): List<WaterLogEntity>
}

@Dao
interface ReflectionDao {
    @Query("SELECT * FROM mood_checkins WHERE dateEpochDay = :dateEpochDay ORDER BY createdAtMillis DESC")
    fun observeMoodsForDate(dateEpochDay: Long): Flow<List<MoodCheckInEntity>>

    @Query("SELECT * FROM mood_checkins WHERE dateEpochDay BETWEEN :startEpochDay AND :endEpochDay")
    fun observeMoodsBetween(startEpochDay: Long, endEpochDay: Long): Flow<List<MoodCheckInEntity>>

    @Query("SELECT * FROM mood_checkins ORDER BY createdAtMillis DESC LIMIT :limit")
    fun observeRecentMoods(limit: Int = 30): Flow<List<MoodCheckInEntity>>

    @Query("SELECT COUNT(*) FROM mood_checkins")
    suspend fun totalMoodCount(): Int

    @Insert
    suspend fun insertMoodCheckIn(entity: MoodCheckInEntity): Long

    @Query("DELETE FROM mood_checkins WHERE id = :moodId")
    suspend fun deleteMoodCheckIn(moodId: Long)

    @Query("SELECT * FROM journal_entries ORDER BY updatedAtMillis DESC")
    fun observeAllJournalEntries(): Flow<List<JournalEntryEntity>>

    @Query(
        "SELECT * FROM journal_entries WHERE title LIKE '%' || :query || '%' OR body LIKE '%' || :query || '%' ORDER BY updatedAtMillis DESC"
    )
    fun searchJournalEntries(query: String): Flow<List<JournalEntryEntity>>

    @Query("SELECT COUNT(*) FROM journal_entries")
    suspend fun totalJournalCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertJournalEntry(entry: JournalEntryEntity): Long

    @Query("DELETE FROM journal_entries WHERE id = :entryId")
    suspend fun deleteJournalEntry(entryId: Long)

    @Query("SELECT * FROM appreciation_prompts ORDER BY COALESCE(lastShownEpochDay, 0) ASC, id ASC")
    suspend fun getAllPromptsOrdered(): List<AppreciationPromptEntity>

    @Query("SELECT * FROM appreciation_prompts ORDER BY id ASC")
    fun observeAllPrompts(): Flow<List<AppreciationPromptEntity>>

    @Query("SELECT * FROM appreciation_prompts WHERE lastShownEpochDay = :dateEpochDay LIMIT 1")
    suspend fun getPromptShownOnDate(dateEpochDay: Long): AppreciationPromptEntity?

    @Query("UPDATE appreciation_prompts SET lastShownEpochDay = :dateEpochDay WHERE id = :promptId")
    suspend fun markPromptShown(promptId: String, dateEpochDay: Long)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertPrompts(prompts: List<AppreciationPromptEntity>)

    @Query("SELECT * FROM appreciation_answers ORDER BY createdAtMillis DESC")
    fun observeAppreciationAnswers(): Flow<List<AppreciationAnswerEntity>>

    @Query("SELECT * FROM appreciation_answers WHERE dateEpochDay BETWEEN :startEpochDay AND :endEpochDay ORDER BY createdAtMillis DESC LIMIT 1")
    suspend fun getHighlightAppreciationBetween(startEpochDay: Long, endEpochDay: Long): AppreciationAnswerEntity?

    @Query("SELECT COUNT(*) FROM appreciation_answers")
    suspend fun totalAppreciationCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAppreciationAnswer(answer: AppreciationAnswerEntity): Long

    @Query("DELETE FROM appreciation_answers WHERE id = :answerId")
    suspend fun deleteAppreciationAnswer(answerId: Long)

    @Query("SELECT * FROM affirmations ORDER BY id ASC")
    fun observeAllAffirmations(): Flow<List<AffirmationEntity>>

    @Query("SELECT * FROM affirmations WHERE isFavorite = 1 ORDER BY id ASC")
    fun observeFavoriteAffirmations(): Flow<List<AffirmationEntity>>

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAffirmations(affirmations: List<AffirmationEntity>)

    @Query("UPDATE affirmations SET isFavorite = :isFavorite WHERE id = :id")
    suspend fun updateAffirmationFavorite(id: String, isFavorite: Boolean)

    @Query("SELECT * FROM mood_checkins ORDER BY createdAtMillis DESC")
    suspend fun getAllMoodsSnapshot(): List<MoodCheckInEntity>

    @Query("SELECT * FROM journal_entries ORDER BY updatedAtMillis DESC")
    suspend fun getAllJournalEntriesSnapshot(): List<JournalEntryEntity>

    @Query("SELECT * FROM appreciation_answers ORDER BY createdAtMillis DESC")
    suspend fun getAllAppreciationAnswersSnapshot(): List<AppreciationAnswerEntity>

    @Query("SELECT id FROM affirmations WHERE isFavorite = 1")
    suspend fun getFavoriteAffirmationIdsSnapshot(): List<String>
}

@Dao
interface HabitChallengeDao {
    @Query("SELECT * FROM habits WHERE isArchived = 0 ORDER BY sortOrder ASC, id ASC")
    fun observeActiveHabits(): Flow<List<HabitEntity>>

    @Query("SELECT COUNT(*) FROM habits WHERE isArchived = 0")
    suspend fun activeHabitCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHabit(habit: HabitEntity): Long

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertHabits(habits: List<HabitEntity>)

    @Query("UPDATE habits SET title = :title, description = :description, timeOfDay = :timeOfDay WHERE id = :habitId")
    suspend fun updateHabitDetails(habitId: Long, title: String, description: String, timeOfDay: String)

    @Query("UPDATE habits SET isPaused = :isPaused WHERE id = :habitId")
    suspend fun updateHabitPause(habitId: Long, isPaused: Boolean)

    @Query("UPDATE habits SET isArchived = 1 WHERE id = :habitId")
    suspend fun archiveHabit(habitId: Long)

    @Query("SELECT * FROM habit_logs WHERE dateEpochDay BETWEEN :startEpochDay AND :endEpochDay")
    fun observeHabitLogsBetween(startEpochDay: Long, endEpochDay: Long): Flow<List<HabitLogEntity>>

    @Query("SELECT * FROM habit_logs WHERE habitId = :habitId AND dateEpochDay = :dateEpochDay LIMIT 1")
    suspend fun getHabitLog(habitId: Long, dateEpochDay: Long): HabitLogEntity?

    @Query("SELECT COUNT(*) FROM habit_logs WHERE isCompleted = 1")
    suspend fun totalCompletedHabitLogs(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertHabitLog(log: HabitLogEntity): Long

    @Query("SELECT * FROM challenges_catalog ORDER BY id ASC")
    suspend fun getAllChallenges(): List<SelfCareChallengeEntity>

    @Query("SELECT * FROM challenges_catalog WHERE id = :challengeId LIMIT 1")
    suspend fun getChallengeById(challengeId: String): SelfCareChallengeEntity?

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertChallenges(challenges: List<SelfCareChallengeEntity>)

    @Query("SELECT * FROM daily_challenge_logs WHERE dateEpochDay = :dateEpochDay LIMIT 1")
    fun observeDailyChallengeLog(dateEpochDay: Long): Flow<DailyChallengeLogEntity?>

    @Query("SELECT * FROM daily_challenge_logs WHERE dateEpochDay = :dateEpochDay LIMIT 1")
    suspend fun getDailyChallengeLog(dateEpochDay: Long): DailyChallengeLogEntity?

    @Query("SELECT COUNT(*) FROM daily_challenge_logs WHERE status = 'COMPLETED'")
    suspend fun totalChallengesCompleted(): Int

    @Query("SELECT COUNT(*) FROM daily_challenge_logs WHERE status = 'COMPLETED' AND dateEpochDay BETWEEN :startEpochDay AND :endEpochDay")
    suspend fun completedChallengesBetween(startEpochDay: Long, endEpochDay: Long): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertDailyChallengeLog(log: DailyChallengeLogEntity)

    @Query("SELECT * FROM habits ORDER BY sortOrder ASC, id ASC")
    suspend fun getAllHabitsSnapshot(): List<HabitEntity>

    @Query("SELECT * FROM habit_logs ORDER BY dateEpochDay DESC")
    suspend fun getAllHabitLogsSnapshot(): List<HabitLogEntity>

    @Query("SELECT * FROM daily_challenge_logs ORDER BY dateEpochDay DESC")
    suspend fun getAllChallengeLogsSnapshot(): List<DailyChallengeLogEntity>
}

@Dao
interface ProgressBadgeDao {
    @Query("SELECT * FROM badges ORDER BY unlockedAtMillis IS NULL ASC, id ASC")
    fun observeAllBadges(): Flow<List<BadgeEntity>>

    @Query("SELECT * FROM badges")
    suspend fun getAllBadgesSnapshot(): List<BadgeEntity>

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertBadges(badges: List<BadgeEntity>)

    @Update
    suspend fun updateBadge(badge: BadgeEntity)

    @Query("SELECT * FROM weekly_summaries ORDER BY weekStartEpochDay DESC")
    fun observeWeeklySummaries(): Flow<List<WeeklySummaryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertWeeklySummary(summary: WeeklySummaryEntity)
}

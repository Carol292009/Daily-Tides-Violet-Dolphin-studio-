package com.violetdolphinstudio.dailytide.data.local.db.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "water_vessels",
    indices = [Index(value = ["sortOrder"])]
)
data class WaterVesselEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val volumeMl: Int,
    val iconKey: String,
    val sortOrder: Int,
    val isDefault: Boolean = false,
    val isArchived: Boolean = false
)

@Entity(
    tableName = "water_logs",
    foreignKeys = [
        ForeignKey(
            entity = WaterVesselEntity::class,
            parentColumns = ["id"],
            childColumns = ["vesselId"],
            onDelete = ForeignKey.SET_NULL
        )
    ],
    indices = [Index(value = ["dateEpochDay"]), Index(value = ["vesselId"])]
)
data class WaterLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val dateEpochDay: Long,
    val loggedAtMillis: Long,
    val amountMl: Int,
    val vesselId: Long?,
    val vesselNameSnapshot: String
)

@Entity(tableName = "daily_goals")
data class DailyGoalEntity(
    @PrimaryKey val dateEpochDay: Long,
    val waterGoalMl: Int,
    val isRestDay: Boolean = false
)

@Entity(
    tableName = "mood_checkins",
    indices = [Index(value = ["dateEpochDay"])]
)
data class MoodCheckInEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val dateEpochDay: Long,
    val createdAtMillis: Long,
    val moodLevel: Int,
    val tagsCsv: String,
    val shortNote: String?
)

@Entity(
    tableName = "journal_entries",
    indices = [Index(value = ["dateEpochDay"])]
)
data class JournalEntryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val dateEpochDay: Long,
    val createdAtMillis: Long,
    val updatedAtMillis: Long,
    val title: String,
    val body: String,
    val moodLevel: Int?,
    val isFavorite: Boolean = false
)

@Entity(tableName = "appreciation_prompts")
data class AppreciationPromptEntity(
    @PrimaryKey val id: String,
    val promptText: String,
    val category: String,
    val lastShownEpochDay: Long? = null
)

@Entity(
    tableName = "appreciation_answers",
    indices = [Index(value = ["dateEpochDay", "promptId"], unique = true)]
)
data class AppreciationAnswerEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val dateEpochDay: Long,
    val promptId: String,
    val promptSnapshot: String,
    val answerText: String,
    val createdAtMillis: Long
)

@Entity(tableName = "affirmations")
data class AffirmationEntity(
    @PrimaryKey val id: String,
    val text: String,
    val toneCategory: String,
    val isFavorite: Boolean = false
)

@Entity(tableName = "challenges_catalog")
data class SelfCareChallengeEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String,
    val category: String,
    val durationMinutes: Int
)

@Entity(
    tableName = "daily_challenge_logs",
    foreignKeys = [
        ForeignKey(
            entity = SelfCareChallengeEntity::class,
            parentColumns = ["id"],
            childColumns = ["challengeId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["challengeId"])]
)
data class DailyChallengeLogEntity(
    @PrimaryKey val dateEpochDay: Long,
    val challengeId: String,
    val status: String,
    val swapsUsed: Int = 0,
    val completedAtMillis: Long? = null
)

@Entity(
    tableName = "habits",
    indices = [Index(value = ["isArchived", "sortOrder"])]
)
data class HabitEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val description: String,
    val timeOfDay: String,
    val accentKey: String,
    val targetCountPerDay: Int = 1,
    val createdAtMillis: Long,
    val isPaused: Boolean = false,
    val isArchived: Boolean = false,
    val sortOrder: Int = 0
)

@Entity(
    tableName = "habit_logs",
    foreignKeys = [
        ForeignKey(
            entity = HabitEntity::class,
            parentColumns = ["id"],
            childColumns = ["habitId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["habitId", "dateEpochDay"], unique = true), Index(value = ["dateEpochDay"])]
)
data class HabitLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val habitId: Long,
    val dateEpochDay: Long,
    val completedCount: Int,
    val isCompleted: Boolean,
    val completedAtMillis: Long
)

@Entity(tableName = "badges")
data class BadgeEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String,
    val category: String,
    val unlockedAtMillis: Long? = null,
    val progressCurrent: Int = 0,
    val progressTarget: Int = 1
)

@Entity(tableName = "weekly_summaries")
data class WeeklySummaryEntity(
    @PrimaryKey val weekStartEpochDay: Long,
    val weekEndEpochDay: Long,
    val totalWaterMl: Int,
    val hydrationGoalDaysMet: Int,
    val habitCompletionRate: Float,
    val topHabitTitle: String?,
    val dominantMoodLevel: Int?,
    val challengesCompleted: Int,
    val highlightAppreciation: String?,
    val insightMessage: String,
    val generatedAtMillis: Long
)

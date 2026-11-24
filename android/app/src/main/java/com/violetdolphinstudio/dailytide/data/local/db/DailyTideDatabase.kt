package com.violetdolphinstudio.dailytide.data.local.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.violetdolphinstudio.dailytide.data.local.db.dao.HabitChallengeDao
import com.violetdolphinstudio.dailytide.data.local.db.dao.HydrationDao
import com.violetdolphinstudio.dailytide.data.local.db.dao.ProgressBadgeDao
import com.violetdolphinstudio.dailytide.data.local.db.dao.ReflectionDao
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

@Database(
    entities = [
        WaterVesselEntity::class,
        WaterLogEntity::class,
        DailyGoalEntity::class,
        MoodCheckInEntity::class,
        JournalEntryEntity::class,
        AppreciationPromptEntity::class,
        AppreciationAnswerEntity::class,
        AffirmationEntity::class,
        SelfCareChallengeEntity::class,
        DailyChallengeLogEntity::class,
        HabitEntity::class,
        HabitLogEntity::class,
        BadgeEntity::class,
        WeeklySummaryEntity::class
    ],
    version = 1,
    exportSchema = true
)
abstract class DailyTideDatabase : RoomDatabase() {
    abstract fun hydrationDao(): HydrationDao
    abstract fun reflectionDao(): ReflectionDao
    abstract fun habitChallengeDao(): HabitChallengeDao
    abstract fun progressBadgeDao(): ProgressBadgeDao

    companion object {
        private const val DATABASE_NAME = "daily_tide_local.db"

        @Volatile
        private var instance: DailyTideDatabase? = null

        fun getInstance(context: Context): DailyTideDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    DailyTideDatabase::class.java,
                    DATABASE_NAME
                )
                    .fallbackToDestructiveMigrationOnDowngrade()
                    .build()
                    .also { instance = it }
            }
    }
}

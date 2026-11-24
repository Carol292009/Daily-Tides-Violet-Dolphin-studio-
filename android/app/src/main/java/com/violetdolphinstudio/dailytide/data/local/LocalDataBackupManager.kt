package com.violetdolphinstudio.dailytide.data.local

import androidx.room.withTransaction
import com.violetdolphinstudio.dailytide.data.local.db.DailyTideDatabase
import com.violetdolphinstudio.dailytide.data.local.db.entity.AppreciationAnswerEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.DailyChallengeLogEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.HabitEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.HabitLogEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.JournalEntryEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.MoodCheckInEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.WaterLogEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.WaterVesselEntity
import com.violetdolphinstudio.dailytide.data.local.db.seeder.OfflineContentSeeder
import com.violetdolphinstudio.dailytide.domain.model.AppResult
import com.violetdolphinstudio.dailytide.domain.model.LocalDateUtil
import com.violetdolphinstudio.dailytide.domain.model.MeasurementUnit
import com.violetdolphinstudio.dailytide.domain.model.ReminderFrequency
import com.violetdolphinstudio.dailytide.domain.model.ReminderMode
import com.violetdolphinstudio.dailytide.domain.model.ThemeMode
import com.violetdolphinstudio.dailytide.domain.model.UserSettings
import com.violetdolphinstudio.dailytide.domain.repository.SettingsRepository
import com.violetdolphinstudio.dailytide.notifications.ReminderScheduler
import com.violetdolphinstudio.dailytide.rewards.RewardAccessManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

/**
 * 100% Offline-First Local Data Manager for Daily Tide.
 * Handles JSON backup export, validated JSON backup import, and complete application data wipe
 * strictly using Android's built-in org.json APIs and local Room/DataStore storage — zero network calls.
 */
class LocalDataBackupManager(
    private val database: DailyTideDatabase,
    private val settingsRepository: SettingsRepository,
    private val reminderScheduler: ReminderScheduler,
    private val rewardAccessManager: RewardAccessManager? = null
) {
    suspend fun exportAllToJson(): AppResult<String> = withContext(Dispatchers.IO) {
        try {
            val settings = settingsRepository.settingsFlow.first()
            val vessels = database.hydrationDao().getAllVesselsSnapshot()
            val waterLogs = database.hydrationDao().getAllWaterLogsSnapshot()
            val moods = database.reflectionDao().getAllMoodsSnapshot()
            val journals = database.reflectionDao().getAllJournalEntriesSnapshot()
            val appreciations = database.reflectionDao().getAllAppreciationAnswersSnapshot()
            val favoriteAffirmations = database.reflectionDao().getFavoriteAffirmationIdsSnapshot()
            val habits = database.habitChallengeDao().getAllHabitsSnapshot()
            val habitLogs = database.habitChallengeDao().getAllHabitLogsSnapshot()
            val challengeLogs = database.habitChallengeDao().getAllChallengeLogsSnapshot()

            val settingsJson = JSONObject().apply {
                put("hasCompletedOnboarding", settings.hasCompletedOnboarding)
                put("displayName", settings.displayName)
                put("unit", settings.unit.name)
                put("dailyWaterGoalMl", settings.dailyWaterGoalMl)
                put("themeMode", settings.themeMode.name)
                put("remindersEnabled", settings.remindersEnabled)
                put("reminderMode", settings.reminderMode.name)
                put("reminderIntervalMinutes", settings.reminderIntervalMinutes)
                put("reflectionRemindersEnabled", settings.reflectionRemindersEnabled)
                put("reflectionFrequency", settings.reflectionFrequency.name)
                put("reflectionTimeMinute", settings.reflectionTimeMinute)
                put("habitRemindersEnabled", settings.habitRemindersEnabled)
                put("habitFrequency", settings.habitFrequency.name)
                put("habitTimeMinute", settings.habitTimeMinute)
                put("selfCareRemindersEnabled", settings.selfCareRemindersEnabled)
                put("selfCareFrequency", settings.selfCareFrequency.name)
                put("selfCareTimeMinute", settings.selfCareTimeMinute)
                put("dailyUseReminderEnabled", settings.dailyUseReminderEnabled)
                put("dailyUseReminderTimeMinute", settings.dailyUseReminderTimeMinute)
                put("feedbackNotificationEnabled", settings.feedbackNotificationEnabled)
                put("hasSentPostUseFeedbackNotification", settings.hasSentPostUseFeedbackNotification)
                put("quietHoursStartMinute", settings.quietHoursStartMinute)
                put("quietHoursEndMinute", settings.quietHoursEndMinute)
                put("unlockedRewardIds", JSONArray(settings.unlockedRewardIds.toList()))
            }

            val vesselsJson = JSONArray().apply {
                vessels.forEach { v ->
                    put(JSONObject().apply {
                        put("id", v.id)
                        put("name", v.name)
                        put("volumeMl", v.volumeMl)
                        put("iconKey", v.iconKey)
                        put("sortOrder", v.sortOrder)
                        put("isDefault", v.isDefault)
                        put("isArchived", v.isArchived)
                    })
                }
            }

            val waterLogsJson = JSONArray().apply {
                waterLogs.forEach { l ->
                    put(JSONObject().apply {
                        put("dateEpochDay", l.dateEpochDay)
                        put("loggedAtMillis", l.loggedAtMillis)
                        put("amountMl", l.amountMl)
                        put("vesselNameSnapshot", l.vesselNameSnapshot)
                    })
                }
            }

            val moodsJson = JSONArray().apply {
                moods.forEach { m ->
                    put(JSONObject().apply {
                        put("dateEpochDay", m.dateEpochDay)
                        put("createdAtMillis", m.createdAtMillis)
                        put("moodLevel", m.moodLevel)
                        put("tagsCsv", m.tagsCsv)
                        put("shortNote", m.shortNote ?: "")
                    })
                }
            }

            val journalsJson = JSONArray().apply {
                journals.forEach { j ->
                    put(JSONObject().apply {
                        put("dateEpochDay", j.dateEpochDay)
                        put("createdAtMillis", j.createdAtMillis)
                        put("updatedAtMillis", j.updatedAtMillis)
                        put("title", j.title)
                        put("body", j.body)
                        if (j.moodLevel != null) put("moodLevel", j.moodLevel)
                        put("isFavorite", j.isFavorite)
                    })
                }
            }

            val appreciationsJson = JSONArray().apply {
                appreciations.forEach { a ->
                    put(JSONObject().apply {
                        put("dateEpochDay", a.dateEpochDay)
                        put("promptId", a.promptId)
                        put("promptSnapshot", a.promptSnapshot)
                        put("answerText", a.answerText)
                        put("createdAtMillis", a.createdAtMillis)
                    })
                }
            }

            val habitsJson = JSONArray().apply {
                habits.forEach { h ->
                    put(JSONObject().apply {
                        put("id", h.id)
                        put("title", h.title)
                        put("description", h.description)
                        put("timeOfDay", h.timeOfDay)
                        put("accentKey", h.accentKey)
                        put("targetCountPerDay", h.targetCountPerDay)
                        put("createdAtMillis", h.createdAtMillis)
                        put("isPaused", h.isPaused)
                        put("isArchived", h.isArchived)
                        put("sortOrder", h.sortOrder)
                    })
                }
            }

            val habitLogsJson = JSONArray().apply {
                habitLogs.forEach { hl ->
                    put(JSONObject().apply {
                        put("habitId", hl.habitId)
                        put("dateEpochDay", hl.dateEpochDay)
                        put("completedCount", hl.completedCount)
                        put("isCompleted", hl.isCompleted)
                        put("completedAtMillis", hl.completedAtMillis)
                    })
                }
            }

            val challengeLogsJson = JSONArray().apply {
                challengeLogs.forEach { cl ->
                    put(JSONObject().apply {
                        put("dateEpochDay", cl.dateEpochDay)
                        put("challengeId", cl.challengeId)
                        put("status", cl.status)
                        put("swapsUsed", cl.swapsUsed)
                        if (cl.completedAtMillis != null) put("completedAtMillis", cl.completedAtMillis)
                    })
                }
            }

            val root = JSONObject().apply {
                put("app", "Daily Tide")
                put("studio", "Violet Dolphin Studio")
                put("packageId", PACKAGE_ID)
                put("schemaVersion", SCHEMA_VERSION)
                put("exportedAtMillis", System.currentTimeMillis())
                put("offlineOnly", true)
                put("settings", settingsJson)
                put("vessels", vesselsJson)
                put("waterLogs", waterLogsJson)
                put("moodCheckIns", moodsJson)
                put("journalEntries", journalsJson)
                put("appreciationAnswers", appreciationsJson)
                put("favoriteAffirmationIds", JSONArray(favoriteAffirmations))
                put("habits", habitsJson)
                put("habitLogs", habitLogsJson)
                put("challengeLogs", challengeLogsJson)
            }

            AppResult.Success(root.toString(2))
        } catch (e: Exception) {
            AppResult.Error("Unable to export local backup.", e)
        }
    }

    suspend fun importFromJson(rawJson: String): AppResult<String> = withContext(Dispatchers.IO) {
        try {
            if (rawJson.isBlank() || rawJson.length > MAX_BACKUP_CHARS) {
                return@withContext AppResult.Error("Invalid or oversized backup file.")
            }

            val root = JSONObject(rawJson)
            val pkg = root.optString("packageId", "")
            if (pkg.isNotEmpty() && pkg != PACKAGE_ID) {
                return@withContext AppResult.Error("This backup file belongs to a different application.")
            }

            val settingsJson = root.optJSONObject("settings")
                ?: return@withContext AppResult.Error("Backup file is missing Daily Tide settings.")

            val restoredSettings = UserSettings(
                hasCompletedOnboarding = settingsJson.optBoolean("hasCompletedOnboarding", true),
                displayName = settingsJson.optString("displayName", "Friend").trim().ifBlank { "Friend" },
                unit = runCatching {
                    MeasurementUnit.valueOf(settingsJson.optString("unit", "ML"))
                }.getOrDefault(MeasurementUnit.ML),
                dailyWaterGoalMl = settingsJson.optInt("dailyWaterGoalMl", 2000).coerceIn(500, 6000),
                themeMode = runCatching {
                    ThemeMode.valueOf(settingsJson.optString("themeMode", "WARM_IVORY"))
                }.getOrDefault(ThemeMode.WARM_IVORY),
                remindersEnabled = settingsJson.optBoolean("remindersEnabled", false),
                reminderMode = runCatching {
                    ReminderMode.valueOf(settingsJson.optString("reminderMode", "INTERVAL"))
                }.getOrDefault(ReminderMode.INTERVAL),
                reminderIntervalMinutes = settingsJson.optInt("reminderIntervalMinutes", 120).coerceIn(30, 360),
                reflectionRemindersEnabled = settingsJson.optBoolean("reflectionRemindersEnabled", false),
                reflectionFrequency = runCatching {
                    ReminderFrequency.valueOf(settingsJson.optString("reflectionFrequency", "DAILY"))
                }.getOrDefault(ReminderFrequency.DAILY),
                reflectionTimeMinute = settingsJson.optInt("reflectionTimeMinute", 20 * 60 + 30).coerceIn(0, 1439),
                habitRemindersEnabled = settingsJson.optBoolean("habitRemindersEnabled", false),
                habitFrequency = runCatching {
                    ReminderFrequency.valueOf(settingsJson.optString("habitFrequency", "DAILY"))
                }.getOrDefault(ReminderFrequency.DAILY),
                habitTimeMinute = settingsJson.optInt("habitTimeMinute", 9 * 60).coerceIn(0, 1439),
                selfCareRemindersEnabled = settingsJson.optBoolean("selfCareRemindersEnabled", false),
                selfCareFrequency = runCatching {
                    ReminderFrequency.valueOf(settingsJson.optString("selfCareFrequency", "EVERY_2_DAYS"))
                }.getOrDefault(ReminderFrequency.EVERY_2_DAYS),
                selfCareTimeMinute = settingsJson.optInt("selfCareTimeMinute", 15 * 60).coerceIn(0, 1439),
                dailyUseReminderEnabled = settingsJson.optBoolean("dailyUseReminderEnabled", false),
                dailyUseReminderTimeMinute = settingsJson.optInt("dailyUseReminderTimeMinute", 8 * 60 + 30).coerceIn(0, 1439),
                feedbackNotificationEnabled = settingsJson.optBoolean("feedbackNotificationEnabled", true),
                hasSentPostUseFeedbackNotification = settingsJson.optBoolean("hasSentPostUseFeedbackNotification", false),
                quietHoursStartMinute = settingsJson.optInt("quietHoursStartMinute", 22 * 60).coerceIn(0, 1439),
                quietHoursEndMinute = settingsJson.optInt("quietHoursEndMinute", 7 * 60 + 30).coerceIn(0, 1439),
                unlockedRewardIds = buildSet {
                    val arr = settingsJson.optJSONArray("unlockedRewardIds")
                    if (arr != null) {
                        for (i in 0 until arr.length()) {
                            arr.optString(i).takeIf { it.isNotBlank() }?.let(::add)
                        }
                    }
                }
            )

            var restoredWaterCount = 0
            var restoredJournalCount = 0
            var restoredMoodCount = 0
            var restoredHabitCount = 0

            database.clearAllTables()
            OfflineContentSeeder.seedIfNeeded(database)

            database.withTransaction {
                val hydrationDao = database.hydrationDao()
                val reflectionDao = database.reflectionDao()
                val habitDao = database.habitChallengeDao()

                val vesselsArr = root.optJSONArray("vessels")
                if (vesselsArr != null && vesselsArr.length() > 0) {
                    val vessels = mutableListOf<WaterVesselEntity>()
                    for (i in 0 until vesselsArr.length()) {
                        val obj = vesselsArr.optJSONObject(i) ?: continue
                        vessels += WaterVesselEntity(
                            name = obj.optString("name", "Glass").take(60),
                            volumeMl = obj.optInt("volumeMl", 250).coerceIn(30, 3000),
                            iconKey = obj.optString("iconKey", "glass"),
                            sortOrder = obj.optInt("sortOrder", i),
                            isDefault = obj.optBoolean("isDefault", i == 0),
                            isArchived = obj.optBoolean("isArchived", false)
                        )
                    }
                    if (vessels.isNotEmpty()) {
                        hydrationDao.insertVessels(vessels)
                    }
                }

                val waterArr = root.optJSONArray("waterLogs")
                if (waterArr != null) {
                    for (i in 0 until waterArr.length()) {
                        val obj = waterArr.optJSONObject(i) ?: continue
                        hydrationDao.insertWaterLog(
                            WaterLogEntity(
                                dateEpochDay = obj.optLong("dateEpochDay", LocalDateUtil.todayEpochDay()),
                                loggedAtMillis = obj.optLong("loggedAtMillis", System.currentTimeMillis()),
                                amountMl = obj.optInt("amountMl", 250).coerceIn(10, 5000),
                                vesselId = null,
                                vesselNameSnapshot = obj.optString("vesselNameSnapshot", "Glass").take(60)
                            )
                        )
                        restoredWaterCount += 1
                    }
                }

                val moodsArr = root.optJSONArray("moodCheckIns")
                if (moodsArr != null) {
                    for (i in 0 until moodsArr.length()) {
                        val obj = moodsArr.optJSONObject(i) ?: continue
                        reflectionDao.insertMoodCheckIn(
                            MoodCheckInEntity(
                                dateEpochDay = obj.optLong("dateEpochDay", LocalDateUtil.todayEpochDay()),
                                createdAtMillis = obj.optLong("createdAtMillis", System.currentTimeMillis()),
                                moodLevel = obj.optInt("moodLevel", 3).coerceIn(1, 5),
                                tagsCsv = obj.optString("tagsCsv", ""),
                                shortNote = obj.optString("shortNote", "").takeIf { it.isNotBlank() }
                            )
                        )
                        restoredMoodCount += 1
                    }
                }

                val journalsArr = root.optJSONArray("journalEntries")
                if (journalsArr != null) {
                    for (i in 0 until journalsArr.length()) {
                        val obj = journalsArr.optJSONObject(i) ?: continue
                        val moodVal = if (obj.has("moodLevel")) obj.optInt("moodLevel").coerceIn(1, 5) else null
                        reflectionDao.upsertJournalEntry(
                            JournalEntryEntity(
                                dateEpochDay = obj.optLong("dateEpochDay", LocalDateUtil.todayEpochDay()),
                                createdAtMillis = obj.optLong("createdAtMillis", System.currentTimeMillis()),
                                updatedAtMillis = obj.optLong("updatedAtMillis", System.currentTimeMillis()),
                                title = obj.optString("title", "Reflection").take(200),
                                body = obj.optString("body", "").take(20_000),
                                moodLevel = moodVal,
                                isFavorite = obj.optBoolean("isFavorite", false)
                            )
                        )
                        restoredJournalCount += 1
                    }
                }

                val appreciationsArr = root.optJSONArray("appreciationAnswers")
                if (appreciationsArr != null) {
                    for (i in 0 until appreciationsArr.length()) {
                        val obj = appreciationsArr.optJSONObject(i) ?: continue
                        val answerText = obj.optString("answerText", "").trim()
                        if (answerText.isNotBlank()) {
                            reflectionDao.upsertAppreciationAnswer(
                                AppreciationAnswerEntity(
                                    dateEpochDay = obj.optLong("dateEpochDay", LocalDateUtil.todayEpochDay()),
                                    promptId = obj.optString("promptId", "pr_imported"),
                                    promptSnapshot = obj.optString("promptSnapshot", "Self-appreciation"),
                                    answerText = answerText.take(2000),
                                    createdAtMillis = obj.optLong("createdAtMillis", System.currentTimeMillis())
                                )
                            )
                        }
                    }
                }

                val favAffArr = root.optJSONArray("favoriteAffirmationIds")
                if (favAffArr != null) {
                    for (i in 0 until favAffArr.length()) {
                        favAffArr.optString(i).takeIf { it.isNotBlank() }?.let { id ->
                            reflectionDao.updateAffirmationFavorite(id, true)
                        }
                    }
                }

                val habitIdMap = mutableMapOf<Long, Long>()
                val habitsArr = root.optJSONArray("habits")
                if (habitsArr != null) {
                    for (i in 0 until habitsArr.length()) {
                        val obj = habitsArr.optJSONObject(i) ?: continue
                        val oldId = obj.optLong("id", -1L)
                        val newId = habitDao.insertHabit(
                            HabitEntity(
                                title = obj.optString("title", "Daily Habit").take(120),
                                description = obj.optString("description", "").take(400),
                                timeOfDay = obj.optString("timeOfDay", "ANYTIME"),
                                accentKey = obj.optString("accentKey", "violet"),
                                targetCountPerDay = obj.optInt("targetCountPerDay", 1).coerceIn(1, 20),
                                createdAtMillis = obj.optLong("createdAtMillis", System.currentTimeMillis()),
                                isPaused = obj.optBoolean("isPaused", false),
                                isArchived = obj.optBoolean("isArchived", false),
                                sortOrder = obj.optInt("sortOrder", i)
                            )
                        )
                        if (oldId > 0) habitIdMap[oldId] = newId
                        restoredHabitCount += 1
                    }
                }

                val habitLogsArr = root.optJSONArray("habitLogs")
                if (habitLogsArr != null) {
                    for (i in 0 until habitLogsArr.length()) {
                        val obj = habitLogsArr.optJSONObject(i) ?: continue
                        val mappedHabitId = habitIdMap[obj.optLong("habitId", -1L)] ?: continue
                        habitDao.upsertHabitLog(
                            HabitLogEntity(
                                habitId = mappedHabitId,
                                dateEpochDay = obj.optLong("dateEpochDay", LocalDateUtil.todayEpochDay()),
                                completedCount = obj.optInt("completedCount", 1).coerceAtLeast(1),
                                isCompleted = obj.optBoolean("isCompleted", true),
                                completedAtMillis = obj.optLong("completedAtMillis", System.currentTimeMillis())
                            )
                        )
                    }
                }

                val challengeLogsArr = root.optJSONArray("challengeLogs")
                if (challengeLogsArr != null) {
                    for (i in 0 until challengeLogsArr.length()) {
                        val obj = challengeLogsArr.optJSONObject(i) ?: continue
                        val challengeId = obj.optString("challengeId", "")
                        if (habitDao.getChallengeById(challengeId) != null) {
                            habitDao.upsertDailyChallengeLog(
                                DailyChallengeLogEntity(
                                    dateEpochDay = obj.optLong("dateEpochDay", LocalDateUtil.todayEpochDay()),
                                    challengeId = challengeId,
                                    status = obj.optString("status", "ASSIGNED"),
                                    swapsUsed = obj.optInt("swapsUsed", 0).coerceIn(0, 10),
                                    completedAtMillis = if (obj.has("completedAtMillis")) obj.optLong("completedAtMillis") else null
                                )
                            )
                        }
                    }
                }
            }

            settingsRepository.restoreFromBackup(restoredSettings)
            reminderScheduler.syncSchedules(restoredSettings)

            AppResult.Success(
                "Restored $restoredWaterCount water, $restoredMoodCount moods, $restoredJournalCount journal entries, and $restoredHabitCount habits locally."
            )
        } catch (e: Exception) {
            AppResult.Error("Could not import backup: please select a valid Daily Tide JSON file.", e)
        }
    }

    suspend fun clearAllApplicationData(): AppResult<Unit> = withContext(Dispatchers.IO) {
        try {
            reminderScheduler.cancelAllReminders()
            database.clearAllTables()
            settingsRepository.clearAllPreferences()
            rewardAccessManager?.clearAllRewardData()
            // Re-seed static offline content (vessels, 105 affirmations, prompts, challenges, badges)
            OfflineContentSeeder.seedIfNeeded(database)
            AppResult.Success(Unit)
        } catch (e: Exception) {
            AppResult.Error("Unable to clear local application data.", e)
        }
    }

    companion object {
        private const val PACKAGE_ID = "com.violetdolphinstudio.dailytide"
        private const val SCHEMA_VERSION = 1
        private const val MAX_BACKUP_CHARS = 5 * 1024 * 1024
    }
}

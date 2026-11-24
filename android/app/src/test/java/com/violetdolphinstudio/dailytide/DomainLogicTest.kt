package com.violetdolphinstudio.dailytide

import com.violetdolphinstudio.dailytide.data.local.db.seeder.OfflineContentSeeder
import com.violetdolphinstudio.dailytide.domain.model.HydrationDayState
import com.violetdolphinstudio.dailytide.domain.model.MeasurementUnit
import com.violetdolphinstudio.dailytide.domain.model.MoodLevel
import com.violetdolphinstudio.dailytide.notifications.HydrationReminderWorker
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DomainLogicTest {

    @Test
    fun hydrationProgressFractionCapsGracefullyAndDetectsGoal() {
        val state = HydrationDayState(
            dateEpochDay = 20000L,
            consumedMl = 2200,
            goalMl = 2000,
            logs = emptyList(),
            vessels = emptyList()
        )
        assertTrue(state.isGoalReached)
        assertEquals(1.1f, state.progressFraction, 0.01f)
    }

    @Test
    fun quietHoursRespectsOvernightWrapWindow() {
        val start = 22 * 60 // 22:00
        val end = 7 * 60 + 30 // 07:30

        assertTrue(HydrationReminderWorker.isWithinQuietHours(23 * 60, start, end))
        assertTrue(HydrationReminderWorker.isWithinQuietHours(6 * 60, start, end))
        assertFalse(HydrationReminderWorker.isWithinQuietHours(10 * 60, start, end))
        assertFalse(HydrationReminderWorker.isWithinQuietHours(21 * 60 + 59, start, end))
    }

    @Test
    fun measurementUnitsFormatAccurately() {
        assertEquals("250 ml", MeasurementUnit.ML.formatVolume(250))
        assertEquals("8 oz", MeasurementUnit.OZ.formatVolume(250))
    }

    @Test
    fun moodLevelMapsSafely() {
        assertEquals(MoodLevel.CALM, MoodLevel.fromLevel(4))
        assertEquals(MoodLevel.STEADY, MoodLevel.fromLevel(99))
    }

    @Test
    fun offlineMotivationLibraryContainsAtLeast100OriginalMessagesAcrossAll7Categories() {
        val library = OfflineContentSeeder.curatedMotivationLibrary()
        assertTrue("Expected at least 100 messages", library.size >= 100)
        assertEquals(library.size, library.map { it.id }.distinct().size)
        assertEquals(library.size, library.map { it.text }.distinct().size)

        val expectedCategories = setOf(
            "Self-confidence",
            "Discipline",
            "Consistency",
            "Personal growth",
            "Gratitude",
            "New beginnings",
            "Positive thinking"
        )
        assertEquals(expectedCategories, library.map { it.toneCategory }.toSet())
    }
}

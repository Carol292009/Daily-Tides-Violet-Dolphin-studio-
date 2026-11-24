package com.violetdolphinstudio.dailytide.presentation.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Book
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.WbTwilight
import androidx.compose.ui.graphics.vector.ImageVector

object DailyTideRoutes {
    const val SPLASH = "splash"
    const val ONBOARDING = "onboarding"
    const val PERSONAL_SETUP = "personal_setup"
    const val TODAY = "today"
    const val HYDRATION_DETAIL = "hydration_detail"
    const val MOOD_CHECKIN = "mood_checkin"
    const val REFLECT = "reflect"
    const val MOTIVATION = "motivation"
    const val HABITS = "habits"
    const val DAILY_CHALLENGES = "daily_challenges"
    const val ACHIEVEMENTS = "achievements"
    const val PROGRESS = "progress"
    const val WEEKLY_RECAP = "weekly_recap"
    const val SHARE_CARD_STUDIO = "share_card_studio"
    const val SETTINGS = "settings"
    const val REWARD_UNLOCK = "reward_unlock"
    const val ABOUT_STUDIO = "about_studio"
}

enum class BottomNavTab(
    val route: String,
    val label: String,
    val icon: ImageVector
) {
    TODAY(DailyTideRoutes.TODAY, "Home", Icons.Outlined.WbTwilight),
    HABITS(DailyTideRoutes.HABITS, "Habits", Icons.Outlined.CheckCircle),
    REFLECT(DailyTideRoutes.REFLECT, "Journal", Icons.Outlined.Book),
    PROGRESS(DailyTideRoutes.PROGRESS, "Progress", Icons.Outlined.AutoAwesome)
}

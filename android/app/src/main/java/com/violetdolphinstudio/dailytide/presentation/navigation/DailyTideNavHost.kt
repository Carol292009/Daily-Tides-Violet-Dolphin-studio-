package com.violetdolphinstudio.dailytide.presentation.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.violetdolphinstudio.dailytide.di.AppContainer
import com.violetdolphinstudio.dailytide.presentation.screens.AboutStudioScreen
import com.violetdolphinstudio.dailytide.presentation.screens.AchievementCollectionScreen
import com.violetdolphinstudio.dailytide.presentation.screens.DailyChallengesScreen
import com.violetdolphinstudio.dailytide.presentation.screens.HabitsScreen
import com.violetdolphinstudio.dailytide.presentation.screens.HomeDashboardScreen
import com.violetdolphinstudio.dailytide.presentation.screens.HydrationDetailScreen
import com.violetdolphinstudio.dailytide.presentation.screens.MoodCheckInScreen
import com.violetdolphinstudio.dailytide.presentation.screens.MotivationScreen
import com.violetdolphinstudio.dailytide.presentation.screens.OnboardingFlowScreen
import com.violetdolphinstudio.dailytide.presentation.screens.PersonalSetupScreen
import com.violetdolphinstudio.dailytide.presentation.screens.ProgressScreen
import com.violetdolphinstudio.dailytide.presentation.screens.ReflectScreen
import com.violetdolphinstudio.dailytide.presentation.screens.RewardUnlockScreen
import com.violetdolphinstudio.dailytide.presentation.screens.SettingsScreen
import com.violetdolphinstudio.dailytide.presentation.screens.ShareCardStudioScreen
import com.violetdolphinstudio.dailytide.presentation.screens.SplashScreen
import com.violetdolphinstudio.dailytide.presentation.screens.WeeklyRecapScreen
import com.violetdolphinstudio.dailytide.presentation.viewmodel.AppRootViewModel
import com.violetdolphinstudio.dailytide.presentation.viewmodel.DailyTideViewModelFactory
import com.violetdolphinstudio.dailytide.presentation.viewmodel.HabitsViewModel
import com.violetdolphinstudio.dailytide.presentation.viewmodel.HydrationViewModel
import com.violetdolphinstudio.dailytide.presentation.viewmodel.ProgressViewModel
import com.violetdolphinstudio.dailytide.presentation.viewmodel.ReflectViewModel
import com.violetdolphinstudio.dailytide.presentation.viewmodel.SettingsViewModel
import com.violetdolphinstudio.dailytide.presentation.viewmodel.TodayViewModel

@Composable
fun DailyTideAppShell(
    container: AppContainer,
    rootViewModel: AppRootViewModel,
    hasCompletedOnboarding: Boolean,
    initialTabRoute: String? = null
) {
    val factory = DailyTideViewModelFactory(container)
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    val startDestination = DailyTideRoutes.SPLASH
    val showBottomBar = BottomNavTab.entries.any { it.route == currentRoute }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    BottomNavTab.entries.forEach { tab ->
                        NavigationBarItem(
                            selected = currentRoute == tab.route,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label) }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier.padding(innerPadding)
        ) {
            // 1. Splash screen
            composable(DailyTideRoutes.SPLASH) {
                SplashScreen(
                    onFinished = {
                        val next = when {
                            !hasCompletedOnboarding -> DailyTideRoutes.ONBOARDING
                            initialTabRoute == "progress" -> DailyTideRoutes.PROGRESS
                            initialTabRoute == "reflect" -> DailyTideRoutes.REFLECT
                            initialTabRoute == "habits" -> DailyTideRoutes.HABITS
                            else -> DailyTideRoutes.TODAY
                        }
                        navController.navigate(next) {
                            popUpTo(DailyTideRoutes.SPLASH) { inclusive = true }
                        }
                    }
                )
            }

            // 2. Onboarding (starts with immediate user name entry)
            composable(DailyTideRoutes.ONBOARDING) {
                OnboardingFlowScreen(
                    onQuickEnterDashboard = { enteredName ->
                        rootViewModel.completeOnboarding(
                            displayName = enteredName,
                            unit = com.violetdolphinstudio.dailytide.domain.model.MeasurementUnit.ML,
                            dailyGoalMl = 2000,
                            remindersEnabled = false
                        )
                        navController.navigate(DailyTideRoutes.TODAY) {
                            popUpTo(DailyTideRoutes.ONBOARDING) { inclusive = true }
                        }
                    },
                    onContinueToSetup = { navController.navigate(DailyTideRoutes.PERSONAL_SETUP) }
                )
            }

            // 3. Personal self-care setup
            composable(DailyTideRoutes.PERSONAL_SETUP) {
                PersonalSetupScreen(
                    onFinish = { name, unit, goalMl, remindersEnabled ->
                        rootViewModel.completeOnboarding(name, unit, goalMl, remindersEnabled)
                        navController.navigate(DailyTideRoutes.TODAY) {
                            popUpTo(DailyTideRoutes.ONBOARDING) { inclusive = true }
                        }
                    }
                )
            }

            // 4. Home dashboard
            composable(DailyTideRoutes.TODAY) {
                val vm: TodayViewModel = viewModel(factory = factory)
                HomeDashboardScreen(
                    viewModel = vm,
                    onOpenHydration = { navController.navigate(DailyTideRoutes.HYDRATION_DETAIL) },
                    onOpenMoodCheckIn = { navController.navigate(DailyTideRoutes.MOOD_CHECKIN) },
                    onOpenJournal = { navController.navigate(DailyTideRoutes.REFLECT) },
                    onOpenMotivation = { navController.navigate(DailyTideRoutes.MOTIVATION) },
                    onOpenHabits = { navController.navigate(DailyTideRoutes.HABITS) },
                    onOpenDailyChallenges = { navController.navigate(DailyTideRoutes.DAILY_CHALLENGES) },
                    onOpenAchievements = { navController.navigate(DailyTideRoutes.ACHIEVEMENTS) },
                    onOpenProgress = { navController.navigate(DailyTideRoutes.PROGRESS) },
                    onOpenSettings = { navController.navigate(DailyTideRoutes.SETTINGS) }
                )
            }

            // 5. Hydration tracker
            composable(DailyTideRoutes.HYDRATION_DETAIL) {
                val vm: HydrationViewModel = viewModel(factory = factory)
                HydrationDetailScreen(
                    viewModel = vm,
                    onBack = { navController.popBackStack() }
                )
            }

            // 6. Mood check-in
            composable(DailyTideRoutes.MOOD_CHECKIN) {
                val vm: TodayViewModel = viewModel(factory = factory)
                MoodCheckInScreen(
                    viewModel = vm,
                    onBack = { navController.popBackStack() }
                )
            }

            // 7. Self-reflection journal
            composable(DailyTideRoutes.REFLECT) {
                val vm: ReflectViewModel = viewModel(factory = factory)
                ReflectScreen(viewModel = vm)
            }

            // 8. Motivation screen
            composable(DailyTideRoutes.MOTIVATION) {
                val todayVm: TodayViewModel = viewModel(factory = factory)
                val reflectVm: ReflectViewModel = viewModel(factory = factory)
                MotivationScreen(
                    todayViewModel = todayVm,
                    reflectViewModel = reflectVm,
                    onOpenShareCard = { navController.navigate(DailyTideRoutes.SHARE_CARD_STUDIO) },
                    onBack = { navController.popBackStack() }
                )
            }

            // 9. Habit tracker
            composable(DailyTideRoutes.HABITS) {
                val vm: HabitsViewModel = viewModel(factory = factory)
                HabitsScreen(viewModel = vm)
            }

            // 10. Daily challenges
            composable(DailyTideRoutes.DAILY_CHALLENGES) {
                val vm: TodayViewModel = viewModel(factory = factory)
                DailyChallengesScreen(
                    viewModel = vm,
                    onOpenRewardUnlock = { navController.navigate(DailyTideRoutes.REWARD_UNLOCK) },
                    onBack = { navController.popBackStack() }
                )
            }

            // 11. Achievement collection
            composable(DailyTideRoutes.ACHIEVEMENTS) {
                val vm: ProgressViewModel = viewModel(factory = factory)
                AchievementCollectionScreen(
                    viewModel = vm,
                    onOpenShareStudio = { navController.navigate(DailyTideRoutes.SHARE_CARD_STUDIO) },
                    onBack = { navController.popBackStack() }
                )
            }

            // 12. Progress dashboard
            composable(DailyTideRoutes.PROGRESS) {
                val vm: ProgressViewModel = viewModel(factory = factory)
                ProgressScreen(
                    viewModel = vm,
                    onOpenShareStudio = { navController.navigate(DailyTideRoutes.SHARE_CARD_STUDIO) },
                    onOpenWeeklyRecap = { navController.navigate(DailyTideRoutes.WEEKLY_RECAP) },
                    onOpenAchievements = { navController.navigate(DailyTideRoutes.ACHIEVEMENTS) }
                )
            }

            // 13. Weekly recap
            composable(DailyTideRoutes.WEEKLY_RECAP) {
                val vm: ProgressViewModel = viewModel(factory = factory)
                WeeklyRecapScreen(
                    viewModel = vm,
                    onOpenShareStudio = { navController.navigate(DailyTideRoutes.SHARE_CARD_STUDIO) },
                    onBack = { navController.popBackStack() }
                )
            }

            // Share card studio
            composable(DailyTideRoutes.SHARE_CARD_STUDIO) {
                val vm: ProgressViewModel = viewModel(factory = factory)
                ShareCardStudioScreen(
                    viewModel = vm,
                    onBack = { navController.popBackStack() }
                )
            }

            // 14. Settings
            composable(DailyTideRoutes.SETTINGS) {
                val vm: SettingsViewModel = viewModel(factory = factory)
                SettingsScreen(
                    viewModel = vm,
                    onOpenRewardUnlock = { navController.navigate(DailyTideRoutes.REWARD_UNLOCK) },
                    onOpenAboutStudio = { navController.navigate(DailyTideRoutes.ABOUT_STUDIO) },
                    onDataCleared = {
                        navController.navigate(DailyTideRoutes.ONBOARDING) {
                            popUpTo(0) { inclusive = true }
                        }
                    },
                    onBack = { navController.popBackStack() }
                )
            }

            // 15. Rewarded feature unlock screen
            composable(DailyTideRoutes.REWARD_UNLOCK) {
                val vm: SettingsViewModel = viewModel(factory = factory)
                RewardUnlockScreen(
                    viewModel = vm,
                    onBack = { navController.popBackStack() }
                )
            }

            // 16. About Violet Dolphin Studio
            composable(DailyTideRoutes.ABOUT_STUDIO) {
                AboutStudioScreen(onBack = { navController.popBackStack() })
            }
        }
    }
}

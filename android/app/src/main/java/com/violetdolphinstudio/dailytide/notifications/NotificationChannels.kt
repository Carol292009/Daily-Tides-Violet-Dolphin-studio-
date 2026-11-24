package com.violetdolphinstudio.dailytide.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import com.violetdolphinstudio.dailytide.R

object NotificationChannels {
    const val HYDRATION_CHANNEL_ID = "daily_tide_hydration"
    const val REFLECTION_CHANNEL_ID = "daily_tide_reflection"
    const val HABITS_CHANNEL_ID = "daily_tide_habits"
    const val SELF_CARE_CHANNEL_ID = "daily_tide_self_care"
    const val WEEKLY_SUMMARY_CHANNEL_ID = "daily_tide_weekly_summary"
    const val DAILY_USE_CHANNEL_ID = "daily_tide_daily_use"
    const val FEEDBACK_CHANNEL_ID = "daily_tide_feedback"

    const val HYDRATION_NOTIFICATION_ID = 1001
    const val WEEKLY_SUMMARY_NOTIFICATION_ID = 1002
    const val REFLECTION_NOTIFICATION_ID = 1003
    const val HABITS_NOTIFICATION_ID = 1004
    const val SELF_CARE_NOTIFICATION_ID = 1005
    const val DAILY_USE_NOTIFICATION_ID = 1006
    const val FEEDBACK_NOTIFICATION_ID = 1007

    fun registerAll(context: Context) {
        val manager = context.getSystemService(NotificationManager::class.java) ?: return

        val channels = listOf(
            NotificationChannel(
                HYDRATION_CHANNEL_ID,
                context.getString(R.string.channel_hydration_name),
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = context.getString(R.string.channel_hydration_desc)
            },
            NotificationChannel(
                REFLECTION_CHANNEL_ID,
                context.getString(R.string.channel_reflection_name),
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = context.getString(R.string.channel_reflection_desc)
            },
            NotificationChannel(
                HABITS_CHANNEL_ID,
                context.getString(R.string.channel_habits_name),
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = context.getString(R.string.channel_habits_desc)
            },
            NotificationChannel(
                SELF_CARE_CHANNEL_ID,
                context.getString(R.string.channel_self_care_name),
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = context.getString(R.string.channel_self_care_desc)
            },
            NotificationChannel(
                WEEKLY_SUMMARY_CHANNEL_ID,
                context.getString(R.string.channel_weekly_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = context.getString(R.string.channel_weekly_desc)
            },
            NotificationChannel(
                DAILY_USE_CHANNEL_ID,
                context.getString(R.string.channel_daily_use_name),
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = context.getString(R.string.channel_daily_use_desc)
            },
            NotificationChannel(
                FEEDBACK_CHANNEL_ID,
                context.getString(R.string.channel_feedback_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = context.getString(R.string.channel_feedback_desc)
            }
        )

        channels.forEach { manager.createNotificationChannel(it) }
    }
}

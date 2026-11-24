# Daily Tide (com.violetdolphinstudio.dailytide) Release R8 / ProGuard Rules

# 1. Strip verbose, debug, and info logging calls in release builds
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}

# 2. Keep Android Room entities, DAOs, and Database classes intact under R8
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
-dontwarn androidx.room.paging.**

# 3. Keep Preferences DataStore & Kotlin Coroutines metadata intact
-keepclassmembers class * extends androidx.datastore.preferences.protobuf.GeneratedMessageLite {
    <fields>;
}
-dontwarn kotlinx.coroutines.debug.**

# 4. Keep Google Mobile Ads SDK & Google UMP Consent SDK public entry points
-keep public class com.google.android.gms.ads.** {
    public *;
}
-keep public class com.google.ads.** {
    public *;
}
-keep public class com.google.android.ump.** {
    public *;
}
-dontwarn com.google.android.gms.ads.**
-dontwarn com.google.android.ump.**

# 5. Keep WorkManager workers & BroadcastReceivers referenced in AndroidManifest / WorkManager
-keep class com.violetdolphinstudio.dailytide.notifications.** { *; }

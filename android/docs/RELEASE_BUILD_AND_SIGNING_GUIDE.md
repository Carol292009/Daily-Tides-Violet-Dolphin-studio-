# Daily Tide — Android Build, Signing & Release Distribution Guide

**Application Name:** Daily Tide  
**Developer Studio:** Violet Dolphin Studio  
**Package ID:** `com.violetdolphinstudio.dailytide`  
**Version Name:** `1.0.0`  
**Version Code:** `1`  
**Compile / Target SDK:** API 35 (Android 15) · **Min SDK:** API 26 (Android 8.0)

---

## 1. Prerequisites (Local Developer Machine or CI)

- **JDK 17** (`java -version` → OpenJDK 17)
- **Android SDK** with Platform 35 (`android-35`) & Build-Tools 35.0.0 (`ANDROID_HOME` set)
- **Gradle 8.9+** (or Android Studio Ladybug+ which bundles JDK 17 and Gradle)

---

## 2. Generate an Installable DEBUG APK (Uses Official Google Test Ad IDs)

Run inside `/android`:

```bash
./gradlew assembleDebug
# Or if Gradle is installed globally without wrapper jar:
gradle assembleDebug
```

- **Debug APK Output Location:**  
  `android/app/build/outputs/apk/debug/app-debug.apk`
- **AdMob IDs Used in Debug:** Automatically locked to official Google Android test IDs:
  - App ID: `ca-app-pub-3940256099942544~3347511713`
  - Rewarded Ad Unit ID: `ca-app-pub-3940256099942544/5224354917`

---

## 3. Configure Release Signing & Production AdMob IDs (Zero Secrets Committed)

1. Generate your private upload keystore locally (keep this file backed up securely offline — **never commit it to Git**):
   ```bash
   keytool -genkeypair -v \
     -keystore android/release-upload-key.jks \
     -alias daily_tide_upload \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Copy `android/signing.properties.example` to `android/signing.properties` (already listed in `android/.gitignore`) and fill in:
   - `DAILY_TIDE_KEYSTORE_PATH=release-upload-key.jks`
   - `DAILY_TIDE_KEYSTORE_PASSWORD=<your keystore password>`
   - `DAILY_TIDE_KEY_ALIAS=daily_tide_upload`
   - `DAILY_TIDE_KEY_PASSWORD=<your key password>`
   - `ADMOB_PROD_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY` (your real AdMob App ID)
   - `ADMOB_PROD_REWARDED_AD_UNIT_ID=ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ` (your real Rewarded Ad Unit ID)

> **Built-in Production Safety Gate (`verifyReleaseDistributionConfig`):**  
> `assembleRelease` and `bundleRelease` will **automatically fail** if `ADMOB_PROD_APP_ID` or `ADMOB_PROD_REWARDED_AD_UNIT_ID` is empty, missing, or starts with Google's test publisher prefix `ca-app-pub-3940256099942544`, or if release signing credentials are missing.

---

## 4. Build the Signed Release APK & Release Android App Bundle (AAB)

Run inside `/android`:

```bash
# 1. Run JVM unit tests first
./gradlew testDebugUnitTest

# 2. Build Signed Release APK (R8 minified, resources shrunk, debug logs stripped)
./gradlew assembleRelease

# 3. Build Signed Release AAB for Google Play Console
./gradlew bundleRelease
```

### Expected Build Output Locations

- **Debug APK:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Signed Release APK:** `android/app/build/outputs/apk/release/app-release.apk`
- **Signed Release AAB (Google Play):** `android/app/build/outputs/bundle/release/app-release.aab`
- **R8 Mapping File (upload to Play Console for crash deobfuscation):**  
  `android/app/build/outputs/mapping/release/mapping.txt`

---

## 5. Pre-Submission Google Play Checklist

1. Verify `app-release.aab` signature with `jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab`.
2. Test `app-release.apk` on a physical Android device in **Airplane Mode** to verify hydration logging, reflection journaling, mood tracking, habits, Progress Garden, local JSON export/import, and cold-restart persistence.
3. Verify **Daily Use Reminder** and **Post-Use Feedback Notification** channels appear cleanly in Android App Notification Settings and respect Quiet Hours.
4. Upload `app-release.aab` + `mapping.txt` to Google Play Console (Internal Testing track first), complete **Data Safety** (`PRIVACY_DISCLOSURE_AND_DATA_SAFETY.md`), **Health Apps Declaration** (`GOOGLE_PLAY_HEALTH_APP_DECLARATION.md`), **Ads Declaration**, and link your public **Privacy Policy URL** and `app-ads.txt`.

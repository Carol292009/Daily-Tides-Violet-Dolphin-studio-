# Daily Tide — Privacy Disclosure & Google Play Data Safety Guide

**Application Name:** Daily Tide  
**Developer Studio:** Violet Dolphin Studio  
**Android Package ID:** `com.violetdolphinstudio.dailytide`  
**Effective Version:** 1.0.0 (`versionCode = 1`)

---

## 1. Plain-Language Privacy Summary

Daily Tide is built with an **offline-first personal privacy architecture**:

1. **Your Personal Self-Care Data Stays on Your Device:**  
   Daily Tide does **not** require an account, login, or cloud database. All personal self-care records — including hydration logs, custom vessels, daily mood check-ins, private reflection journals, self-appreciation notes, habits, daily quests, Progress Garden state, optional height/weight BMI guidance inputs, and local reminder schedules — are stored strictly on your device using Android Room (SQLite) and Jetpack DataStore. Android cloud Auto Backup (`allowBackup="false"`) and cloud data extraction are explicitly disabled.
2. **No Personal Wellness Data Sent to Advertisers:**  
   Daily Tide **never** attaches or transmits your journal entries, moods, appreciation notes, habits, hydration logs, or body metrics to Google AdMob or any third party.
3. **Third-Party Advertising SDK Data Processing (Google Mobile Ads & Google UMP):**  
   Because Daily Tide integrates the official **Google Mobile Ads SDK** (`com.google.android.gms:play-services-ads`) and **Google User Messaging Platform (UMP) SDK** (`com.google.android.ump:user-messaging-platform`) for **optional user-initiated rewarded videos**, **the Google Mobile Ads SDK collects and processes certain technical and advertising data** when consent allows and the SDK communicates with Google's ad servers. **Daily Tide therefore does NOT claim "No data collected" on Google Play.**

---

## 2. Accurate Google Play Data Safety Form Answers

Use the following verified answers when filling out **App Content → Data safety** in Google Play Console:

| Play Console Question | Accurate Answer | Rationale |
|---|---|---|
| Does your app collect or share any of the required user data types? | **Yes** | Google Mobile Ads SDK & UMP SDK process device/ad identifiers, coarse location, ad interactions, and SDK diagnostics. |
| Is all of the user data collected by your app encrypted in transit? | **Yes** | Google Mobile Ads & UMP communicate strictly over HTTPS/TLS. |
| Do you provide a way for users to request that their data is deleted? | **No (No user accounts exist)** — plus in-app **Clear All Application Data** wipes all local on-device records immediately, and users can reset/delete their Android Advertising ID in Android Settings. | Daily Tide has zero developer-operated servers or user accounts. |
| Does your app contain ads? (App Content → Ads) | **Yes** | Optional user-initiated Google AdMob Rewarded Video ads. |

### Data Types Collected / Shared by the Google Mobile Ads SDK

Declare the following data types under **Collected** (and **Shared** where applicable for third-party ad delivery/measurement per Google Mobile Ads SDK Data Safety disclosure):

| Category | Data Type | Collected / Shared | Purpose | Required or Optional |
|---|---|---|---|---|
| **Location** | Approximate location (derived from IP address) | Collected & Shared (by AdMob SDK) | Advertising or marketing, Fraud prevention, security, and compliance, Analytics | Optional (subject to UMP consent / offline usage) |
| **App activity** | App interactions (ad impressions, taps, rewarded video completions) | Collected & Shared (by AdMob SDK) | Advertising or marketing, Analytics, Fraud prevention | Optional |
| **App info and performance** | Crash logs & Diagnostics (SDK latency, ad load diagnostics) | Collected (by AdMob SDK) | Analytics, Advertising or marketing, Fraud prevention | Optional |
| **Device or other IDs** | Device or other IDs (Android Advertising ID `AD_ID`, App Set ID) | Collected & Shared (by AdMob SDK) | Advertising or marketing, Analytics, Fraud prevention | Optional (users can opt out/reset in Android Settings or UMP consent form) |

### Data Types **NOT** Collected or Shared by Daily Tide

- **Health and fitness (hydration logs, BMI/height/weight inputs, moods):** **NOT collected, NOT shared, NOT transmitted off-device.** Stored locally only.
- **Personal info (name, email, phone, address):** **NOT collected.** Display name is stored strictly locally in DataStore.
- **Messages / Journals / User-generated content:** **NOT collected, NOT shared.** Stored locally only.
- **Financial info:** **NOT collected.** Optional UPI QR code ("Buy Me a Coffee") is a static image scanned externally by the user's own UPI app; Daily Tide processes zero payment data.

---

## 3. Permissions Justification (AndroidManifest.xml)

| Permission | Reason |
|---|---|
| `android.permission.INTERNET` | Required exclusively by Google Mobile Ads SDK and Google UMP Privacy Consent SDK when optional rewarded ads are used. Core app functions 100% offline. |
| `android.permission.ACCESS_NETWORK_STATE` | Used by Google Mobile Ads SDK to check connectivity before requesting optional rewarded videos. |
| `com.google.android.gms.permission.AD_ID` | Required by Google Mobile Ads SDK on Android 13+ (explicitly declared for Play Console transparency). |
| `android.permission.POST_NOTIFICATIONS` | Requested **only on-demand** on Android 13+ when the user explicitly toggles on a local reminder (Hydration, Reflection, Habits, Self-Care, Daily Use, or Post-Use Feedback). |
| `android.permission.RECEIVE_BOOT_COMPLETED` | Used by `BootCompletedReceiver` to restore the user's opted-in local WorkManager reminders after a device reboot. |

---

## 4. User Privacy Controls & Consent

- **Google UMP Consent:** On launch (when online), `GooglePrivacyConsentManager` checks EEA/UK/US state privacy consent requirements and provides an in-app **Manage Ad Privacy Choices** button inside **Rewarded Access**.
- **Complete Local Data Control:** Users can export their local data as JSON, import a local JSON backup, delete individual journal/hydration/mood records, or wipe everything via **Settings → Clear All Application Data**.
- **Public Privacy Policy URL Requirement:** Before submitting to Google Play, host a public HTTPS copy of this privacy policy (e.g., on GitHub Pages or Violet Dolphin Studio's website) and enter the URL in **Play Console → App Content → Privacy Policy**.

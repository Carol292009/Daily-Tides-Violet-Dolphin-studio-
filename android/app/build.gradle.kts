import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

// Load optional gitignored signing.properties & local.properties without ever committing secrets
val signingProps = Properties().apply {
    val file = rootProject.file("signing.properties")
    if (file.exists()) file.inputStream().use { load(it) }
}
val localProps = Properties().apply {
    val file = rootProject.file("local.properties")
    if (file.exists()) file.inputStream().use { load(it) }
}

fun resolveSecretOrProp(key: String): String =
    (System.getenv(key)
        ?: signingProps.getProperty(key)
        ?: localProps.getProperty(key)
        ?: "").trim()

val googleTestPublisherPrefix = "ca-app-pub-3940256099942544"
val googleTestAppId = "$googleTestPublisherPrefix~3347511713"
val googleTestRewardedUnitId = "$googleTestPublisherPrefix/5224354917"

val prodAdMobAppId = resolveSecretOrProp("ADMOB_PROD_APP_ID")
val prodAdMobRewardedUnitId = resolveSecretOrProp("ADMOB_PROD_REWARDED_AD_UNIT_ID")

val releaseKeystorePath = resolveSecretOrProp("DAILY_TIDE_KEYSTORE_PATH")
val releaseKeystorePassword = resolveSecretOrProp("DAILY_TIDE_KEYSTORE_PASSWORD")
val releaseKeyAlias = resolveSecretOrProp("DAILY_TIDE_KEY_ALIAS")
val releaseKeyPassword = resolveSecretOrProp("DAILY_TIDE_KEY_PASSWORD")
val hasReleaseSigning = releaseKeystorePath.isNotEmpty() &&
    rootProject.file(releaseKeystorePath).exists() &&
    releaseKeystorePassword.isNotEmpty() &&
    releaseKeyAlias.isNotEmpty() &&
    releaseKeyPassword.isNotEmpty()

val appVersionCode = (project.findProperty("DAILY_TIDE_VERSION_CODE") as? String)?.toIntOrNull() ?: 1
val appVersionName = (project.findProperty("DAILY_TIDE_VERSION_NAME") as? String)?.ifBlank { "1.0.0" } ?: "1.0.0"

android {
    namespace = "com.violetdolphinstudio.dailytide"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.violetdolphinstudio.dailytide"
        minSdk = 26
        targetSdk = 35
        versionCode = appVersionCode
        versionName = appVersionName

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        // Default to official Google Mobile Ads test IDs for debug & local unit testing
        manifestPlaceholders["ADMOB_APP_ID"] = googleTestAppId
        buildConfigField(
            "String",
            "ADMOB_REWARDED_AD_UNIT_ID",
            "\"$googleTestRewardedUnitId\""
        )
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = rootProject.file(releaseKeystorePath)
                storePassword = releaseKeystorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
                enableV1Signing = true
                enableV2Signing = true
                enableV3Signing = true
            }
        }
    }

    buildTypes {
        debug {
            isDebuggable = true
            // Strictly enforce official Google Mobile Ads test IDs in debug builds
            manifestPlaceholders["ADMOB_APP_ID"] = googleTestAppId
            buildConfigField(
                "String",
                "ADMOB_REWARDED_AD_UNIT_ID",
                "\"$googleTestRewardedUnitId\""
            )
        }
        release {
            isDebuggable = false
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            if (hasReleaseSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
            // Production AdMob IDs must be supplied via signing.properties / local.properties / env vars.
            // Never fall back to Google test ad IDs in release builds.
            manifestPlaceholders["ADMOB_APP_ID"] = prodAdMobAppId
            buildConfigField(
                "String",
                "ADMOB_REWARDED_AD_UNIT_ID",
                "\"$prodAdMobRewardedUnitId\""
            )
        }
    }

    bundle {
        language { enableSplit = true }
        density { enableSplit = true }
        abi { enableSplit = true }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

// Hard release safety gate: prevents shipping Google test AdMob IDs or unsigned release artifacts
val verifyReleaseDistributionConfig by tasks.registering {
    group = "verification"
    description = "Verifies production AdMob IDs and release signing configuration before release builds."
    doLast {
        if (prodAdMobAppId.isBlank() || prodAdMobAppId.startsWith(googleTestPublisherPrefix)) {
            throw GradleException(
                "RELEASE BLOCKED: ADMOB_PROD_APP_ID must be set to your real Google AdMob App ID (not a Google test ID) in android/signing.properties or environment variables."
            )
        }
        if (prodAdMobRewardedUnitId.isBlank() || prodAdMobRewardedUnitId.startsWith(googleTestPublisherPrefix)) {
            throw GradleException(
                "RELEASE BLOCKED: ADMOB_PROD_REWARDED_AD_UNIT_ID must be set to your real Google AdMob Rewarded Ad Unit ID (not a Google test ID) in android/signing.properties or environment variables."
            )
        }
        if (!hasReleaseSigning) {
            throw GradleException(
                "RELEASE BLOCKED: Release signing keystore is not configured. Copy android/signing.properties.example to android/signing.properties or set DAILY_TIDE_KEYSTORE_* environment variables."
            )
        }
    }
}

tasks.configureEach {
    if (name == "assembleRelease" || name == "bundleRelease" || name == "packageRelease" || name == "packageReleaseBundle") {
        dependsOn(verifyReleaseDistributionConfig)
    }
}

ksp {
    arg("room.schemaLocation", "$projectDir/schemas")
    arg("room.incremental", "true")
    arg("room.generateKotlin", "true")
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.core.splashscreen)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    implementation(libs.androidx.datastore.preferences)
    implementation(libs.androidx.work.runtime.ktx)
    implementation(libs.kotlinx.coroutines.android)

    // Official Google Mobile Ads SDK & Google User Messaging Platform (UMP) Privacy Consent SDK
    // Isolated inside com.violetdolphinstudio.dailytide.ads — no Firebase or cloud backend added.
    implementation(libs.google.play.services.ads)
    implementation(libs.google.ump.consent)

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
}

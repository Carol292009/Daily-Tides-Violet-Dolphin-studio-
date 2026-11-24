package com.violetdolphinstudio.dailytide.presentation.screens

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.violetdolphinstudio.dailytide.R
import com.violetdolphinstudio.dailytide.domain.model.MeasurementUnit
import com.violetdolphinstudio.dailytide.presentation.components.TideProgressRing
import com.violetdolphinstudio.dailytide.presentation.components.VioletDolphinBrandFooter
import kotlinx.coroutines.delay
import kotlin.math.roundToInt

@Composable
fun SplashScreen(
    onFinished: () -> Unit
) {
    LaunchedEffect(Unit) {
        delay(1300)
        onFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Image(
                painter = painterResource(id = R.drawable.ic_violet_dolphin_crest),
                contentDescription = "Daily Tide by Violet Dolphin Studio",
                modifier = Modifier.size(116.dp)
            )
            Spacer(modifier = Modifier.height(20.dp))
            Text(
                text = "Daily Tide",
                style = MaterialTheme.typography.displaySmall,
                color = MaterialTheme.colorScheme.onBackground
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Little habits. Better days.",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "By Violet Dolphin Studio",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}

@Composable
fun OnboardingFlowScreen(
    onQuickEnterDashboard: (name: String) -> Unit = {},
    onContinueToSetup: () -> Unit
) {
    var userName by rememberSaveable { mutableStateOf("") }
    var pageIndex by rememberSaveable { mutableIntStateOf(0) } // 0 = Ask user name first, 1..3 = calm highlights

    val slides = listOf(
        Triple(
            "Hydration & Daily Quests",
            "Log water with custom glasses, complete small daily quests, and watch your offline Progress Garden bloom.",
            "Mindful Water"
        ),
        Triple(
            "Awareness & Appreciation",
            "Check in with your mood, write freely in a warm-ivory journal, and explore 105 offline motivational affirmations.",
            "Inner Calm"
        ),
        Triple(
            "100% Private on Your Phone",
            "No accounts, no cloud sync, no internet needed. Zero guilt alerts or manipulative streak resets.",
            "Offline-First"
        )
    )

    if (pageIndex == 0) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.SpaceBetween,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                TextButton(onClick = { pageIndex = 1 }) {
                    Text("Quick Tour")
                }
            }

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Image(
                    painter = painterResource(id = R.drawable.ic_violet_dolphin_crest),
                    contentDescription = "Violet Dolphin Studio Crest",
                    modifier = Modifier.size(92.dp)
                )
                Spacer(modifier = Modifier.height(22.dp))
                Text(
                    text = "Welcome to Daily Tide",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "What should we call you?",
                    style = MaterialTheme.typography.headlineMedium,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = "Write your name so your main dashboard greets you personally. Stored strictly offline on your device.",
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(24.dp))
                OutlinedTextField(
                    value = userName,
                    onValueChange = { userName = it },
                    label = { Text("Your Name") },
                    placeholder = { Text("Type your first name...") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp)
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                Button(
                    onClick = { onQuickEnterDashboard(userName.trim().ifBlank { "Friend" }) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    val label = if (userName.isNotBlank()) "Open ${userName.trim()}'s Dashboard" else "Enter My Dashboard"
                    Text(label)
                }
                OutlinedButton(
                    onClick = onContinueToSetup,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("Personalize Water Goal & Reminders")
                }
                VioletDolphinBrandFooter()
            }
        }
        return
    }

    val slideIndex = (pageIndex - 1).coerceIn(0, slides.lastIndex)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.SpaceBetween,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End
        ) {
            TextButton(onClick = { onQuickEnterDashboard(userName.trim().ifBlank { "Friend" }) }) {
                Text("Go to Dashboard")
            }
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
        ) {
            Image(
                painter = painterResource(id = R.drawable.ic_violet_dolphin_crest),
                contentDescription = "Violet Dolphin Studio Crest",
                modifier = Modifier.size(92.dp)
            )
            Spacer(modifier = Modifier.height(24.dp))
            AnimatedContent(targetState = slideIndex, label = "onboardingSlide") { idx ->
                val (title, body, kicker) = slides[idx]
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = kicker,
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = title,
                        style = MaterialTheme.typography.headlineMedium,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = body,
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Spacer(modifier = Modifier.height(28.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                slides.indices.forEach { idx ->
                    Box(
                        modifier = Modifier
                            .size(if (idx == slideIndex) 10.dp else 8.dp)
                            .clip(CircleShape)
                            .background(
                                if (idx == slideIndex) MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.outline
                            )
                    )
                }
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            Button(
                onClick = {
                    if (slideIndex < slides.lastIndex) pageIndex += 1 else onContinueToSetup()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text(if (slideIndex < slides.lastIndex) "Continue" else "Personalize My Tide")
            }
            OutlinedButton(
                onClick = { pageIndex = (pageIndex - 1).coerceAtLeast(0) },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("Back")
            }
            VioletDolphinBrandFooter()
        }
    }
}

@Composable
fun PersonalSetupScreen(
    onFinish: (name: String, unit: MeasurementUnit, goalMl: Int, remindersEnabled: Boolean) -> Unit
) {
    val context = LocalContext.current
    var name by rememberSaveable { mutableStateOf("") }
    var unit by rememberSaveable { mutableStateOf(MeasurementUnit.ML) }
    var goalSlider by rememberSaveable { mutableFloatStateOf(2000f) }
    var remindersEnabled by rememberSaveable { mutableStateOf(false) }

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        remindersEnabled = granted
    }

    val goalMl = (goalSlider / 100f).roundToInt() * 100

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Personal Self-Care Setup",
            style = MaterialTheme.typography.headlineMedium,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = "Tailor your calm hydration goal and gentle daily rhythm.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(22.dp))

        TideProgressRing(
            progress = (goalMl.toFloat() / 3500f).coerceIn(0.25f, 1f),
            color = MaterialTheme.colorScheme.tertiary,
            size = 104.dp,
            strokeWidth = 9.dp,
            centerLabel = unit.formatVolume(goalMl)
        )

        Spacer(modifier = Modifier.height(22.dp))

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = MaterialTheme.shapes.large,
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Preferred first name") },
                    placeholder = { Text("Friend") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp)
                )

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    MeasurementUnit.entries.forEach { option ->
                        val selected = unit == option
                        Surface(
                            onClick = { unit = option },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp),
                            color = if (selected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
                            border = if (selected) BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary) else null
                        ) {
                            Text(
                                text = if (option == MeasurementUnit.ML) "Milliliters (ml)" else "Ounces (oz)",
                                style = MaterialTheme.typography.labelLarge,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(vertical = 12.dp)
                            )
                        }
                    }
                }

                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Personal Daily Target", style = MaterialTheme.typography.titleMedium)
                        Text(
                            text = unit.formatVolume(goalMl),
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.secondary
                        )
                    }
                    Slider(
                        value = goalSlider,
                        onValueChange = { goalSlider = it },
                        valueRange = 1000f..3500f,
                        steps = 24
                    )
                    Text(
                        text = "Hydration needs are personal—set a comfortable target for your body.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Gentle Reminders (Optional)", style = MaterialTheme.typography.titleMedium)
                        Text(
                            text = "Off by default · permission requested only when enabled · quiet hours 10:00 PM – 7:30 AM.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Switch(
                        checked = remindersEnabled,
                        onCheckedChange = { checked ->
                            if (checked && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                val granted = ContextCompat.checkSelfPermission(
                                    context,
                                    Manifest.permission.POST_NOTIFICATIONS
                                ) == PackageManager.PERMISSION_GRANTED
                                if (granted) {
                                    remindersEnabled = true
                                } else {
                                    notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                                }
                            } else {
                                remindersEnabled = checked
                            }
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(22.dp))

        Button(
            onClick = { onFinish(name, unit, goalMl, remindersEnabled) },
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text("Enter Daily Tide", style = MaterialTheme.typography.titleMedium)
        }
    }
}

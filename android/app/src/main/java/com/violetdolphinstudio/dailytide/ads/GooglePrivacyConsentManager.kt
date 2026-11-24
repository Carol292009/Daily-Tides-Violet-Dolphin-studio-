package com.violetdolphinstudio.dailytide.ads

import android.app.Activity
import android.content.Context
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class PrivacyConsentUiState(
    val isChecking: Boolean = false,
    val canRequestAds: Boolean = false,
    val privacyOptionsRequired: Boolean = false,
    val statusLabel: String = "Checking consent status",
    val lastErrorMessage: String? = null
)

interface PrivacyConsentManager {
    val consentState: StateFlow<PrivacyConsentUiState>
    val canRequestAds: Boolean
    fun gatherConsent(activity: Activity, onConsentComplete: (canRequestAds: Boolean) -> Unit)
    fun showPrivacyOptionsForm(activity: Activity, onDismissed: (errorMessage: String?) -> Unit)
}

/**
 * Official Google User Messaging Platform (UMP) SDK consent handler.
 *
 * Implements Google's current GDPR / EEA / UK / US State privacy consent requirements.
 * Offline or consent-request errors fail gracefully without ever blocking core Free Level features.
 */
class GooglePrivacyConsentManager(
    context: Context
) : PrivacyConsentManager {

    private val consentInformation: ConsentInformation =
        UserMessagingPlatform.getConsentInformation(context.applicationContext)

    private val _consentState = MutableStateFlow(
        PrivacyConsentUiState(
            isChecking = false,
            canRequestAds = consentInformation.canRequestAds(),
            privacyOptionsRequired = isPrivacyOptionsRequiredInternal(),
            statusLabel = formatStatusLabel(consentInformation.consentStatus, consentInformation.canRequestAds())
        )
    )
    override val consentState: StateFlow<PrivacyConsentUiState> = _consentState.asStateFlow()

    override val canRequestAds: Boolean
        get() = consentInformation.canRequestAds()

    override fun gatherConsent(
        activity: Activity,
        onConsentComplete: (canRequestAds: Boolean) -> Unit
    ) {
        _consentState.value = _consentState.value.copy(
            isChecking = true,
            lastErrorMessage = null
        )

        val params = ConsentRequestParameters.Builder()
            .setTagForUnderAgeOfConsent(false)
            .build()

        consentInformation.requestConsentInfoUpdate(
            activity,
            params,
            {
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) { formError ->
                    val allowed = consentInformation.canRequestAds()
                    _consentState.value = PrivacyConsentUiState(
                        isChecking = false,
                        canRequestAds = allowed,
                        privacyOptionsRequired = isPrivacyOptionsRequiredInternal(),
                        statusLabel = formatStatusLabel(consentInformation.consentStatus, allowed),
                        lastErrorMessage = formError?.message
                    )
                    onConsentComplete(allowed)
                }
            },
            { requestError ->
                // Offline or transient UMP failure: never crash or block Free Level self-care.
                val allowed = consentInformation.canRequestAds()
                _consentState.value = PrivacyConsentUiState(
                    isChecking = false,
                    canRequestAds = allowed,
                    privacyOptionsRequired = isPrivacyOptionsRequiredInternal(),
                    statusLabel = if (allowed) "Ready (cached consent)" else "Offline / Consent pending",
                    lastErrorMessage = requestError.message
                )
                onConsentComplete(allowed)
            }
        )
    }

    override fun showPrivacyOptionsForm(
        activity: Activity,
        onDismissed: (errorMessage: String?) -> Unit
    ) {
        UserMessagingPlatform.showPrivacyOptionsForm(activity) { formError ->
            val allowed = consentInformation.canRequestAds()
            _consentState.value = PrivacyConsentUiState(
                isChecking = false,
                canRequestAds = allowed,
                privacyOptionsRequired = isPrivacyOptionsRequiredInternal(),
                statusLabel = formatStatusLabel(consentInformation.consentStatus, allowed),
                lastErrorMessage = formError?.message
            )
            onDismissed(formError?.message)
        }
    }

    private fun isPrivacyOptionsRequiredInternal(): Boolean =
        consentInformation.privacyOptionsRequirementStatus ==
            ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED

    private fun formatStatusLabel(status: Int, canRequest: Boolean): String = when (status) {
        ConsentInformation.ConsentStatus.OBTAINED ->
            if (canRequest) "Consent obtained" else "Consent declined (Free features active)"
        ConsentInformation.ConsentStatus.NOT_REQUIRED -> "Consent not required in your region"
        ConsentInformation.ConsentStatus.REQUIRED -> "Privacy choice required before ads"
        else -> if (canRequest) "Ready" else "Not yet determined"
    }
}

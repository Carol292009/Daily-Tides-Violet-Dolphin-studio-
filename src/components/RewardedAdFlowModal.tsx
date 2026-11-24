import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Play,
  ShieldCheck,
  Tv,
  WifiOff,
  X,
} from 'lucide-react';
import { RewardLevelId, RewardLevelSnapshot } from '../rewards/rewardAccessManager';
import {
  ADMOB_OFFICIAL_TEST_REWARDED_AD_UNIT_ID,
  resolveAdMobConfig,
} from '../ads/adMobConfig';
import {
  PrivacyConsentState,
  PrivacyConsentStatus,
} from '../ads/privacyConsentManager';

type SimulatedOutcomeMode = 'NORMAL' | 'LOAD_FAILED' | 'SHOW_FAILED' | 'OFFLINE';

type ModalStep =
  | 'CONSENT'
  | 'DISCLOSURE'
  | 'LOADING'
  | 'SHOWING'
  | 'REWARD_EARNED'
  | 'DISMISSED_EARLY'
  | 'FAILED';

interface RewardedAdFlowModalProps {
  mode: 'unlock' | 'consent_only';
  level: RewardLevelSnapshot | null;
  consentState: PrivacyConsentState;
  onSetConsentChoice: (choice: Exclude<PrivacyConsentStatus, 'UNKNOWN'>) => void;
  onRewardEarnedGrant: (
    levelId: RewardLevelId
  ) => Promise<{ ok: boolean; expiresAtMillis?: number; error?: string }>;
  onClose: () => void;
}

const TEST_VIDEO_DURATION_SECONDS = 5;

export const RewardedAdFlowModal: React.FC<RewardedAdFlowModalProps> = ({
  mode,
  level,
  consentState,
  onSetConsentChoice,
  onRewardEarnedGrant,
  onClose,
}) => {
  const adConfig = resolveAdMobConfig();
  const [step, setStep] = useState<ModalStep>(() => {
    if (mode === 'consent_only') return 'CONSENT';
    return consentState.canRequestAds ? 'DISCLOSURE' : 'CONSENT';
  });
  const [outcomeMode, setOutcomeMode] = useState<SimulatedOutcomeMode>('NORMAL');
  const [secondsLeft, setSecondsLeft] = useState(TEST_VIDEO_DURATION_SECONDS);
  const [outcomeMessage, setOutcomeMessage] = useState<string>('');
  const [grantedExpiresAt, setGrantedExpiresAt] = useState<number | null>(null);
  const [declinedInModal, setDeclinedInModal] = useState(false);

  // Countdown timer ONLY during SHOWING phase; grants reward ONLY upon reaching 0s
  useEffect(() => {
    if (step !== 'SHOWING' || !level) return;

    if (secondsLeft <= 0) {
      let active = true;
      void (async () => {
        const result = await onRewardEarnedGrant(level.config.id);
        if (!active) return;
        if (result.ok) {
          setGrantedExpiresAt(result.expiresAtMillis ?? null);
          setStep('REWARD_EARNED');
        } else {
          setOutcomeMessage(result.error ?? 'Unable to persist reward locally.');
          setStep('FAILED');
        }
      })();
      return () => {
        active = false;
      };
    }

    const timerId = window.setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timerId);
  }, [step, secondsLeft, level, onRewardEarnedGrant]);

  const handleChooseConsent = (choice: Exclude<PrivacyConsentStatus, 'UNKNOWN'>) => {
    onSetConsentChoice(choice);
    if (mode === 'consent_only') {
      onClose();
      return;
    }
    if (choice === 'DECLINED') {
      setDeclinedInModal(true);
      return;
    }
    setDeclinedInModal(false);
    setStep('DISCLOSURE');
  };

  const handleStartOptionalAd = () => {
    if (!level) return;
    setStep('LOADING');
    setOutcomeMessage('');

    window.setTimeout(() => {
      const browserOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
      if (outcomeMode === 'OFFLINE' || browserOffline) {
        setOutcomeMessage(
          'Your device appears offline, so the optional advertisement could not load. All Free Level self-care features and any previously unlocked rewards continue working offline.'
        );
        setStep('FAILED');
        return;
      }

      if (outcomeMode === 'LOAD_FAILED') {
        setOutcomeMessage(
          'Google AdMob returned LoadAdError (Code 3 · No Fill). No reward was granted — you can continue using all free features seamlessly.'
        );
        setStep('FAILED');
        return;
      }

      if (outcomeMode === 'SHOW_FAILED') {
        setOutcomeMessage(
          'FullScreenContentCallback reported AdFailedToShow (Code 2). No reward was granted — all free self-care features remain ready.'
        );
        setStep('FAILED');
        return;
      }

      // Ad loaded & opened (onAdShowedFullScreenContent) — strictly NO reward granted yet!
      setSecondsLeft(TEST_VIDEO_DURATION_SECONDS);
      setStep('SHOWING');
    }, 800);
  };

  const handleCloseAdEarly = () => {
    // onAdDismissedFullScreenContent fired BEFORE onUserEarnedReward -> ZERO reward granted!
    setOutcomeMessage(
      'You closed the rewarded video before completion. No reward was granted, and your reward history was not altered. All Free Level features remain available.'
    );
    setStep('DISMISSED_EARLY');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Optional Google AdMob Rewarded Ad"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 shadow-2xl space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6C4FE0] dark:text-[#A994FF]">
              {step === 'CONSENT'
                ? 'Google Privacy Consent (UMP)'
                : 'Google AdMob Rewarded Video · Test Mode'}
            </p>
            <h3 className="font-display text-lg font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
              {step === 'CONSENT' && 'Your Ad Privacy Choices'}
              {step === 'DISCLOSURE' && 'Optional Rewarded Ad Details'}
              {step === 'LOADING' && 'Loading Optional Advertisement'}
              {step === 'SHOWING' && 'Google Test Rewarded Advertisement'}
              {step === 'REWARD_EARNED' && 'Reward Earned & Saved Locally'}
              {step === 'DISMISSED_EARLY' && 'Ad Closed Early · No Reward'}
              {step === 'FAILED' && 'Advertisement Unavailable'}
            </h3>
          </div>
          {step !== 'SHOWING' && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-[#F2EEE6] dark:hover:bg-[#242942] text-[#645F75] dark:text-[#B3AEC4] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* STEP 1: GOOGLE UMP PRIVACY CONSENT */}
        {step === 'CONSENT' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#EFEAFF] dark:bg-[#231D44] p-4 space-y-2 text-xs text-[#342F49] dark:text-[#D5D1E4] leading-relaxed">
              <div className="flex items-center gap-2 font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
                <ShieldCheck className="w-4 h-4 text-[#6C4FE0] dark:text-[#A994FF] shrink-0" />
                <span>Private Self-Care Data Stays On Your Device</span>
              </div>
              <p>{adConfig.privacyPolicyNote}</p>
              <p>
                Daily Tide uses Google’s User Messaging Platform (UMP) before requesting optional rewarded ads. You may change this preference at any time.
              </p>
            </div>

            {declinedInModal && (
              <div className="rounded-2xl bg-[#E4F7F9] dark:bg-[#163644] p-3.5 text-xs text-[#133A56] dark:text-[#B2E3EA]">
                Ad requests are disabled. All Free Level features (hydration, mood check-in, basic reflection, 105 motivational messages, habits, and Progress Garden) remain 100% available.
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleChooseConsent('OBTAINED_PERSONALIZED')}
                className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] transition-colors cursor-pointer"
              >
                Consent to Optional Rewarded Ads
              </button>
              <button
                type="button"
                onClick={() => handleChooseConsent('OBTAINED_NON_PERSONALIZED')}
                className="w-full py-3 px-4 rounded-xl text-xs font-semibold border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] text-[#1F1D2B] dark:text-[#F3F0EA] hover:border-[#6C4FE0] transition-colors cursor-pointer"
              >
                Allow Non-Personalized Optional Ads Only
              </button>
              <button
                type="button"
                onClick={() => handleChooseConsent('DECLINED')}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-[#645F75] dark:text-[#B3AEC4] hover:bg-[#F2EEE6] dark:hover:bg-[#242942] transition-colors cursor-pointer"
              >
                Decline Ads &amp; Continue Free Features Only
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: EXPLICIT PRE-AD DISCLOSURE */}
        {step === 'DISCLOSURE' && level && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] border border-[#E6DFD3] dark:border-[#2E3452] p-4 space-y-2.5 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
                  Feature to Unlock
                </span>
                <span className="text-xs font-semibold text-right text-[#1E1340] dark:text-[#F3F0EA]">
                  {level.config.badgeLabel} · {level.config.title}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
                  Access Duration
                </span>
                <span className="text-xs font-semibold text-[#256B9A] dark:text-[#79BCE8] tabular-nums">
                  {level.config.durationHours} hours (works offline after unlocking)
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
                  Requirement
                </span>
                <span className="text-xs font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
                  100% Optional · Full video completion required
                </span>
              </div>
              <div className="pt-2 border-t border-[#E6DFD3] dark:border-[#2C3250] text-[11px] text-[#645F75] dark:text-[#B3AEC4] leading-relaxed">
                Watching this advertisement is completely optional. Rewards are granted only after the full rewarded video completes — closing early or load failures never grant rewards, and all Free Level self-care tools stay available regardless.
              </div>
            </div>

            {/* Development Test Ad Unit & Outcome Tester */}
            <div className="rounded-2xl bg-[#EFEAFF]/60 dark:bg-[#231D44]/80 p-3.5 space-y-2">
              <p className="text-[11px] font-semibold text-[#1E1340] dark:text-[#E5E0F7]">
                Official Google Android Test Ad Unit ID:
              </p>
              <code className="block text-[11px] font-mono-code text-[#6C4FE0] dark:text-[#A994FF] break-all">
                {ADMOB_OFFICIAL_TEST_REWARDED_AD_UNIT_ID}
              </code>
              <div className="pt-1.5">
                <p className="text-[11px] text-[#554E6E] dark:text-[#B3AEC4] mb-1.5">
                  Test Outcome Scenario (Dev Preview):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(
                    [
                      ['NORMAL', 'Full Test Ad'],
                      ['LOAD_FAILED', 'Load Failure'],
                      ['SHOW_FAILED', 'Show Failure'],
                      ['OFFLINE', 'Offline Mode'],
                    ] as [SimulatedOutcomeMode, string][]
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setOutcomeMode(id)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                        outcomeMode === id
                          ? 'border-[#6C4FE0] bg-[#6C4FE0] text-white'
                          : 'border-[#E6DFD3] dark:border-[#2E3452] bg-white dark:bg-[#1A1E33] text-[#645F75] dark:text-[#B3AEC4]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#645F75] dark:text-[#B3AEC4] hover:bg-[#F2EEE6] dark:hover:bg-[#242942] cursor-pointer"
              >
                No Thanks, Keep Free Features
              </button>
              <button
                type="button"
                onClick={handleStartOptionalAd}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Watch Optional Rewarded Ad</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3A: LOADING STATE */}
        {step === 'LOADING' && level && (
          <div className="py-8 text-center space-y-3">
            <Loader2 className="w-9 h-9 text-[#6C4FE0] dark:text-[#A994FF] animate-spin mx-auto" />
            <p className="font-display text-base font-semibold">
              Loading Google Test Rewarded Ad...
            </p>
            <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] font-mono-code">
              {ADMOB_OFFICIAL_TEST_REWARDED_AD_UNIT_ID}
            </p>
            <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
              Preparing optional unlock for {level.config.title} ({level.config.durationHours}h)
            </p>
          </div>
        )}

        {/* STEP 3B: ACTIVE GOOGLE TEST REWARDED VIDEO IMPRESSION */}
        {step === 'SHOWING' && level && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-[#1E1340] via-[#256B9A] to-[#36B5C4] p-6 text-white space-y-4">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold bg-white/15 px-2.5 py-1 rounded-lg">
                  <Tv className="w-3.5 h-3.5" />
                  <span>Google AdMob Test Ad</span>
                </span>
                <span className="font-semibold tabular-nums bg-black/25 px-2.5 py-1 rounded-lg">
                  Reward in {secondsLeft}s
                </span>
              </div>

              <div className="py-4 text-center space-y-1.5">
                <p className="font-display text-xl font-semibold">
                  Test Rewarded Video Playing
                </p>
                <p className="text-xs text-white/85">
                  Nice job! Watch until the countdown finishes to trigger OnUserEarnedRewardListener for {level.config.title} ({level.config.durationHours}h).
                </p>
                <p className="text-[11px] font-mono-code text-white/75 pt-1">
                  Unit: {ADMOB_OFFICIAL_TEST_REWARDED_AD_UNIT_ID}
                </p>
              </div>

              {/* Countdown Progress Bar */}
              <div className="h-2 w-full rounded-full bg-white/25 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-1000"
                  style={{
                    width: `${
                      ((TEST_VIDEO_DURATION_SECONDS - secondsLeft) /
                        TEST_VIDEO_DURATION_SECONDS) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-[#645F75] dark:text-[#B3AEC4]">
                Reward not yet granted (ad merely opened).
              </span>
              <button
                type="button"
                onClick={handleCloseAdEarly}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#B84A5E] border border-[#B84A5E]/40 hover:bg-[#B84A5E]/10 cursor-pointer"
              >
                Close Ad Early (Forfeit Reward)
              </button>
            </div>
          </div>
        )}

        {/* STEP 3C: REWARD EARNED */}
        {step === 'REWARD_EARNED' && level && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#E4F7F9] dark:bg-[#163644] p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-[#133A56] dark:text-[#79BCE8] font-display font-semibold">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>
                  {level.config.badgeLabel} · {level.config.title} Unlocked
                </span>
              </div>
              <p className="text-xs text-[#133A56]/90 dark:text-[#B2E3EA] leading-relaxed">
                Confirmed via <code className="font-mono-code">OnUserEarnedRewardListener</code> and persisted locally on your device.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-semibold text-[#133A56] dark:text-[#E4F7F9]">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Expires:{' '}
                    {grantedExpiresAt
                      ? new Date(grantedExpiresAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : `${level.config.durationHours}h from now`}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline access ready</span>
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] cursor-pointer"
              >
                Continue to Feature
              </button>
            </div>
          </div>
        )}

        {/* STEP 3D: DISMISSED EARLY OR FAILED */}
        {(step === 'DISMISSED_EARLY' || step === 'FAILED') && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#FDF0EB] dark:bg-[#3A2220] p-4 flex items-start gap-3 text-xs text-[#7D2E1B] dark:text-[#F6B9A4] leading-relaxed">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">
                  {step === 'DISMISSED_EARLY'
                    ? 'Reward Not Granted — Ad Dismissed Early'
                    : 'Optional Ad Could Not Be Shown'}
                </p>
                <p>{outcomeMessage}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#1E1340] dark:bg-[#2E235C] text-white cursor-pointer"
              >
                Continue Using Free Features
              </button>
              {level && (
                <button
                  type="button"
                  onClick={() => setStep('DISCLOSURE')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#E6DFD3] dark:border-[#2E3452] hover:border-[#6C4FE0] cursor-pointer"
                >
                  Review Unlock Options
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

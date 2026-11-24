import {
  RewardAccessManager,
  RewardLevelConfig,
  RewardLevelId,
  RewardVerificationProvider,
  RewardVerificationReceipt,
} from '../rewards/rewardAccessManager';
import { AdMobRuntimeConfig, resolveAdMobConfig } from './adMobConfig';
import { PrivacyConsentManager } from './privacyConsentManager';

export type RewardedAdLifecyclePhase =
  | 'IDLE'
  | 'CONSENT_REQUIRED'
  | 'LOADING'
  | 'SHOWING'
  | 'REWARD_EARNED'
  | 'DISMISSED_WITHOUT_REWARD'
  | 'LOAD_FAILED'
  | 'SHOW_FAILED';

export interface RewardedAdSessionState {
  phase: RewardedAdLifecyclePhase;
  levelId: RewardLevelId | null;
  adUnitId: string;
  isSdkInitialized: boolean;
  errorCode: number | null;
  message: string | null;
  grantedExpiresAtMillis: number | null;
  rewardType: string | null;
  rewardAmount: number;
}

export interface RewardedAdTransportCallbacks {
  onAdFailedToLoad: (errorCode: number, message: string) => void;
  onAdShowed: () => void;
  onAdFailedToShow: (errorCode: number, message: string) => void;
  onUserEarnedReward: (rewardType: string, rewardAmount: number) => void;
  onAdDismissed: () => void;
}

export interface RewardedAdTransport {
  initializeSdk(): Promise<void>;
  loadAndPresent(
    adUnitId: string,
    callbacks: RewardedAdTransportCallbacks
  ): Promise<void> | void;
}

/**
 * Verifier used exclusively when Google Mobile Ads `OnUserEarnedRewardListener` fires.
 */
export class AdMobSdkRewardVerifier implements RewardVerificationProvider {
  readonly source = 'ADMOB_SDK_CALLBACK' as const;
  readonly isLiveAdSdkIntegrated = true;

  async verifyCompletedReward(
    level: RewardLevelConfig,
    nowMillis: number
  ): Promise<RewardVerificationReceipt> {
    const suffix = Math.random().toString(36).slice(2, 8);
    return {
      verified: true,
      receiptId: `admob_${level.id}_${nowMillis}_${suffix}`,
      source: 'ADMOB_SDK_CALLBACK',
      verifiedAtMillis: nowMillis,
    };
  }
}

/**
 * Independent, testable RewardedAdController mirroring Android's GoogleAdMobRewardedController.
 *
 * STRICT INVARIANTS:
 * 1. Never displays forced or unexpected ads — runs only after explicit user selection.
 * 2. Requires privacy consent (`consentManager.canRequestAds()`) before initializing or requesting ads.
 * 3. Always uses official Google test ad unit ID (`ca-app-pub-3940256099942544/5224354917`) in dev.
 * 4. Grants a reward ONLY inside `onUserEarnedReward` — NEVER on load, open, dismiss-early, or failure.
 * 5. Persists granted rewards locally via `RewardAccessManager` for offline access until expiration.
 */
export class RewardedAdController {
  private readonly config: AdMobRuntimeConfig;
  private readonly consentManager: PrivacyConsentManager;
  private readonly rewardAccessManager: RewardAccessManager;
  private readonly transport: RewardedAdTransport;
  private readonly verifier: RewardVerificationProvider;
  private sdkInitialized = false;
  private state: RewardedAdSessionState;
  private readonly listeners = new Set<(s: RewardedAdSessionState) => void>();

  constructor(options: {
    consentManager: PrivacyConsentManager;
    rewardAccessManager: RewardAccessManager;
    transport: RewardedAdTransport;
    config?: AdMobRuntimeConfig;
    verifier?: RewardVerificationProvider;
  }) {
    this.config = options.config ?? resolveAdMobConfig();
    this.consentManager = options.consentManager;
    this.rewardAccessManager = options.rewardAccessManager;
    this.transport = options.transport;
    this.verifier = options.verifier ?? new AdMobSdkRewardVerifier();
    this.state = {
      phase: 'IDLE',
      levelId: null,
      adUnitId: this.config.rewardedAdUnitId,
      isSdkInitialized: false,
      errorCode: null,
      message: null,
      grantedExpiresAtMillis: null,
      rewardType: null,
      rewardAmount: 0,
    };
  }

  getState(): RewardedAdSessionState {
    return { ...this.state };
  }

  getConfig(): AdMobRuntimeConfig {
    return this.config;
  }

  isSdkInitialized(): boolean {
    return this.sdkInitialized;
  }

  async initializeSdkIfAllowed(): Promise<boolean> {
    if (!this.consentManager.canRequestAds()) {
      return false;
    }
    if (!this.sdkInitialized) {
      await this.transport.initializeSdk();
      this.sdkInitialized = true;
      this.updateState({ isSdkInitialized: true });
    }
    return true;
  }

  async requestAndShowRewardedAd(levelId: RewardLevelId): Promise<void> {
    if (!this.consentManager.canRequestAds()) {
      this.updateState({
        phase: 'CONSENT_REQUIRED',
        levelId,
        errorCode: -100,
        message:
          'Privacy consent is required before loading optional rewarded ads. You can continue using all free self-care features or update your ad privacy choice.',
        grantedExpiresAtMillis: null,
        rewardType: null,
        rewardAmount: 0,
      });
      return;
    }

    await this.initializeSdkIfAllowed();

    this.updateState({
      phase: 'LOADING',
      levelId,
      errorCode: null,
      message: 'Loading optional Google test rewarded video...',
      grantedExpiresAtMillis: null,
      rewardType: null,
      rewardAmount: 0,
    });

    let rewardEarnedThisImpression = false;
    let pendingGrantPromise: Promise<void> | null = null;

    await this.transport.loadAndPresent(this.config.rewardedAdUnitId, {
      onAdFailedToLoad: (errorCode, message) => {
        // Never grant reward on load failure; user keeps all free features seamlessly.
        this.updateState({
          phase: 'LOAD_FAILED',
          levelId,
          errorCode,
          message:
            message ||
            'Could not load optional advertisement right now. You can continue using all free features.',
          grantedExpiresAtMillis: null,
        });
      },
      onAdShowed: () => {
        // Strictly NEVER grant reward when an ad merely opens.
        this.updateState({
          phase: 'SHOWING',
          levelId,
          errorCode: null,
          message: 'Watching optional Google test rewarded advertisement...',
        });
      },
      onAdFailedToShow: (errorCode, message) => {
        // Never grant reward on show failure.
        this.updateState({
          phase: 'SHOW_FAILED',
          levelId,
          errorCode,
          message:
            message ||
            'Unable to display the optional advertisement right now. All free features remain ready.',
          grantedExpiresAtMillis: null,
        });
      },
      onUserEarnedReward: (rewardType, rewardAmount) => {
        // ONLY place where reward access is persisted locally!
        rewardEarnedThisImpression = true;
        pendingGrantPromise = (async () => {
          const result = await this.rewardAccessManager.completeRewardUnlock(
            levelId,
            this.verifier
          );
          if (result.ok && result.grant) {
            this.updateState({
              phase: 'REWARD_EARNED',
              levelId,
              errorCode: null,
              message: 'Reward earned and saved locally for offline access.',
              grantedExpiresAtMillis: result.grant.expiresAtMillis,
              rewardType,
              rewardAmount,
            });
          } else {
            this.updateState({
              phase: 'SHOW_FAILED',
              levelId,
              errorCode: -200,
              message: result.error ?? 'Failed to save reward locally.',
              grantedExpiresAtMillis: null,
            });
          }
        })();
      },
      onAdDismissed: () => {
        if (!rewardEarnedThisImpression) {
          // Dismissed before completion — strictly ZERO reward granted!
          this.updateState({
            phase: 'DISMISSED_WITHOUT_REWARD',
            levelId,
            errorCode: null,
            message:
              'Advertisement was closed before completion. No reward was granted — all free self-care features remain available.',
            grantedExpiresAtMillis: null,
          });
        }
      },
    });

    if (pendingGrantPromise) {
      await pendingGrantPromise;
    }
  }

  reset(): void {
    this.updateState({
      phase: 'IDLE',
      levelId: null,
      errorCode: null,
      message: null,
      grantedExpiresAtMillis: null,
      rewardType: null,
      rewardAmount: 0,
    });
  }

  subscribe(listener: (state: RewardedAdSessionState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<RewardedAdSessionState>): void {
    this.state = { ...this.state, ...partial };
    const snap = { ...this.state };
    this.listeners.forEach((l) => l(snap));
  }
}

/**
 * Isolated Google AdMob configuration for Daily Tide.
 *
 * Strictly enforces official Google Android test ad IDs during development.
 * Never use real production ad unit IDs while testing.
 */
export const ADMOB_OFFICIAL_TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

/** Official Google Android Rewarded Video Test Ad Unit ID. */
export const ADMOB_OFFICIAL_TEST_REWARDED_AD_UNIT_ID =
  'ca-app-pub-3940256099942544/5224354917';

export interface AdMobRuntimeConfig {
  readonly appId: string;
  readonly rewardedAdUnitId: string;
  readonly isTestMode: boolean;
  readonly privacyPolicyNote: string;
}

export function isOfficialTestRewardedAdUnitId(adUnitId: string): boolean {
  return adUnitId === ADMOB_OFFICIAL_TEST_REWARDED_AD_UNIT_ID;
}

/**
 * Resolves development AdMob configuration.
 * Always returns the official Google test rewarded unit ID in non-production builds.
 */
export function resolveAdMobConfig(): AdMobRuntimeConfig {
  return {
    appId: ADMOB_OFFICIAL_TEST_APP_ID,
    rewardedAdUnitId: ADMOB_OFFICIAL_TEST_REWARDED_AD_UNIT_ID,
    isTestMode: true,
    privacyPolicyNote:
      'Personal hydration logs, moods, habits, and journal entries remain strictly local and are never shared with Google AdMob.',
  };
}

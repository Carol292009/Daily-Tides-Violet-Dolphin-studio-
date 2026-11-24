export type RewardLevelId =
  | 'level_1_special_motivation'
  | 'level_2_advanced_reflection'
  | 'level_3_special_challenges'
  | 'level_4_visual_themes'
  | 'level_5_personal_bmi_hydration';

export type RewardAccessStatus = 'LOCKED' | 'UNLOCKED' | 'EXPIRED';

export type RewardHistoryEventType = 'UNLOCKED' | 'RENEWED' | 'EXPIRED';

export type RewardVerificationSource =
  | 'LOCAL_MOCK'
  | 'ADMOB_SDK_CALLBACK'
  | 'SERVER_VERIFIED';

export interface RewardLevelConfig {
  id: RewardLevelId;
  levelNumber: 1 | 2 | 3 | 4 | 5;
  badgeLabel: string;
  title: string;
  featureSummary: string;
  requiredAdsCount: number;
  durationHours: number;
  durationMillis: number;
  linkedRoute: 'motivation' | 'journal' | 'challenges' | 'settings' | 'hydration';
  ctaFeatureLabel: string;
}

export interface RewardAccessGrant {
  levelId: RewardLevelId;
  unlockedAtMillis: number;
  expiresAtMillis: number;
  durationHours: number;
  verificationSource: RewardVerificationSource;
  receiptId: string;
}

export interface RewardHistoryEntry {
  id: string;
  levelId: RewardLevelId;
  levelNumber: 1 | 2 | 3 | 4 | 5;
  title: string;
  eventType: RewardHistoryEventType;
  timestampMillis: number;
  unlockedAtMillis: number;
  expiresAtMillis: number;
  durationHours: number;
  verificationSource: RewardVerificationSource;
  receiptId: string;
}

export interface RewardLevelSnapshot {
  config: RewardLevelConfig;
  status: RewardAccessStatus;
  isUnlocked: boolean;
  unlockedAtMillis: number | null;
  expiresAtMillis: number | null;
  remainingMillis: number;
  remainingFormatted: string;
  lastGrant: RewardAccessGrant | null;
}

export interface RewardAccessPersistedData {
  schemaVersion: 1;
  grants: Partial<Record<RewardLevelId, RewardAccessGrant>>;
  history: RewardHistoryEntry[];
  recordedExpiredReceiptIds: string[];
}

export interface RewardAccessSnapshot {
  evaluatedAtMillis: number;
  isLiveAdSdkIntegrated: boolean;
  verificationMode: RewardVerificationSource;
  levels: RewardLevelSnapshot[];
  unlockedLevelIds: RewardLevelId[];
  history: RewardHistoryEntry[];
}

export interface RewardVerificationReceipt {
  verified: boolean;
  receiptId: string;
  source: RewardVerificationSource;
  verifiedAtMillis: number;
  failureReason?: string;
}

/**
 * Modular verification contract.
 * Phase 1 uses LocalMockRewardVerifier (device clock + local receipts).
 * Later releases can inject a ServerSideRewardVerifier (e.g., SSV / backend receipt check)
 * without rewriting UI screens, feature gates, or local offline storage.
 */
export interface RewardVerificationProvider {
  readonly source: RewardVerificationSource;
  readonly isLiveAdSdkIntegrated: boolean;
  verifyCompletedReward(
    level: RewardLevelConfig,
    nowMillis: number
  ): Promise<RewardVerificationReceipt>;
}

export interface RewardStorageAdapter {
  load(): RewardAccessPersistedData | null;
  save(data: RewardAccessPersistedData): void;
  clear(): void;
}

export type RewardClock = () => number;

export const REWARD_STORAGE_KEY = 'violet_dolphin_daily_tide_rewards_v1';

export const FREE_LEVEL_FEATURES = [
  {
    id: 'free_hydration',
    title: 'Hydration Tracking',
    description: 'Custom water goals, glasses, one-tap logging, history, and daily auto-reset.',
  },
  {
    id: 'free_mood',
    title: 'Daily Mood Check-In',
    description: 'Gentle mood levels, context tags, private notes, and local mood timeline.',
  },
  {
    id: 'free_reflection',
    title: 'Basic Reflection & Self-Appreciation',
    description: 'Guided 5-question reflection, freeform journaling, and Self-Appreciation Vault.',
  },
  {
    id: 'free_motivation',
    title: 'Basic Motivation Library',
    description: 'All 105 original offline motivational messages across 7 personal growth themes.',
  },
  {
    id: 'free_habits',
    title: 'Basic Habit Tracking',
    description: 'Create, edit, complete, pause, and delete personal habits plus Progress Garden.',
  },
] as const;

const HOUR_MS = 60 * 60 * 1000;

/**
 * Configurable Reward Access Catalog.
 * Durations and ad requirements can be tuned centrally here (or hydrated from config later).
 */
export const DEFAULT_REWARD_LEVEL_CONFIGS: RewardLevelConfig[] = [
  {
    id: 'level_1_special_motivation',
    levelNumber: 1,
    badgeLabel: 'Level 1',
    title: 'Special Motivation Collection',
    featureSummary:
      'Unlocks the curated Deep-Focus & Restorative Motivation collection inside Motivation Library.',
    requiredAdsCount: 1,
    durationHours: 2,
    durationMillis: 2 * HOUR_MS,
    linkedRoute: 'motivation',
    ctaFeatureLabel: 'Open Special Motivation',
  },
  {
    id: 'level_2_advanced_reflection',
    levelNumber: 2,
    badgeLabel: 'Level 2',
    title: 'Advanced Reflection Collection',
    featureSummary:
      'Unlocks deep self-awareness prompt packs (Emotional Clarity, Values, Energy Audit, Future Self) in Reflect.',
    requiredAdsCount: 1,
    durationHours: 24,
    durationMillis: 24 * HOUR_MS,
    linkedRoute: 'journal',
    ctaFeatureLabel: 'Open Advanced Reflections',
  },
  {
    id: 'level_3_special_challenges',
    levelNumber: 3,
    badgeLabel: 'Level 3',
    title: 'Special Self-Care Challenges',
    featureSummary:
      'Unlocks curated multi-step restorative challenges (Digital Sunset, Mindful Tea, Grounding Walk) in Daily Quests.',
    requiredAdsCount: 1,
    durationHours: 24,
    durationMillis: 24 * HOUR_MS,
    linkedRoute: 'challenges',
    ctaFeatureLabel: 'Open Special Challenges',
  },
  {
    id: 'level_4_visual_themes',
    levelNumber: 4,
    badgeLabel: 'Level 4',
    title: 'Additional Visual Themes',
    featureSummary:
      'Unlocks Violet Dusk, Midnight Tide, and Aurora Lagoon visual themes for Shareable Cards and studio accents.',
    requiredAdsCount: 1,
    durationHours: 48,
    durationMillis: 48 * HOUR_MS,
    linkedRoute: 'settings',
    ctaFeatureLabel: 'Preview Themes in Cards',
  },
  {
    id: 'level_5_personal_bmi_hydration',
    levelNumber: 5,
    badgeLabel: 'Level 5 · Premium',
    title: 'Personal BMI & Safe Hydration Guide',
    featureSummary:
      'Unlocks your private Height & Weight BMI guide, safe daily Litre/ml water range, pacing schedule, and personalized body benefits in Hydration.',
    requiredAdsCount: 1,
    durationHours: 48,
    durationMillis: 48 * HOUR_MS,
    linkedRoute: 'hydration',
    ctaFeatureLabel: 'Open BMI & Hydration Guide',
  },
];

export function formatRemainingDuration(remainingMillis: number): string {
  if (remainingMillis <= 0) return 'Expired';
  const totalSeconds = Math.floor(remainingMillis / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours >= 24) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

export class LocalMockRewardVerifier implements RewardVerificationProvider {
  readonly source: RewardVerificationSource = 'LOCAL_MOCK';
  readonly isLiveAdSdkIntegrated = false;
  private readonly simulatedDelayMs: number;

  constructor(simulatedDelayMs = 450) {
    this.simulatedDelayMs = simulatedDelayMs;
  }

  async verifyCompletedReward(
    level: RewardLevelConfig,
    nowMillis: number
  ): Promise<RewardVerificationReceipt> {
    if (this.simulatedDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.simulatedDelayMs));
    }
    return {
      verified: true,
      receiptId: `mock_rcpt_L${level.levelNumber}_${nowMillis}_${Math.random().toString(36).slice(2, 7)}`,
      source: 'LOCAL_MOCK',
      verifiedAtMillis: nowMillis,
    };
  }
}

export class LocalStorageRewardAdapter implements RewardStorageAdapter {
  private readonly storageKey: string;

  constructor(storageKey = REWARD_STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  load(): RewardAccessPersistedData | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as RewardAccessPersistedData;
      if (!parsed || typeof parsed !== 'object' || !parsed.grants) return null;
      return {
        schemaVersion: 1,
        grants: parsed.grants ?? {},
        history: Array.isArray(parsed.history) ? parsed.history : [],
        recordedExpiredReceiptIds: Array.isArray(parsed.recordedExpiredReceiptIds)
          ? parsed.recordedExpiredReceiptIds
          : [],
      };
    } catch {
      return null;
    }
  }

  save(data: RewardAccessPersistedData): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // Fail gracefully if storage quota is full
    }
  }

  clear(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Ignore storage errors
    }
  }
}

export class InMemoryRewardStorageAdapter implements RewardStorageAdapter {
  private data: RewardAccessPersistedData | null = null;

  load(): RewardAccessPersistedData | null {
    return this.data ? JSON.parse(JSON.stringify(this.data)) : null;
  }

  save(data: RewardAccessPersistedData): void {
    this.data = JSON.parse(JSON.stringify(data));
  }

  clear(): void {
    this.data = null;
  }
}

export interface RewardAccessManagerOptions {
  configs?: RewardLevelConfig[];
  storage?: RewardStorageAdapter;
  verifier?: RewardVerificationProvider;
  clock?: RewardClock;
}

/**
 * Independent, configurable, offline-capable RewardAccessManager.
 *
 * Security & Architecture Note:
 * This initial release persists reward grants locally and evaluates expirations using device time.
 * Locally stored reward records and device clocks are NOT tamper-proof.
 * Verification is isolated behind RewardVerificationProvider so server-side reward verification
 * can be introduced later without rewriting application screens or feature checks.
 */
export class RewardAccessManager {
  private readonly configs: RewardLevelConfig[];
  private readonly storage: RewardStorageAdapter;
  private readonly verifier: RewardVerificationProvider;
  private readonly clock: RewardClock;
  private readonly listeners = new Set<(snapshot: RewardAccessSnapshot) => void>();
  private state: RewardAccessPersistedData;

  constructor(options: RewardAccessManagerOptions = {}) {
    this.configs = options.configs ?? DEFAULT_REWARD_LEVEL_CONFIGS;
    this.storage = options.storage ?? new LocalStorageRewardAdapter();
    this.verifier = options.verifier ?? new LocalMockRewardVerifier();
    this.clock = options.clock ?? (() => Date.now());
    this.state = this.storage.load() ?? this.createEmptyPersistedState();
    this.sweepExpirations();
  }

  private createEmptyPersistedState(): RewardAccessPersistedData {
    return {
      schemaVersion: 1,
      grants: {},
      history: [],
      recordedExpiredReceiptIds: [],
    };
  }

  getConfigs(): RewardLevelConfig[] {
    return this.configs;
  }

  getConfig(levelId: RewardLevelId): RewardLevelConfig {
    const found = this.configs.find((c) => c.id === levelId);
    if (!found) throw new Error(`Unknown reward level: ${levelId}`);
    return found;
  }

  subscribe(listener: (snapshot: RewardAccessSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  private persist(): void {
    this.storage.save(this.state);
  }

  /**
   * Automatically transitions any expired grants to EXPIRED state and appends a single
   * EXPIRED record to local reward history per expired receipt.
   */
  sweepExpirations(): boolean {
    const now = this.clock();
    let changed = false;

    for (const config of this.configs) {
      const grant = this.state.grants[config.id];
      if (!grant) continue;

      if (now >= grant.expiresAtMillis) {
        if (!this.state.recordedExpiredReceiptIds.includes(grant.receiptId)) {
          this.state.recordedExpiredReceiptIds.push(grant.receiptId);
          this.state.history.unshift({
            id: `rh_exp_${grant.receiptId}`,
            levelId: config.id,
            levelNumber: config.levelNumber,
            title: config.title,
            eventType: 'EXPIRED',
            timestampMillis: grant.expiresAtMillis,
            unlockedAtMillis: grant.unlockedAtMillis,
            expiresAtMillis: grant.expiresAtMillis,
            durationHours: grant.durationHours,
            verificationSource: grant.verificationSource,
            receiptId: grant.receiptId,
          });
          this.state.history = this.state.history.slice(0, 100);
          changed = true;
        }
      }
    }

    if (changed) {
      this.persist();
    }
    return changed;
  }

  getLevelSnapshot(levelId: RewardLevelId): RewardLevelSnapshot {
    this.sweepExpirations();
    const now = this.clock();
    const config = this.getConfig(levelId);
    const grant = this.state.grants[levelId] ?? null;

    if (!grant) {
      return {
        config,
        status: 'LOCKED',
        isUnlocked: false,
        unlockedAtMillis: null,
        expiresAtMillis: null,
        remainingMillis: 0,
        remainingFormatted: 'Locked',
        lastGrant: null,
      };
    }

    const remainingMillis = Math.max(grant.expiresAtMillis - now, 0);
    const isUnlocked = remainingMillis > 0;

    return {
      config,
      status: isUnlocked ? 'UNLOCKED' : 'EXPIRED',
      isUnlocked,
      unlockedAtMillis: grant.unlockedAtMillis,
      expiresAtMillis: grant.expiresAtMillis,
      remainingMillis,
      remainingFormatted: isUnlocked ? formatRemainingDuration(remainingMillis) : 'Expired',
      lastGrant: grant,
    };
  }

  isFeatureUnlocked(levelId: RewardLevelId): boolean {
    return this.getLevelSnapshot(levelId).isUnlocked;
  }

  getSnapshot(): RewardAccessSnapshot {
    this.sweepExpirations();
    const now = this.clock();
    const levels = this.configs.map((c) => this.getLevelSnapshot(c.id));
    const unlockedLevelIds = levels.filter((l) => l.isUnlocked).map((l) => l.config.id);

    return {
      evaluatedAtMillis: now,
      isLiveAdSdkIntegrated: this.verifier.isLiveAdSdkIntegrated,
      verificationMode: this.verifier.source,
      levels,
      unlockedLevelIds,
      history: [...this.state.history],
    };
  }

  /**
   * Simulates (Phase 1) or verifies (Phase 2+) a completed rewarded ad and grants timed local access.
   * Works offline immediately after unlocking.
   */
  async completeRewardUnlock(
    levelId: RewardLevelId,
    verifierOverride?: RewardVerificationProvider
  ): Promise<{
    ok: boolean;
    grant?: RewardAccessGrant;
    error?: string;
  }> {
    const config = this.getConfig(levelId);
    const now = this.clock();
    const activeVerifier = verifierOverride ?? this.verifier;

    const receipt = await activeVerifier.verifyCompletedReward(config, now);
    if (!receipt.verified) {
      return {
        ok: false,
        error: receipt.failureReason ?? 'Reward verification did not complete.',
      };
    }

    const unlockedAtMillis = this.clock();
    const previousGrant = this.state.grants[levelId];
    const wasActive = previousGrant !== undefined && previousGrant.expiresAtMillis > unlockedAtMillis;
    const expiresAtMillis = unlockedAtMillis + config.durationMillis;

    const grant: RewardAccessGrant = {
      levelId,
      unlockedAtMillis,
      expiresAtMillis,
      durationHours: config.durationHours,
      verificationSource: receipt.source,
      receiptId: receipt.receiptId,
    };

    this.state.grants[levelId] = grant;
    this.state.history.unshift({
      id: `rh_${receipt.receiptId}`,
      levelId,
      levelNumber: config.levelNumber,
      title: config.title,
      eventType: wasActive ? 'RENEWED' : 'UNLOCKED',
      timestampMillis: unlockedAtMillis,
      unlockedAtMillis,
      expiresAtMillis,
      durationHours: config.durationHours,
      verificationSource: receipt.source,
      receiptId: receipt.receiptId,
    });
    this.state.history = this.state.history.slice(0, 100);

    this.persist();
    this.emit();

    return { ok: true, grant };
  }

  /**
   * Development & test helper: expires an active grant immediately so expiration UX can be verified.
   */
  expireLevelNowForTesting(levelId: RewardLevelId): void {
    const grant = this.state.grants[levelId];
    if (!grant) return;
    const now = this.clock();
    this.state.grants[levelId] = {
      ...grant,
      expiresAtMillis: Math.min(grant.expiresAtMillis, now),
    };
    this.sweepExpirations();
    this.persist();
    this.emit();
  }

  /**
   * Clears all locally persisted grants and reward history (invoked on Clear Application Data).
   */
  clearAllRewardData(): void {
    this.state = this.createEmptyPersistedState();
    this.storage.clear();
    this.emit();
  }

  /**
   * Exports raw persisted reward records for local JSON backup compatibility.
   */
  exportPersistedData(): RewardAccessPersistedData {
    return JSON.parse(JSON.stringify(this.state));
  }
}

export const defaultRewardAccessManager = new RewardAccessManager();

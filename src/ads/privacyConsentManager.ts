/**
 * Google User Messaging Platform (UMP)-aligned Privacy Consent Manager.
 *
 * Kept strictly isolated inside /src/ads/ so core self-care features never depend on
 * advertising or consent status. Declining ads never blocks Free Level functionality.
 */

export type PrivacyConsentStatus =
  | 'UNKNOWN'
  | 'OBTAINED_PERSONALIZED'
  | 'OBTAINED_NON_PERSONALIZED'
  | 'DECLINED';

export interface PrivacyConsentState {
  status: PrivacyConsentStatus;
  canRequestAds: boolean;
  nonPersonalizedOnly: boolean;
  updatedAtMillis: number | null;
  statusLabel: string;
}

export interface PrivacyConsentStorage {
  load(): { status: PrivacyConsentStatus; updatedAtMillis: number | null } | null;
  save(data: { status: PrivacyConsentStatus; updatedAtMillis: number | null }): void;
  clear(): void;
}

export const PRIVACY_CONSENT_STORAGE_KEY = 'violet_dolphin_daily_tide_ump_consent_v1';

export class LocalStoragePrivacyConsentStorage implements PrivacyConsentStorage {
  load(): { status: PrivacyConsentStatus; updatedAtMillis: number | null } | null {
    try {
      const raw = localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<{
        status: PrivacyConsentStatus;
        updatedAtMillis: number | null;
      }>;
      if (
        parsed.status === 'UNKNOWN' ||
        parsed.status === 'OBTAINED_PERSONALIZED' ||
        parsed.status === 'OBTAINED_NON_PERSONALIZED' ||
        parsed.status === 'DECLINED'
      ) {
        return {
          status: parsed.status,
          updatedAtMillis:
            typeof parsed.updatedAtMillis === 'number' ? parsed.updatedAtMillis : null,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  save(data: { status: PrivacyConsentStatus; updatedAtMillis: number | null }): void {
    try {
      localStorage.setItem(PRIVACY_CONSENT_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage quota errors
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(PRIVACY_CONSENT_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }
}

export class InMemoryPrivacyConsentStorage implements PrivacyConsentStorage {
  private value: { status: PrivacyConsentStatus; updatedAtMillis: number | null } | null = null;
  load() {
    return this.value ? { ...this.value } : null;
  }
  save(data: { status: PrivacyConsentStatus; updatedAtMillis: number | null }) {
    this.value = { ...data };
  }
  clear() {
    this.value = null;
  }
}

function buildConsentState(
  status: PrivacyConsentStatus,
  updatedAtMillis: number | null
): PrivacyConsentState {
  switch (status) {
    case 'OBTAINED_PERSONALIZED':
      return {
        status,
        canRequestAds: true,
        nonPersonalizedOnly: false,
        updatedAtMillis,
        statusLabel: 'Consent obtained (Personalized optional ads)',
      };
    case 'OBTAINED_NON_PERSONALIZED':
      return {
        status,
        canRequestAds: true,
        nonPersonalizedOnly: true,
        updatedAtMillis,
        statusLabel: 'Consent obtained (Non-personalized ads only)',
      };
    case 'DECLINED':
      return {
        status,
        canRequestAds: false,
        nonPersonalizedOnly: true,
        updatedAtMillis,
        statusLabel: 'Ads declined (All Free Level features active)',
      };
    default:
      return {
        status: 'UNKNOWN',
        canRequestAds: false,
        nonPersonalizedOnly: true,
        updatedAtMillis,
        statusLabel: 'Privacy choice needed before optional ads',
      };
  }
}

export class PrivacyConsentManager {
  private readonly storage: PrivacyConsentStorage;
  private readonly clock: () => number;
  private readonly listeners = new Set<(state: PrivacyConsentState) => void>();

  constructor(options?: {
    storage?: PrivacyConsentStorage;
    clock?: () => number;
  }) {
    this.storage = options?.storage ?? new LocalStoragePrivacyConsentStorage();
    this.clock = options?.clock ?? (() => Date.now());
  }

  getState(): PrivacyConsentState {
    const saved = this.storage.load();
    return buildConsentState(saved?.status ?? 'UNKNOWN', saved?.updatedAtMillis ?? null);
  }

  canRequestAds(): boolean {
    return this.getState().canRequestAds;
  }

  setConsentChoice(choice: Exclude<PrivacyConsentStatus, 'UNKNOWN'>): PrivacyConsentState {
    const now = this.clock();
    this.storage.save({ status: choice, updatedAtMillis: now });
    const next = buildConsentState(choice, now);
    this.emit(next);
    return next;
  }

  resetConsent(): PrivacyConsentState {
    this.storage.clear();
    const next = buildConsentState('UNKNOWN', null);
    this.emit(next);
    return next;
  }

  subscribe(listener: (state: PrivacyConsentState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(state: PrivacyConsentState): void {
    this.listeners.forEach((l) => l(state));
  }
}

export const defaultPrivacyConsentManager = new PrivacyConsentManager();

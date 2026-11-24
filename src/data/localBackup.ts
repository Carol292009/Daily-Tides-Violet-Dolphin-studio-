import {
  AchievementBadge,
  AppreciationAnswer,
  DailyQuestId,
  DailyTidePersistedState,
  HabitItem,
  HabitTimeOfDay,
  JournalEntry,
  MeasurementUnit,
  MoodCheckIn,
  PositiveThoughtEntry,
  ReminderFrequency,
  ThemeMode,
  WaterLog,
  WaterVessel,
} from '../types/dailyTide';
import {
  CURATED_CHALLENGES,
  MOTIVATION_LIBRARY,
  createDefaultBadges,
  createDefaultReminderSchedule,
  evaluateBadgesLocally,
  getTodayKey,
  reconcileForDate,
} from './localStore';

export const BACKUP_SCHEMA_VERSION = 1;
const MAX_BACKUP_BYTES = 5 * 1024 * 1024; // 5 MB safety guard

export interface DailyTideBackupEnvelope {
  app: 'Daily Tide';
  studio: 'Violet Dolphin Studio';
  packageId: 'com.violetdolphinstudio.dailytide';
  schemaVersion: number;
  exportedAtIso: string;
  offlineOnly: true;
  data: DailyTidePersistedState;
}

export interface BackupImportSummary {
  waterLogs: number;
  moodCheckIns: number;
  journalEntries: number;
  appreciationAnswers: number;
  habits: number;
  positiveThoughts: number;
}

export type BackupImportResult =
  | { ok: true; state: DailyTidePersistedState; summary: BackupImportSummary }
  | { ok: false; error: string };

const VALID_FREQUENCIES: Set<ReminderFrequency> = new Set([
  'DAILY',
  'WEEKDAYS',
  'EVERY_2_DAYS',
  'TWICE_DAILY',
  'WEEKLY',
]);

const VALID_HABIT_SLOTS: Set<HabitTimeOfDay> = new Set([
  'Morning',
  'Afternoon',
  'Evening',
  'Anytime',
]);

const VALID_QUEST_IDS: Set<DailyQuestId> = new Set([
  'drink_wake_water',
  'appreciate_three',
  'reflect_five_min',
  'complete_habit',
  'positive_thought',
]);

function isPlainRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function asString(val: unknown, fallback = '', maxLen = 5000): string {
  if (typeof val !== 'string') return fallback;
  return val.slice(0, maxLen);
}

function asNumber(val: unknown, fallback: number, min?: number, max?: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  let out = val;
  if (min !== undefined) out = Math.max(min, out);
  if (max !== undefined) out = Math.min(max, out);
  return out;
}

function sanitizeTimeHHMM(val: unknown, fallback: string): string {
  if (typeof val !== 'string') return fallback;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(val.trim());
  return match ? `${match[1]}:${match[2]}` : fallback;
}

function sanitizeFrequency(val: unknown, fallback: ReminderFrequency): ReminderFrequency {
  return typeof val === 'string' && VALID_FREQUENCIES.has(val as ReminderFrequency)
    ? (val as ReminderFrequency)
    : fallback;
}

/**
 * Serializes all local user data into a self-contained, human-readable JSON backup file.
 * Runs 100% locally in memory — zero network calls.
 */
export function exportDailyTideBackupJson(state: DailyTidePersistedState): string {
  const envelope: DailyTideBackupEnvelope = {
    app: 'Daily Tide',
    studio: 'Violet Dolphin Studio',
    packageId: 'com.violetdolphinstudio.dailytide',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAtIso: new Date().toISOString(),
    offlineOnly: true,
    data: state,
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Triggers a purely local browser file download of the JSON backup (works in airplane mode).
 */
export function downloadLocalBackupFile(state: DailyTidePersistedState): string {
  const json = exportDailyTideBackupJson(state);
  const filename = `daily-tide-backup-${getTodayKey()}.json`;
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}

/**
 * Strictly validates and sanitizes an imported local JSON backup before committing it to device storage.
 */
export function parseAndValidateDailyTideBackup(rawJson: string): BackupImportResult {
  if (typeof rawJson !== 'string' || !rawJson.trim()) {
    return { ok: false, error: 'Backup file is empty.' };
  }
  if (rawJson.length > MAX_BACKUP_BYTES) {
    return { ok: false, error: 'Backup file exceeds the 5 MB local safety limit.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { ok: false, error: 'Invalid JSON syntax. Please choose a valid Daily Tide backup file.' };
  }

  if (!isPlainRecord(parsed)) {
    return { ok: false, error: 'Backup file structure is not recognized.' };
  }

  // Support both wrapped DailyTideBackupEnvelope and raw DailyTidePersistedState
  let payload: Record<string, unknown>;
  if ('data' in parsed && isPlainRecord(parsed.data)) {
    if (
      parsed.packageId !== undefined &&
      parsed.packageId !== 'com.violetdolphinstudio.dailytide'
    ) {
      return { ok: false, error: 'This backup belongs to a different application.' };
    }
    payload = parsed.data;
  } else {
    payload = parsed;
  }

  if (!isPlainRecord(payload.settings)) {
    return { ok: false, error: 'Backup is missing Daily Tide settings metadata.' };
  }

  const rawSettings = payload.settings;
  const rawSched = isPlainRecord(rawSettings.reminderSchedule)
    ? rawSettings.reminderSchedule
    : null;
  const defaults = createDefaultReminderSchedule(false);

  const rawWaterSched = rawSched && isPlainRecord(rawSched.water) ? rawSched.water : null;
  const rawReflSched = rawSched && isPlainRecord(rawSched.reflection) ? rawSched.reflection : null;
  const rawHabitSched = rawSched && isPlainRecord(rawSched.habits) ? rawSched.habits : null;
  const rawSelfCareSched =
    rawSched && isPlainRecord(rawSched.selfCareCheckIn) ? rawSched.selfCareCheckIn : null;
  const rawDailyUseSched =
    rawSched && isPlainRecord(rawSched.dailyUse) ? rawSched.dailyUse : null;
  const rawPostUseFeedback =
    rawSched && isPlainRecord(rawSched.postUseFeedback) ? rawSched.postUseFeedback : null;

  const waterEnabled =
    typeof rawWaterSched?.enabled === 'boolean'
      ? rawWaterSched.enabled
      : Boolean(rawSettings.remindersEnabled);
  const waterInterval = asNumber(
    rawWaterSched?.intervalMinutes ?? rawSettings.reminderIntervalMinutes,
    120,
    30,
    360
  );

  const unit: MeasurementUnit =
    rawSettings.unit === 'OZ' ? 'OZ' : rawSettings.unit === 'L' ? 'L' : 'ML';
  const themeMode: ThemeMode =
    rawSettings.themeMode === 'MIDNIGHT_TIDE' ? 'MIDNIGHT_TIDE' : 'WARM_IVORY';

  const rawBody = isPlainRecord(rawSettings.bodyMetrics) ? rawSettings.bodyMetrics : null;
  const sanitizedBodyMetrics = rawBody
    ? {
        heightCm: Math.round(asNumber(rawBody.heightCm, 168, 100, 240)),
        weightKg: Number(asNumber(rawBody.weightKg, 65, 30, 250).toFixed(1)),
        activityLevel:
          rawBody.activityLevel === 'LIGHT' ||
          rawBody.activityLevel === 'MODERATE' ||
          rawBody.activityLevel === 'ACTIVE'
            ? (rawBody.activityLevel as 'LIGHT' | 'MODERATE' | 'ACTIVE')
            : ('MODERATE' as const),
        climate:
          rawBody.climate === 'COOL' ||
          rawBody.climate === 'TEMPERATE' ||
          rawBody.climate === 'WARM'
            ? (rawBody.climate as 'COOL' | 'TEMPERATE' | 'WARM')
            : ('TEMPERATE' as const),
        measurementSystem:
          rawBody.measurementSystem === 'IMPERIAL'
            ? ('IMPERIAL' as const)
            : ('METRIC' as const),
      }
    : undefined;

  const vessels: WaterVessel[] = Array.isArray(payload.vessels)
    ? payload.vessels
        .filter(isPlainRecord)
        .map((v, idx) => ({
          id: asString(v.id, `v_imp_${idx}`, 80),
          name: asString(v.name, 'Glass', 60).trim() || 'Glass',
          volumeMl: Math.round(asNumber(v.volumeMl, 250, 30, 3000)),
          isDefault: Boolean(v.isDefault),
        }))
        .slice(0, 30)
    : [];

  const safeVessels: WaterVessel[] =
    vessels.length > 0
      ? vessels
      : [
          { id: 'v_cup', name: 'Small Cup', volumeMl: 150, isDefault: false },
          { id: 'v_glass', name: 'Glass', volumeMl: 250, isDefault: true },
          { id: 'v_bottle', name: 'Bottle', volumeMl: 500, isDefault: false },
        ];

  const waterLogs: WaterLog[] = Array.isArray(payload.waterLogs)
    ? payload.waterLogs
        .filter(isPlainRecord)
        .map((l, idx) => ({
          id: asString(l.id, `wl_imp_${idx}`, 80),
          dateKey: asString(l.dateKey, getTodayKey(), 20),
          loggedAtMillis: Math.round(asNumber(l.loggedAtMillis, Date.now(), 0)),
          amountMl: Math.round(asNumber(l.amountMl, 250, 10, 5000)),
          vesselName: asString(l.vesselName, 'Glass', 60),
        }))
        .slice(0, 10_000)
    : [];

  const moodCheckIns: MoodCheckIn[] = Array.isArray(payload.moodCheckIns)
    ? payload.moodCheckIns
        .filter(isPlainRecord)
        .map((m, idx) => {
          const levelNum = Math.round(asNumber(m.moodLevel, 3, 1, 5)) as 1 | 2 | 3 | 4 | 5;
          return {
            id: asString(m.id, `mc_imp_${idx}`, 80),
            dateKey: asString(m.dateKey, getTodayKey(), 20),
            createdAtMillis: Math.round(asNumber(m.createdAtMillis, Date.now(), 0)),
            moodLevel: levelNum,
            tags: Array.isArray(m.tags)
              ? m.tags.filter((t): t is string => typeof t === 'string').slice(0, 12)
              : [],
            note: asString(m.note, '', 1000),
          };
        })
        .slice(0, 5000)
    : [];

  const journalEntries: JournalEntry[] = Array.isArray(payload.journalEntries)
    ? payload.journalEntries
        .filter(isPlainRecord)
        .map((j, idx) => {
          const rawGuided = isPlainRecord(j.guidedResponses) ? j.guidedResponses : undefined;
          const rawMood =
            typeof j.moodLevel === 'number' && j.moodLevel >= 1 && j.moodLevel <= 5
              ? (Math.round(j.moodLevel) as 1 | 2 | 3 | 4 | 5)
              : undefined;
          return {
            id: asString(j.id, `je_imp_${idx}`, 80),
            dateKey: asString(j.dateKey, getTodayKey(), 20),
            createdAtMillis: Math.round(asNumber(j.createdAtMillis, Date.now(), 0)),
            title: asString(j.title, 'Untitled Reflection', 200),
            body: asString(j.body, '', 20_000),
            moodLevel: rawMood,
            guidedResponses: rawGuided
              ? {
                  happyToday: asString(rawGuided.happyToday, '', 2000) || undefined,
                  accomplished: asString(rawGuided.accomplished, '', 2000) || undefined,
                  gratefulFor: asString(rawGuided.gratefulFor, '', 2000) || undefined,
                  learnedToday: asString(rawGuided.learnedToday, '', 2000) || undefined,
                  improveTomorrow: asString(rawGuided.improveTomorrow, '', 2000) || undefined,
                }
              : undefined,
          };
        })
        .slice(0, 5000)
    : [];

  const appreciationAnswers: AppreciationAnswer[] = Array.isArray(payload.appreciationAnswers)
    ? payload.appreciationAnswers
        .filter(isPlainRecord)
        .map((a, idx) => ({
          id: asString(a.id, `aa_imp_${idx}`, 80),
          dateKey: asString(a.dateKey, getTodayKey(), 20),
          promptId: asString(a.promptId, 'pr_custom', 80),
          promptText: asString(a.promptText, 'Something I appreciate today', 300),
          answerText: asString(a.answerText, '', 2000),
          createdAtMillis: Math.round(asNumber(a.createdAtMillis, Date.now(), 0)),
        }))
        .filter((a) => a.answerText.trim().length > 0)
        .slice(0, 5000)
    : [];

  const habits: HabitItem[] = Array.isArray(payload.habits)
    ? payload.habits
        .filter(isPlainRecord)
        .map((h, idx) => ({
          id: asString(h.id, `hb_imp_${idx}`, 80),
          title: asString(h.title, 'Daily Habit', 120).trim() || 'Daily Habit',
          description: asString(h.description, '', 400),
          timeOfDay: VALID_HABIT_SLOTS.has(h.timeOfDay as HabitTimeOfDay)
            ? (h.timeOfDay as HabitTimeOfDay)
            : 'Anytime',
          isPaused: Boolean(h.isPaused),
          completedDates: Array.isArray(h.completedDates)
            ? Array.from(
                new Set(h.completedDates.filter((d): d is string => typeof d === 'string'))
              ).slice(0, 1000)
            : [],
        }))
        .slice(0, 200)
    : [];

  const positiveThoughts: PositiveThoughtEntry[] = Array.isArray(payload.positiveThoughts)
    ? payload.positiveThoughts
        .filter(isPlainRecord)
        .map((pt, idx) => ({
          id: asString(pt.id, `pt_imp_${idx}`, 80),
          dateKey: asString(pt.dateKey, getTodayKey(), 20),
          text: asString(pt.text, '', 1000),
          createdAtMillis: Math.round(asNumber(pt.createdAtMillis, Date.now(), 0)),
        }))
        .filter((pt) => pt.text.trim().length > 0)
        .slice(0, 5000)
    : [];

  const questHistory: Record<string, DailyQuestId[]> = {};
  if (isPlainRecord(payload.questHistory)) {
    Object.entries(payload.questHistory).forEach(([dateKey, rawList]) => {
      if (Array.isArray(rawList)) {
        const cleaned = rawList.filter(
          (id): id is DailyQuestId =>
            typeof id === 'string' && VALID_QUEST_IDS.has(id as DailyQuestId)
        );
        if (cleaned.length > 0) {
          questHistory[dateKey.slice(0, 20)] = Array.from(new Set(cleaned));
        }
      }
    });
  }

  const validAffIds = new Set(MOTIVATION_LIBRARY.map((a) => a.id));
  const favoriteAffirmationIds = Array.isArray(payload.favoriteAffirmationIds)
    ? Array.from(
        new Set(
          payload.favoriteAffirmationIds.filter(
            (id): id is string => typeof id === 'string' && validAffIds.has(id)
          )
        )
      )
    : [];

  const defaultBadges = createDefaultBadges();
  const importedBadgeMap = new Map<string, Record<string, unknown>>();
  if (Array.isArray(payload.badges)) {
    payload.badges.filter(isPlainRecord).forEach((b) => {
      if (typeof b.id === 'string') importedBadgeMap.set(b.id, b);
    });
  }
  const mergedBadges: AchievementBadge[] = defaultBadges.map((base) => {
    const found = importedBadgeMap.get(base.id);
    if (!found) return base;
    return {
      ...base,
      unlockedAtMillis:
        typeof found.unlockedAtMillis === 'number' && Number.isFinite(found.unlockedAtMillis)
          ? found.unlockedAtMillis
          : null,
      progressCurrent: Math.round(asNumber(found.progressCurrent, 0, 0, base.progressTarget)),
    };
  });

  const today = getTodayKey();
  const rawChallenge = isPlainRecord(payload.dailyChallenge) ? payload.dailyChallenge : null;
  const challengeId =
    rawChallenge &&
    typeof rawChallenge.challengeId === 'string' &&
    CURATED_CHALLENGES.some((c) => c.id === rawChallenge.challengeId)
      ? rawChallenge.challengeId
      : CURATED_CHALLENGES[0].id;
  const challengeStatus =
    rawChallenge?.status === 'COMPLETED' || rawChallenge?.status === 'SKIPPED'
      ? rawChallenge.status
      : 'ASSIGNED';

  const restoredBase: DailyTidePersistedState = {
    settings: {
      hasCompletedOnboarding: Boolean(rawSettings.hasCompletedOnboarding),
      hasSeenQuickGuide: Boolean(rawSettings.hasSeenQuickGuide),
      displayName: asString(rawSettings.displayName, '', 80).trim(),
      unit,
      dailyWaterGoalMl: Math.round(asNumber(rawSettings.dailyWaterGoalMl, 2000, 500, 6000)),
      themeMode,
      remindersEnabled: waterEnabled,
      reminderIntervalMinutes: Math.round(waterInterval),
      quietHoursStart: sanitizeTimeHHMM(rawSettings.quietHoursStart, '22:00'),
      quietHoursEnd: sanitizeTimeHHMM(rawSettings.quietHoursEnd, '07:30'),
      reminderSchedule: {
        water: {
          enabled: waterEnabled,
          intervalMinutes: Math.round(waterInterval),
        },
        reflection: {
          enabled: Boolean(rawReflSched?.enabled),
          frequency: sanitizeFrequency(rawReflSched?.frequency, defaults.reflection.frequency),
          preferredTime: sanitizeTimeHHMM(
            rawReflSched?.preferredTime,
            defaults.reflection.preferredTime
          ),
        },
        habits: {
          enabled: Boolean(rawHabitSched?.enabled),
          frequency: sanitizeFrequency(rawHabitSched?.frequency, defaults.habits.frequency),
          preferredTime: sanitizeTimeHHMM(
            rawHabitSched?.preferredTime,
            defaults.habits.preferredTime
          ),
        },
        selfCareCheckIn: {
          enabled: Boolean(rawSelfCareSched?.enabled),
          frequency: sanitizeFrequency(
            rawSelfCareSched?.frequency,
            defaults.selfCareCheckIn.frequency
          ),
          preferredTime: sanitizeTimeHHMM(
            rawSelfCareSched?.preferredTime,
            defaults.selfCareCheckIn.preferredTime
          ),
        },
        dailyUse: {
          enabled: Boolean(rawDailyUseSched?.enabled),
          frequency: sanitizeFrequency(rawDailyUseSched?.frequency, defaults.dailyUse.frequency),
          preferredTime: sanitizeTimeHHMM(
            rawDailyUseSched?.preferredTime,
            defaults.dailyUse.preferredTime
          ),
        },
        postUseFeedback: {
          enabled:
            typeof rawPostUseFeedback?.enabled === 'boolean'
              ? rawPostUseFeedback.enabled
              : defaults.postUseFeedback.enabled,
          hasBeenSent: Boolean(rawPostUseFeedback?.hasBeenSent),
          delayMinutes: Math.round(asNumber(rawPostUseFeedback?.delayMinutes, 30, 5, 180)),
        },
      },
      unlockedRewardIds: Array.isArray(rawSettings.unlockedRewardIds)
        ? Array.from(
            new Set(
              rawSettings.unlockedRewardIds.filter((id): id is string => typeof id === 'string')
            )
          ).slice(0, 50)
        : [],
      ...(sanitizedBodyMetrics ? { bodyMetrics: sanitizedBodyMetrics } : {}),
    },
    vessels: safeVessels,
    waterLogs,
    moodCheckIns,
    journalEntries,
    appreciationAnswers,
    favoriteAffirmationIds,
    dailyChallenge: {
      dateKey: asString(rawChallenge?.dateKey, today, 20),
      challengeId,
      status: challengeStatus,
      swapsUsed: Math.round(asNumber(rawChallenge?.swapsUsed, 0, 0, 10)),
    },
    questHistory,
    positiveThoughts,
    streakRestartedFromDateKey:
      typeof payload.streakRestartedFromDateKey === 'string'
        ? payload.streakRestartedFromDateKey.slice(0, 20)
        : null,
    promptIndexOffset: Math.round(asNumber(payload.promptIndexOffset, 0, 0, 10_000)),
    habits,
    badges: mergedBadges,
    weeklySummary: null,
    lastActiveDateKey: today,
  };

  const reconciled = reconcileForDate(restoredBase, today);
  const finalState: DailyTidePersistedState = {
    ...reconciled,
    badges: evaluateBadgesLocally(reconciled),
  };

  return {
    ok: true,
    state: finalState,
    summary: {
      waterLogs: finalState.waterLogs.length,
      moodCheckIns: finalState.moodCheckIns.length,
      journalEntries: finalState.journalEntries.length,
      appreciationAnswers: finalState.appreciationAnswers.length,
      habits: finalState.habits.length,
      positiveThoughts: finalState.positiveThoughts.length,
    },
  };
}

export function isTimeWithinQuietHours(
  timeHHMM: string,
  quietStart: string,
  quietEnd: string
): boolean {
  const toMin = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
  };
  const nowMin = toMin(timeHHMM);
  const startMin = toMin(quietStart);
  const endMin = toMin(quietEnd);
  if (startMin < endMin) {
    return nowMin >= startMin && nowMin < endMin;
  }
  return nowMin >= startMin || nowMin < endMin;
}

export type BrowserNotificationPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermissionStatus(): BrowserNotificationPermission {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests browser notification permission strictly on demand when the user explicitly
 * toggles a local reminder ON — never invoked automatically on app startup.
 */
export async function requestNotificationPermissionOnDemand(): Promise<BrowserNotificationPermission> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

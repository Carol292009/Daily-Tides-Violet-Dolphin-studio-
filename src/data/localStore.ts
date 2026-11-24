import {
  AchievementBadge,
  ConsistencyMetrics,
  DailyQuestDefinition,
  DailyQuestId,
  DailyTidePersistedState,
  GardenStageInfo,
  LocalReminderPreferences,
  MeasurementUnit,
  MonthlyDayCell,
  MoodDefinition,
  SelfCareChallenge,
  WeeklyAchievementItem,
  WeeklySummary,
} from '../types/dailyTide';
import {
  DAILY_REFLECTION_QUESTIONS,
  MOTIVATION_CATEGORIES,
  MOTIVATION_LIBRARY,
  SELF_APPRECIATION_PROMPTS,
} from './motivationLibrary';

export {
  DAILY_REFLECTION_QUESTIONS,
  MOTIVATION_CATEGORIES,
  MOTIVATION_LIBRARY,
  SELF_APPRECIATION_PROMPTS,
};

export const CURATED_AFFIRMATIONS = MOTIVATION_LIBRARY;
export const CURATED_PROMPTS = SELF_APPRECIATION_PROMPTS;

export const STORAGE_KEY = 'violet_dolphin_daily_tide_v2';
const LEGACY_SEEDED_STORAGE_KEY = 'violet_dolphin_daily_tide_v1';
export const STUDIO_LOGO_PATH = '/assets/aistudio/file_00000000046c8211af83acbfb2927ecf_d48a101d.png';
export const APP_ICON_PATH = STUDIO_LOGO_PATH;
export const DEVELOPER_COFFEE_QR_PATH = '/assets/aistudio/IMG-20261124-WA0014_a6d1f564.jpg';
export const DEVELOPER_UPI_ID = 'khushalnyk679@okaxis';

export const MOOD_DEFINITIONS: MoodDefinition[] = [
  {
    level: 1,
    label: 'Heavy',
    gentleSummary: 'Take things one gentle breath at a time.',
    accentHex: '#7A7291',
  },
  {
    level: 2,
    label: 'Low Tide',
    gentleSummary: 'Quiet days still count. Be soft with yourself.',
    accentHex: '#5B7DB1',
  },
  {
    level: 3,
    label: 'Steady',
    gentleSummary: 'Grounded, balanced, and moving at your pace.',
    accentHex: '#36B5C4',
  },
  {
    level: 4,
    label: 'Calm',
    gentleSummary: 'A clear, unhurried rhythm today.',
    accentHex: '#6C4FE0',
  },
  {
    level: 5,
    label: 'Radiant',
    gentleSummary: 'Bright energy — savor what feels good today.',
    accentHex: '#E09F3E',
  },
];

export const MOOD_CONTEXT_TAGS = ['Rested', 'Grateful', 'Focused', 'Busy', 'Outdoors', 'Quiet', 'Creative', 'Tired'];

export const DAILY_SELF_CARE_QUESTS: DailyQuestDefinition[] = [
  {
    id: 'drink_wake_water',
    title: 'Drink water after waking up',
    description: 'Begin your morning with one refreshing, unhurried glass of water.',
    category: 'Hydration',
    points: 20,
    durationLabel: '1 min',
    linkedRoute: 'hydration',
  },
  {
    id: 'appreciate_three',
    title: 'Write three things you appreciate',
    description: 'Notice three kind moments, strengths, or small wins in your vault.',
    category: 'Appreciation',
    points: 25,
    durationLabel: '3 min',
    linkedRoute: 'journal',
  },
  {
    id: 'reflect_five_min',
    title: 'Spend five minutes reflecting',
    description: 'Pause for a calm check-in with your private reflection journal.',
    category: 'Reflection',
    points: 25,
    durationLabel: '5 min',
    linkedRoute: 'journal',
  },
  {
    id: 'complete_habit',
    title: 'Complete one personal habit',
    description: 'Check off any habit from your routine at your own comfortable pace.',
    category: 'Habits',
    points: 20,
    durationLabel: '2 min',
    linkedRoute: 'habits',
  },
  {
    id: 'positive_thought',
    title: 'Write one positive thought',
    description: 'Capture one encouraging, grounded sentence to carry with you today.',
    category: 'Mindset',
    points: 20,
    durationLabel: '2 min',
    linkedRoute: 'challenges',
  },
];

export const GARDEN_STAGES: GardenStageInfo[] = [
  {
    stageIndex: 1,
    name: 'Dewy Shoreline',
    subtitle: 'Fresh seeds resting beside a calm morning tide.',
    minPoints: 0,
    nextStagePoints: 120,
    bloomTier: 1,
  },
  {
    stageIndex: 2,
    name: 'Sprouting Meadow',
    subtitle: 'Tender coastal shoots rising with your daily sips and habits.',
    minPoints: 120,
    nextStagePoints: 260,
    bloomTier: 2,
  },
  {
    stageIndex: 3,
    name: 'Blooming Cove',
    subtitle: 'Soft violet and aqua blossoms opening across your quiet shore.',
    minPoints: 260,
    nextStagePoints: 450,
    bloomTier: 3,
  },
  {
    stageIndex: 4,
    name: 'Radiant Sanctuary',
    subtitle: 'Lush botanicals, floating light motes, and thriving self-care blooms.',
    minPoints: 450,
    nextStagePoints: 700,
    bloomTier: 4,
  },
  {
    stageIndex: 5,
    name: 'Violet Dolphin Oasis',
    subtitle: 'A serene coastal garden in full bloom — nurtured entirely at your pace.',
    minPoints: 700,
    nextStagePoints: null,
    bloomTier: 5,
  },
];

export const CURATED_CHALLENGES: SelfCareChallenge[] = [
  { id: 'ch_01', title: 'Window Horizon Pause', description: 'Look at something distant outside for 60 seconds and relax your eyes.', category: 'Mind', durationMinutes: 2 },
  { id: 'ch_02', title: 'Shoulder Drop Reset', description: 'Roll your shoulders slowly back five times and release jaw tension.', category: 'Body', durationMinutes: 2 },
  { id: 'ch_03', title: 'Mindful Sip', description: 'Drink one full glass of water without looking at any screen.', category: 'Body', durationMinutes: 2 },
  { id: 'ch_04', title: 'Two-Minute Tidy', description: 'Clear just one small surface near you so your space feels lighter.', category: 'Space', durationMinutes: 2 },
  { id: 'ch_05', title: 'Kind Text Ripple', description: 'Send a short, warm message to someone who crossed your mind.', category: 'Joy', durationMinutes: 3 },
  { id: 'ch_06', title: 'Box Breath Rhythm', description: 'Inhale 4 seconds, hold 4, exhale 4, rest 4 — repeat four calm rounds.', category: 'Mind', durationMinutes: 3 },
  { id: 'ch_07', title: 'Sunlight Step', description: 'Step near natural light or outdoors for three unhurried minutes.', category: 'Joy', durationMinutes: 3 },
];

export function getTodayKey(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface Hydration30DayPoint {
  dateKey: string;
  dateObj: Date;
  shortLabel: string;
  fullDateLabel: string;
  dayOfMonth: number;
  ml: number;
  goalMl: number;
  goalRatio: number;
  goalMet: boolean;
  rollingAvg7Ml: number;
  isToday: boolean;
}

/**
 * Pure offline aggregator for the last 30 calendar days of water consumption,
 * including a 7-day moving average to help users spot long-term hydration habits.
 */
export function buildLast30DaysHydrationSeries(
  waterLogs: { dateKey: string; amountMl: number }[],
  dailyGoalMl: number,
  todayKey = getTodayKey()
): Hydration30DayPoint[] {
  const totalsByDate = new Map<string, number>();
  for (const log of waterLogs) {
    totalsByDate.set(log.dateKey, (totalsByDate.get(log.dateKey) ?? 0) + log.amountMl);
  }

  const safeGoal = Math.max(dailyGoalMl, 1);
  const rawPoints = Array.from({ length: 30 }, (_, idx) => {
    const offset = -(29 - idx);
    const dateKey = getTodayKey(offset);
    const [y, m, d] = dateKey.split('-').map(Number);
    const dateObj = new Date(y, (m || 1) - 1, d || 1);
    const ml = totalsByDate.get(dateKey) ?? 0;
    return {
      dateKey,
      dateObj,
      shortLabel: dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      fullDateLabel: dateObj.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      dayOfMonth: d || idx + 1,
      ml,
      goalMl: safeGoal,
      goalRatio: ml / safeGoal,
      goalMet: ml >= safeGoal,
      rollingAvg7Ml: 0,
      isToday: dateKey === todayKey,
    };
  });

  // Compute 7-day trailing moving average across the 30-day window
  return rawPoints.map((pt, idx) => {
    const windowStart = Math.max(0, idx - 6);
    const slice = rawPoints.slice(windowStart, idx + 1);
    const avg = Math.round(
      slice.reduce((sum, item) => sum + item.ml, 0) / Math.max(slice.length, 1)
    );
    return {
      ...pt,
      rollingAvg7Ml: avg,
    };
  });
}


export function formatDateKeyLabel(dateKey: string, todayKey = getTodayKey()): string {
  if (dateKey === todayKey) return 'Today';
  const yesterdayKey = getTodayKey(-1);
  if (dateKey === yesterdayKey) return 'Yesterday';
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatVolume(ml: number, unit: MeasurementUnit): string {
  if (unit === 'OZ') {
    return `${Math.round(ml / 29.5735)} oz`;
  }
  if (unit === 'L') {
    const litres = Number((ml / 1000).toFixed(2));
    return `${litres} L`;
  }
  return `${ml.toLocaleString()} ml`;
}

export function formatLitresOnly(ml: number): string {
  const litres = Number((ml / 1000).toFixed(2));
  return `${litres} L`;
}

export function createDefaultReminderSchedule(waterEnabled = false): LocalReminderPreferences {
  return {
    water: {
      enabled: waterEnabled,
      intervalMinutes: 120,
    },
    reflection: {
      enabled: false,
      frequency: 'DAILY',
      preferredTime: '20:30',
    },
    habits: {
      enabled: false,
      frequency: 'DAILY',
      preferredTime: '09:00',
    },
    selfCareCheckIn: {
      enabled: false,
      frequency: 'EVERY_2_DAYS',
      preferredTime: '15:00',
    },
    dailyUse: {
      enabled: false,
      frequency: 'DAILY',
      preferredTime: '08:30',
    },
    postUseFeedback: {
      enabled: true,
      hasBeenSent: false,
      delayMinutes: 30,
    },
  };
}

export function createDefaultBadges(): AchievementBadge[] {
  return [
    { id: 'first_ripple', title: 'First Ripple', description: 'Logged your very first sip of water in Daily Tide.', category: 'Hydration', unlockedAtMillis: null, progressCurrent: 0, progressTarget: 1 },
    { id: 'calm_hydration', title: 'Steady Stream', description: 'Logged 10 total water entries across your days.', category: 'Hydration', unlockedAtMillis: null, progressCurrent: 0, progressTarget: 10 },
    { id: 'inner_compass', title: 'Inner Compass', description: 'Completed 5 daily mood check-ins.', category: 'Awareness', unlockedAtMillis: null, progressCurrent: 0, progressTarget: 5 },
    { id: 'appreciation_keeper', title: 'Appreciation Keeper', description: 'Saved 3 answers in your Self-Appreciation Vault.', category: 'Reflection', unlockedAtMillis: null, progressCurrent: 0, progressTarget: 3 },
    { id: 'quiet_pages', title: 'Quiet Pages', description: 'Wrote 3 personal journal reflections.', category: 'Reflection', unlockedAtMillis: null, progressCurrent: 0, progressTarget: 3 },
    { id: 'little_habits', title: 'Little Habits', description: 'Checked off 10 habit completions at your own pace.', category: 'Habits', unlockedAtMillis: null, progressCurrent: 0, progressTarget: 10 },
    { id: 'tide_explorer', title: 'Gentle Explorer', description: 'Completed 5 daily self-care quests or rituals.', category: 'Quests', unlockedAtMillis: null, progressCurrent: 0, progressTarget: 5 },
    { id: 'gentle_return', title: 'Gentle Return', description: 'Showed up for yourself across 3 separate calendar days.', category: 'Rhythm', unlockedAtMillis: null, progressCurrent: 0, progressTarget: 3 },
  ];
}

/**
 * Clean starting-level state for brand-new consumers and "Clear All Application Data".
 * Contains zero pre-loaded personal logs, moods, journals, appreciations, habits, or unlocked badges.
 */
export function createEmptyCleanState(): DailyTidePersistedState {
  const today = getTodayKey();
  return {
    settings: {
      hasCompletedOnboarding: false,
      hasSeenQuickGuide: false,
      displayName: '',
      unit: 'ML',
      dailyWaterGoalMl: 2000,
      themeMode: 'WARM_IVORY',
      remindersEnabled: false,
      reminderIntervalMinutes: 120,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:30',
      reminderSchedule: createDefaultReminderSchedule(false),
      unlockedRewardIds: [],
    },
    vessels: [
      { id: 'v_cup', name: 'Small Cup', volumeMl: 150, isDefault: false },
      { id: 'v_glass', name: 'Glass', volumeMl: 250, isDefault: true },
      { id: 'v_bottle', name: 'Bottle', volumeMl: 500, isDefault: false },
      { id: 'v_flask', name: 'Large Flask', volumeMl: 750, isDefault: false },
    ],
    waterLogs: [],
    moodCheckIns: [],
    journalEntries: [],
    appreciationAnswers: [],
    favoriteAffirmationIds: [],
    dailyChallenge: {
      dateKey: today,
      challengeId: CURATED_CHALLENGES[0].id,
      status: 'ASSIGNED',
      swapsUsed: 0,
    },
    questHistory: {},
    positiveThoughts: [],
    streakRestartedFromDateKey: null,
    promptIndexOffset: 0,
    habits: [],
    badges: createDefaultBadges(),
    weeklySummary: null,
    lastActiveDateKey: today,
  };
}

export function createInitialState(): DailyTidePersistedState {
  return createEmptyCleanState();
}

/**
 * Computes which Daily Self-Care Quests are completed on a given dateKey,
 * seamlessly combining explicit quest check-offs with real logged self-care activity.
 */
export function getCompletedQuestsForDate(
  state: DailyTidePersistedState,
  dateKey: string
): DailyQuestId[] {
  const completed = new Set<DailyQuestId>(state.questHistory?.[dateKey] ?? []);

  if (state.waterLogs.some((l) => l.dateKey === dateKey)) {
    completed.add('drink_wake_water');
  }
  if (state.appreciationAnswers.filter((a) => a.dateKey === dateKey).length >= 3) {
    completed.add('appreciate_three');
  }
  if (state.journalEntries.some((j) => j.dateKey === dateKey)) {
    completed.add('reflect_five_min');
  }
  if (state.habits.some((h) => h.completedDates.includes(dateKey))) {
    completed.add('complete_habit');
  }
  if ((state.positiveThoughts ?? []).some((pt) => pt.dateKey === dateKey)) {
    completed.add('positive_thought');
  }

  return Array.from(completed);
}

/**
 * Calculates ethical Tide Points earned on a single day from water, habits, moods,
 * reflections, appreciations, and Daily Self-Care Quests.
 */
export function computeDailyPointsForDate(
  state: DailyTidePersistedState,
  dateKey: string
): number {
  let pts = 0;
  const dayWaterMl = state.waterLogs
    .filter((l) => l.dateKey === dateKey)
    .reduce((sum, l) => sum + l.amountMl, 0);
  if (dayWaterMl > 0) pts += 10;
  if (dayWaterMl >= state.settings.dailyWaterGoalMl && state.settings.dailyWaterGoalMl > 0) {
    pts += 20;
  }

  const dayHabits = state.habits.filter((h) => h.completedDates.includes(dateKey)).length;
  pts += dayHabits * 10;

  if (state.moodCheckIns.some((m) => m.dateKey === dateKey)) pts += 15;
  if (state.journalEntries.some((j) => j.dateKey === dateKey)) pts += 20;
  const dayAppreciations = state.appreciationAnswers.filter((a) => a.dateKey === dateKey).length;
  pts += Math.min(dayAppreciations, 3) * 10;

  const completedQuests = getCompletedQuestsForDate(state, dateKey);
  completedQuests.forEach((qid) => {
    const def = DAILY_SELF_CARE_QUESTS.find((q) => q.id === qid);
    if (def) pts += def.points;
  });

  if (state.dailyChallenge.dateKey === dateKey && state.dailyChallenge.status === 'COMPLETED') {
    pts += 20;
  }

  return pts;
}

export function getAllActiveDateKeys(state: DailyTidePersistedState): Set<string> {
  const days = new Set<string>();
  state.waterLogs.forEach((l) => days.add(l.dateKey));
  state.moodCheckIns.forEach((m) => days.add(m.dateKey));
  state.journalEntries.forEach((j) => days.add(j.dateKey));
  state.appreciationAnswers.forEach((a) => days.add(a.dateKey));
  state.habits.forEach((h) => h.completedDates.forEach((d) => days.add(d)));
  Object.entries(state.questHistory ?? {}).forEach(([k, list]) => {
    if (list.length > 0) days.add(k);
  });
  (state.positiveThoughts ?? []).forEach((pt) => days.add(pt.dateKey));
  if (state.dailyChallenge.status === 'COMPLETED') {
    days.add(state.dailyChallenge.dateKey);
  }
  return days;
}

export function getGardenStageForPoints(totalPoints: number): {
  stage: GardenStageInfo;
  stageProgress: number;
  pointsToNextStage: number | null;
} {
  let current = GARDEN_STAGES[0];
  for (const stage of GARDEN_STAGES) {
    if (totalPoints >= stage.minPoints) {
      current = stage;
    }
  }
  if (current.nextStagePoints === null) {
    return { stage: current, stageProgress: 1, pointsToNextStage: null };
  }
  const span = Math.max(current.nextStagePoints - current.minPoints, 1);
  const progress = Math.min(Math.max((totalPoints - current.minPoints) / span, 0), 1);
  return {
    stage: current,
    stageProgress: progress,
    pointsToNextStage: Math.max(current.nextStagePoints - totalPoints, 0),
  };
}

export function computeConsistencyMetrics(
  state: DailyTidePersistedState,
  todayKey = getTodayKey()
): ConsistencyMetrics {
  const activeDaysSet = getAllActiveDateKeys(state);

  // Total lifetime Tide Points (never erased even if user taps "Start a Fresh Tide")
  let totalTidePoints = 0;
  activeDaysSet.forEach((key) => {
    totalTidePoints += computeDailyPointsForDate(state, key);
  });
  const unlockedBadgesCount = state.badges.filter((b) => b.unlockedAtMillis !== null).length;
  totalTidePoints += unlockedBadgesCount * 25;

  const todayPoints = computeDailyPointsForDate(state, todayKey);
  const { stage: gardenStage, stageProgress: gardenStageProgress, pointsToNextStage } =
    getGardenStageForPoints(totalTidePoints);

  // Positive consistency streak (respects gentle restart boundary without deleting history)
  const restartBoundary = state.streakRestartedFromDateKey;
  let currentPositiveStreak = 0;
  for (let offset = 0; offset < 365; offset += 1) {
    const key = getTodayKey(-offset);
    if (restartBoundary && key < restartBoundary) break;
    if (activeDaysSet.has(key)) {
      currentPositiveStreak += 1;
    } else if (offset === 0) {
      // Allow today to still be in progress without breaking yesterday's streak
      continue;
    } else {
      break;
    }
  }

  // Best historical positive streak across all recorded dates
  const sortedDates = Array.from(activeDaysSet).sort();
  let bestPositiveStreak = currentPositiveStreak;
  let running = 0;
  let prevTime: number | null = null;
  for (const key of sortedDates) {
    const [y, m, d] = key.split('-').map(Number);
    if (!y || !m || !d) continue;
    const utcDay = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
    if (prevTime !== null && utcDay === prevTime + 1) {
      running += 1;
    } else {
      running = 1;
    }
    if (running > bestPositiveStreak) bestPositiveStreak = running;
    prevTime = utcDay;
  }

  // 30-day calm monthly progress grid
  const monthlyDays: MonthlyDayCell[] = Array.from({ length: 30 }, (_, idx) => {
    const offset = -(29 - idx);
    const key = getTodayKey(offset);
    const dayNumber = Number(key.split('-')[2]) || idx + 1;
    return {
      key,
      dayNumber,
      active: activeDaysSet.has(key),
      isToday: key === todayKey,
      points: computeDailyPointsForDate(state, key),
    };
  });
  const activeDaysLast30 = monthlyDays.filter((c) => c.active).length;

  // Weekly achievements (last 7 days)
  const last7Keys = Array.from({ length: 7 }, (_, i) => getTodayKey(-i));
  const last7Set = new Set(last7Keys);

  let hydrationGoalDays = 0;
  last7Keys.forEach((key) => {
    const ml = state.waterLogs
      .filter((l) => l.dateKey === key)
      .reduce((s, l) => s + l.amountMl, 0);
    if (ml >= state.settings.dailyWaterGoalMl && state.settings.dailyWaterGoalMl > 0) {
      hydrationGoalDays += 1;
    }
  });

  const weeklyHabitCompletions = state.habits.reduce(
    (sum, h) => sum + h.completedDates.filter((d) => last7Set.has(d)).length,
    0
  );
  const weeklyReflections =
    state.journalEntries.filter((j) => last7Set.has(j.dateKey)).length +
    state.appreciationAnswers.filter((a) => last7Set.has(a.dateKey)).length;
  const weeklyQuestsCount = last7Keys.reduce(
    (sum, k) => sum + getCompletedQuestsForDate(state, k).length,
    0
  );

  const weeklyAchievements: WeeklyAchievementItem[] = [
    {
      id: 'wa_hydration',
      title: 'Steady Hydration Wave',
      detail: 'Reach your personal water goal on 3+ days this week.',
      achieved: hydrationGoalDays >= 3,
      progressLabel: `${hydrationGoalDays}/3 days`,
    },
    {
      id: 'wa_habits',
      title: 'Gentle Routine Builder',
      detail: 'Complete 5+ personal habit check-ins this week.',
      achieved: weeklyHabitCompletions >= 5,
      progressLabel: `${weeklyHabitCompletions}/5 check-ins`,
    },
    {
      id: 'wa_mindful',
      title: 'Mindful Reflection Keeper',
      detail: 'Record 2+ reflections or self-appreciations this week.',
      achieved: weeklyReflections >= 2,
      progressLabel: `${weeklyReflections}/2 notes`,
    },
    {
      id: 'wa_quests',
      title: 'Daily Quest Gardener',
      detail: 'Complete 5+ daily self-care quests this week.',
      achieved: weeklyQuestsCount >= 5,
      progressLabel: `${weeklyQuestsCount}/5 quests`,
    },
  ];

  return {
    todayPoints,
    totalTidePoints,
    currentPositiveStreak,
    bestPositiveStreak,
    totalActiveDaysAllTime: activeDaysSet.size,
    activeDaysLast30,
    monthlyDays,
    weeklyAchievements,
    gardenStage,
    gardenStageProgress,
    pointsToNextStage,
  };
}

/**
 * Ensures daily tracking state rolls over automatically when a new calendar day starts,
 * while preserving every historical entry across sessions and reboots.
 */
export function reconcileForDate(
  state: DailyTidePersistedState,
  currentDateKey: string
): DailyTidePersistedState {
  const validAffIds = new Set(MOTIVATION_LIBRARY.map((a) => a.id));
  const cleanedFavorites = (state.favoriteAffirmationIds ?? []).filter((id) => validAffIds.has(id));

  const needsChallengeRollover = state.dailyChallenge.dateKey !== currentDateKey;
  const daySeed = Number(currentDateKey.replace(/-/g, '')) || 1;
  const nextChallenge = needsChallengeRollover
    ? {
        dateKey: currentDateKey,
        challengeId: CURATED_CHALLENGES[daySeed % CURATED_CHALLENGES.length].id,
        status: 'ASSIGNED' as const,
        swapsUsed: 0,
      }
    : state.dailyChallenge;

  const defaultSchedule = createDefaultReminderSchedule(Boolean(state.settings.remindersEnabled));
  const mergedSchedule: LocalReminderPreferences = {
    water: {
      enabled: state.settings.reminderSchedule?.water?.enabled ?? Boolean(state.settings.remindersEnabled),
      intervalMinutes:
        state.settings.reminderSchedule?.water?.intervalMinutes ??
        state.settings.reminderIntervalMinutes ??
        120,
    },
    reflection: {
      ...defaultSchedule.reflection,
      ...(state.settings.reminderSchedule?.reflection ?? {}),
    },
    habits: {
      ...defaultSchedule.habits,
      ...(state.settings.reminderSchedule?.habits ?? {}),
    },
    selfCareCheckIn: {
      ...defaultSchedule.selfCareCheckIn,
      ...(state.settings.reminderSchedule?.selfCareCheckIn ?? {}),
    },
    dailyUse: {
      ...defaultSchedule.dailyUse,
      ...(state.settings.reminderSchedule?.dailyUse ?? {}),
    },
    postUseFeedback: {
      ...defaultSchedule.postUseFeedback,
      ...(state.settings.reminderSchedule?.postUseFeedback ?? {}),
    },
  };

  return {
    ...state,
    settings: {
      ...state.settings,
      hasSeenQuickGuide: Boolean(state.settings.hasSeenQuickGuide),
      remindersEnabled: mergedSchedule.water.enabled,
      reminderIntervalMinutes: mergedSchedule.water.intervalMinutes,
      reminderSchedule: mergedSchedule,
    },
    favoriteAffirmationIds: cleanedFavorites,
    dailyChallenge: nextChallenge,
    questHistory: state.questHistory ?? {},
    positiveThoughts: state.positiveThoughts ?? [],
    streakRestartedFromDateKey: state.streakRestartedFromDateKey ?? null,
    lastActiveDateKey: currentDateKey,
  };
}

export function loadPersistedState(): DailyTidePersistedState {
  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Remove legacy pre-seeded v1 key so consumers start from a true fresh slate
      try {
        localStorage.removeItem(LEGACY_SEEDED_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
      const initial = createInitialState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as DailyTidePersistedState;
    if (!parsed || !parsed.settings || !Array.isArray(parsed.vessels)) {
      return createInitialState();
    }
    return reconcileForDate(parsed, today);
  } catch {
    return createInitialState();
  }
}

export function savePersistedState(state: DailyTidePersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded or restricted; fail gracefully without crashing UI
  }
}

export function evaluateBadgesLocally(state: DailyTidePersistedState): AchievementBadge[] {
  const waterCount = state.waterLogs.length;
  const moodCount = state.moodCheckIns.length;
  const appreciationCount = state.appreciationAnswers.length;
  const journalCount = state.journalEntries.length;
  const habitCompletions = state.habits.reduce((sum, h) => sum + h.completedDates.length, 0);

  const activeDays = getAllActiveDateKeys(state);
  let totalQuestsDone = state.dailyChallenge.status === 'COMPLETED' ? 1 : 0;
  activeDays.forEach((dayKey) => {
    totalQuestsDone += getCompletedQuestsForDate(state, dayKey).length;
  });

  const progressById: Record<string, number> = {
    first_ripple: waterCount,
    calm_hydration: waterCount,
    inner_compass: moodCount,
    appreciation_keeper: appreciationCount,
    quiet_pages: journalCount,
    little_habits: habitCompletions,
    tide_explorer: totalQuestsDone,
    gentle_return: activeDays.size,
  };

  const now = Date.now();
  return state.badges.map((badge) => {
    const nextProgress = Math.min(progressById[badge.id] ?? badge.progressCurrent, badge.progressTarget);
    // Never revoke an already unlocked historical badge!
    const unlockedAt =
      badge.unlockedAtMillis ?? (nextProgress >= badge.progressTarget ? now : null);
    return {
      ...badge,
      progressCurrent: unlockedAt ? badge.progressTarget : nextProgress,
      unlockedAtMillis: unlockedAt,
    };
  });
}

export function compileWeeklySummaryLocally(state: DailyTidePersistedState): WeeklySummary {
  const last7Keys = Array.from({ length: 7 }, (_, i) => getTodayKey(-i));
  const last7Set = new Set(last7Keys);
  const weekWaterLogs = state.waterLogs.filter((l) => last7Set.has(l.dateKey));
  const totalWaterMl = weekWaterLogs.reduce((sum, l) => sum + l.amountMl, 0);

  const byDay = new Map<string, number>();
  weekWaterLogs.forEach((l) => byDay.set(l.dateKey, (byDay.get(l.dateKey) ?? 0) + l.amountMl));
  let hydrationGoalDaysMet = 0;
  byDay.forEach((val) => {
    if (val >= state.settings.dailyWaterGoalMl && state.settings.dailyWaterGoalMl > 0) {
      hydrationGoalDaysMet += 1;
    }
  });

  const activeHabits = state.habits.filter((h) => !h.isPaused);
  const completedSlots = activeHabits.reduce(
    (sum, h) => sum + h.completedDates.filter((d) => last7Set.has(d)).length,
    0
  );
  const possibleSlots = Math.max(activeHabits.length * 7, 1);
  const habitCompletionRate = Math.min(completedSlots / possibleSlots, 1);

  const topHabit = [...activeHabits].sort(
    (a, b) =>
      b.completedDates.filter((d) => last7Set.has(d)).length -
      a.completedDates.filter((d) => last7Set.has(d)).length
  )[0];

  const weekMoods = state.moodCheckIns.filter((m) => last7Set.has(m.dateKey));
  const moodCounts = new Map<number, number>();
  weekMoods.forEach((m) => moodCounts.set(m.moodLevel, (moodCounts.get(m.moodLevel) ?? 0) + 1));
  let dominantMoodLevel: 1 | 2 | 3 | 4 | 5 | null = null;
  let maxMood = 0;
  moodCounts.forEach((count, level) => {
    if (count > maxMood) {
      maxMood = count;
      dominantMoodLevel = level as 1 | 2 | 3 | 4 | 5;
    }
  });

  const reflectionEntriesCount = state.journalEntries.filter((j) => last7Set.has(j.dateKey)).length;
  const appreciationEntriesCount = state.appreciationAnswers.filter((a) =>
    last7Set.has(a.dateKey)
  ).length;
  const weeklyQuestsCount = last7Keys.reduce(
    (sum, key) => sum + getCompletedQuestsForDate(state, key).length,
    0
  );
  const weeklyPointsEarned = last7Keys.reduce(
    (sum, key) => sum + computeDailyPointsForDate(state, key),
    0
  );

  const consistency = computeConsistencyMetrics(state);
  const unlockedBadgesCount = state.badges.filter((b) => b.unlockedAtMillis !== null).length;
  const highlight = state.appreciationAnswers[0]?.answerText ?? null;
  const challengesCompleted =
    weeklyQuestsCount + (state.dailyChallenge.status === 'COMPLETED' ? 1 : 0);

  const insightMessage =
    hydrationGoalDaysMet >= 4
      ? 'A wonderfully steady hydration rhythm this week. Your small sips helped your garden flourish.'
      : completedSlots > 0 || weeklyQuestsCount > 0
      ? 'You showed up with care across the week — every small check-in nurtures lasting growth.'
      : 'A gentle week of rest and reset. Ready whenever you want to begin a fresh tide.';

  return {
    generatedAtMillis: Date.now(),
    totalWaterMl,
    hydrationGoalDaysMet,
    habitCompletionRate,
    habitsCompletedCount: completedSlots,
    topHabitTitle: topHabit?.title ?? null,
    dominantMoodLevel,
    moodCheckInsCount: weekMoods.length,
    reflectionEntriesCount,
    appreciationEntriesCount,
    challengesCompleted,
    weeklyPointsEarned,
    unlockedBadgesCount,
    gardenStageName: consistency.gardenStage.name,
    highlightAppreciation: highlight,
    insightMessage,
  };
}

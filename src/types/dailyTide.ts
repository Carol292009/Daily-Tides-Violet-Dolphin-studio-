export type MeasurementUnit = 'ML' | 'L' | 'OZ';
export type ThemeMode = 'WARM_IVORY' | 'MIDNIGHT_TIDE';
export type HabitTimeOfDay = 'Morning' | 'Afternoon' | 'Evening' | 'Anytime';
export type ActivityLevel = 'LIGHT' | 'MODERATE' | 'ACTIVE';
export type ClimateType = 'COOL' | 'TEMPERATE' | 'WARM';

export interface PersonalBodyMetrics {
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  climate: ClimateType;
  measurementSystem: 'METRIC' | 'IMPERIAL';
}
export type ChallengeStatus = 'ASSIGNED' | 'COMPLETED' | 'SKIPPED';
export type ShareCardThemeId =
  | 'warm_ivory'
  | 'ocean_mist'
  | 'violet_dusk'
  | 'midnight_tide'
  | 'aurora_lagoon';
export type ShareCardCategory = 'achievement' | 'motivation' | 'weekly' | 'milestone';

export type DailyQuestId =
  | 'drink_wake_water'
  | 'appreciate_three'
  | 'reflect_five_min'
  | 'complete_habit'
  | 'positive_thought';

export type MotivationCategory =
  | 'Self-confidence'
  | 'Discipline'
  | 'Consistency'
  | 'Personal growth'
  | 'Gratitude'
  | 'New beginnings'
  | 'Positive thinking';

export interface MoodDefinition {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  gentleSummary: string;
  accentHex: string;
}

export type ReminderCategory =
  | 'water'
  | 'reflection'
  | 'habits'
  | 'selfCareCheckIn'
  | 'dailyUse';
export type ReminderFrequency = 'DAILY' | 'WEEKDAYS' | 'EVERY_2_DAYS' | 'TWICE_DAILY' | 'WEEKLY';

export interface CategoryReminderConfig {
  enabled: boolean;
  frequency: ReminderFrequency;
  preferredTime: string;
}

export interface PostUseFeedbackConfig {
  enabled: boolean;
  hasBeenSent: boolean;
  delayMinutes: number;
}

export interface LocalReminderPreferences {
  water: {
    enabled: boolean;
    intervalMinutes: number;
  };
  reflection: CategoryReminderConfig;
  habits: CategoryReminderConfig;
  selfCareCheckIn: CategoryReminderConfig;
  dailyUse: CategoryReminderConfig;
  postUseFeedback: PostUseFeedbackConfig;
}

export interface UserSettings {
  hasCompletedOnboarding: boolean;
  hasSeenQuickGuide: boolean;
  displayName: string;
  unit: MeasurementUnit;
  dailyWaterGoalMl: number;
  themeMode: ThemeMode;
  remindersEnabled: boolean;
  reminderIntervalMinutes: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  reminderSchedule: LocalReminderPreferences;
  unlockedRewardIds: string[];
  bodyMetrics?: PersonalBodyMetrics;
}

export interface WaterVessel {
  id: string;
  name: string;
  volumeMl: number;
  isDefault: boolean;
}

export interface WaterLog {
  id: string;
  dateKey: string;
  loggedAtMillis: number;
  amountMl: number;
  vesselName: string;
}

export interface MoodCheckIn {
  id: string;
  dateKey: string;
  createdAtMillis: number;
  moodLevel: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  note: string;
}

export interface GuidedReflectionResponses {
  happyToday?: string;
  accomplished?: string;
  gratefulFor?: string;
  learnedToday?: string;
  improveTomorrow?: string;
}

export interface JournalEntry {
  id: string;
  dateKey: string;
  createdAtMillis: number;
  title: string;
  body: string;
  moodLevel?: 1 | 2 | 3 | 4 | 5;
  guidedResponses?: GuidedReflectionResponses;
}

export interface AppreciationPrompt {
  id: string;
  promptText: string;
  category: string;
}

export interface AppreciationAnswer {
  id: string;
  dateKey: string;
  promptId: string;
  promptText: string;
  answerText: string;
  createdAtMillis: number;
}

export interface PositiveThoughtEntry {
  id: string;
  dateKey: string;
  text: string;
  createdAtMillis: number;
}

export interface Affirmation {
  id: string;
  text: string;
  toneCategory: MotivationCategory;
  isFavorite: boolean;
}

export interface SelfCareChallenge {
  id: string;
  title: string;
  description: string;
  category: string;
  durationMinutes: number;
}

export interface DailyChallengeRecord {
  dateKey: string;
  challengeId: string;
  status: ChallengeStatus;
  swapsUsed: number;
}

export interface DailyQuestDefinition {
  id: DailyQuestId;
  title: string;
  description: string;
  category: 'Hydration' | 'Appreciation' | 'Reflection' | 'Habits' | 'Mindset';
  points: number;
  durationLabel: string;
  linkedRoute: 'hydration' | 'journal' | 'habits' | 'challenges';
}

export interface GardenStageInfo {
  stageIndex: number;
  name: string;
  subtitle: string;
  minPoints: number;
  nextStagePoints: number | null;
  bloomTier: number;
}

export interface WeeklyAchievementItem {
  id: string;
  title: string;
  detail: string;
  achieved: boolean;
  progressLabel: string;
}

export interface MonthlyDayCell {
  key: string;
  dayNumber: number;
  active: boolean;
  isToday: boolean;
  points: number;
}

export interface ConsistencyMetrics {
  todayPoints: number;
  totalTidePoints: number;
  currentPositiveStreak: number;
  bestPositiveStreak: number;
  totalActiveDaysAllTime: number;
  activeDaysLast30: number;
  monthlyDays: MonthlyDayCell[];
  weeklyAchievements: WeeklyAchievementItem[];
  gardenStage: GardenStageInfo;
  gardenStageProgress: number;
  pointsToNextStage: number | null;
}

export interface HabitItem {
  id: string;
  title: string;
  description: string;
  timeOfDay: HabitTimeOfDay;
  isPaused: boolean;
  completedDates: string[];
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  category: string;
  unlockedAtMillis: number | null;
  progressCurrent: number;
  progressTarget: number;
}

export interface WeeklySummary {
  generatedAtMillis: number;
  totalWaterMl: number;
  hydrationGoalDaysMet: number;
  habitCompletionRate: number;
  habitsCompletedCount: number;
  topHabitTitle: string | null;
  dominantMoodLevel: 1 | 2 | 3 | 4 | 5 | null;
  moodCheckInsCount: number;
  reflectionEntriesCount: number;
  appreciationEntriesCount: number;
  challengesCompleted: number;
  weeklyPointsEarned: number;
  unlockedBadgesCount: number;
  gardenStageName: string;
  highlightAppreciation: string | null;
  insightMessage: string;
}

export interface DailyTidePersistedState {
  settings: UserSettings;
  vessels: WaterVessel[];
  waterLogs: WaterLog[];
  moodCheckIns: MoodCheckIn[];
  journalEntries: JournalEntry[];
  appreciationAnswers: AppreciationAnswer[];
  favoriteAffirmationIds: string[];
  dailyChallenge: DailyChallengeRecord;
  questHistory: Record<string, DailyQuestId[]>;
  positiveThoughts: PositiveThoughtEntry[];
  streakRestartedFromDateKey: string | null;
  promptIndexOffset: number;
  habits: HabitItem[];
  badges: AchievementBadge[];
  weeklySummary: WeeklySummary | null;
  lastActiveDateKey?: string;
}

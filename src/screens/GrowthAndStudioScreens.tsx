import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Bell,
  Box,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  Copy,
  Database,
  Download,
  Gift,
  Heart,
  History,
  Info,
  Lock,
  RefreshCw,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  Upload,
  WifiOff,
  X,
} from 'lucide-react';
import {
  AchievementBadge,
  ConsistencyMetrics,
  DailyTidePersistedState,
  LocalReminderPreferences,
  MeasurementUnit,
  ReminderFrequency,
  ShareCardCategory,
  ThemeMode,
  UserSettings,
  WeeklySummary,
} from '../types/dailyTide';
import {
  DEVELOPER_COFFEE_QR_PATH,
  DEVELOPER_UPI_ID,
  Hydration30DayPoint,
  MOOD_DEFINITIONS,
  STUDIO_LOGO_PATH,
  formatDateKeyLabel,
  formatVolume,
} from '../data/localStore';
import {
  BrowserNotificationPermission,
  getNotificationPermissionStatus,
  requestNotificationPermissionOnDemand,
} from '../data/localBackup';
import {
  FREE_LEVEL_FEATURES,
  RewardAccessSnapshot,
  RewardLevelId,
} from '../rewards/rewardAccessManager';
import { ADMOB_OFFICIAL_TEST_REWARDED_AD_UNIT_ID } from '../ads/adMobConfig';
import { PrivacyConsentState } from '../ads/privacyConsentManager';
import {
  EmptySanctuaryState,
  ProgressRing,
  ScreenHeader,
  ShortcutRow,
} from '../components/TidePrimitives';
import { ProgressGardenCanvas } from '../components/ProgressGardenCanvas';
import { HydrationTrendChart30D } from '../components/HydrationTrendChart30D';
import { TideSanctuary3D } from '../components/TideSanctuary3D';

/* ============================================================================
   SCREEN 11: ACHIEVEMENT COLLECTION
   ============================================================================ */
interface AchievementCollectionScreenProps {
  badges: AchievementBadge[];
  onOpenShareCard: (mode?: ShareCardCategory) => void;
  onBack: () => void;
}

export const AchievementCollectionScreen: React.FC<AchievementCollectionScreenProps> = ({
  badges,
  onOpenShareCard,
  onBack,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'UNLOCKED' | 'IN_PROGRESS'>('ALL');

  const unlockedCount = badges.filter((b) => b.unlockedAtMillis !== null).length;
  const visible = badges.filter((b) => {
    if (filter === 'UNLOCKED') return b.unlockedAtMillis !== null;
    if (filter === 'IN_PROGRESS') return b.unlockedAtMillis === null;
    return true;
  });

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Achievement Collection"
        subtitle={`${unlockedCount} of ${badges.length} intrinsic self-care milestones unlocked locally — each plants a permanent blossom in your Progress Garden.`}
        onBack={onBack}
        action={
          <button
            type="button"
            onClick={() => onOpenShareCard('achievement')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] whitespace-nowrap cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Achievement Card</span>
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['ALL', 'All Badges'],
            ['UNLOCKED', 'Unlocked'],
            ['IN_PROGRESS', 'In Progress'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              filter === key
                ? 'bg-[#1E1340] dark:bg-[#6C4FE0] text-white'
                : 'bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] text-[#645F75] dark:text-[#B3AEC4]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptySanctuaryState
          title="Keep moving at your gentle pace"
          subtitle="Milestones unlock automatically as you hydrate, reflect, complete quests, and check off little habits."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((badge) => {
            const unlocked = badge.unlockedAtMillis !== null;
            const ratio = badge.progressCurrent / Math.max(badge.progressTarget, 1);
            return (
              <div
                key={badge.id}
                className={`rounded-3xl p-6 border flex flex-col justify-between gap-4 ${
                  unlocked
                    ? 'bg-white dark:bg-[#1A1E33] border-[#6C4FE0]/55'
                    : 'bg-white/80 dark:bg-[#161A2C] border-[#E6DFD3] dark:border-[#262B45]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <ProgressRing
                    progress={ratio}
                    size={68}
                    strokeWidth={6}
                    colorClass={
                      unlocked
                        ? 'text-[#6C4FE0] dark:text-[#A994FF]'
                        : 'text-[#36B5C4]'
                    }
                    centerLabel={
                      unlocked ? 'Done' : `${badge.progressCurrent}/${badge.progressTarget}`
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
                      {badge.category}
                    </p>
                    <h3 className="mt-0.5 font-display text-base font-semibold">
                      {badge.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#645F75] dark:text-[#B3AEC4] leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EFEAE0] dark:border-[#262B45] flex items-center justify-between">
                  <span className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                    {unlocked && badge.unlockedAtMillis
                      ? `Unlocked ${new Date(badge.unlockedAtMillis).toLocaleDateString()}`
                      : `${Math.round(ratio * 100)}% complete`}
                  </span>
                  {unlocked && (
                    <button
                      type="button"
                      onClick={() => onOpenShareCard('achievement')}
                      className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF] hover:underline cursor-pointer"
                    >
                      Share Card
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   SCREEN 12: PROGRESS DASHBOARD (PROGRESS GARDEN + ETHICAL CONSISTENCY SYSTEM)
   ============================================================================ */
interface ProgressDashboardScreenProps {
  consistency: ConsistencyMetrics;
  last7Days: { key: string; label: string; ml: number }[];
  last30Days: Hydration30DayPoint[];
  dailyGoalMl: number;
  unit: MeasurementUnit;
  badges: AchievementBadge[];
  weeklySummary: WeeklySummary | null;
  onRestartFreshTide: () => void;
  onOpenWeeklyRecap: () => void;
  onOpenAchievements: () => void;
  onOpenQuests: () => void;
  onOpenShareCard: (mode?: ShareCardCategory) => void;
}

export const ProgressDashboardScreen: React.FC<ProgressDashboardScreenProps> = ({
  consistency,
  last7Days,
  last30Days,
  dailyGoalMl,
  unit,
  badges,
  weeklySummary,
  onRestartFreshTide,
  onOpenWeeklyRecap,
  onOpenAchievements,
  onOpenQuests,
  onOpenShareCard,
}) => {
  const [show3DSanctuary, setShow3DSanctuary] = useState(false);
  const unlockedBadges = badges.filter((b) => b.unlockedAtMillis !== null);
  const total7DayMl = last7Days.reduce((s, d) => s + d.ml, 0);

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Progress Garden & Consistency"
        subtitle="Watch your offline garden bloom through daily completion points, 30-day hydration trends, and zero-shame consistency."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShow3DSanctuary(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#1E1340] dark:bg-[#232A4A] text-white border border-[#6C4FE0]/40 hover:border-[#36B5C4] whitespace-nowrap cursor-pointer"
            >
              <Box className="w-3.5 h-3.5 text-[#36B5C4]" />
              <span>Explore 3D Sanctuary</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenShareCard('milestone')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] whitespace-nowrap cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Milestone Card</span>
            </button>
          </div>
        }
      />

      {/* Full Animated 5-Stage Offline Progress Garden */}
      <ProgressGardenCanvas
        gardenStage={consistency.gardenStage}
        stageProgress={consistency.gardenStageProgress}
        totalTidePoints={consistency.totalTidePoints}
        todayPoints={consistency.todayPoints}
        pointsToNextStage={consistency.pointsToNextStage}
        unlockedBadges={unlockedBadges}
      />

      {/* Interactive 3D Sanctuary Launcher Card */}
      <section className="rounded-3xl bg-gradient-to-r from-[#1E1340] via-[#242156] to-[#174667] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#3B3375]">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#79DCE8]">
            Interactive Three.js 3D Scene · Offline Procedural PBR
          </p>
          <h2 className="font-display text-lg sm:text-xl font-semibold">
            Walk Through Your 3D Tide Sanctuary
          </h2>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
            Orbit your lantern pavilion, rising hydration basin, blossom trees (Stage {consistency.gardenStage.stageIndex}), and 30 shoreline tide crystals sculpted directly from your last 30 days of water logs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShow3DSanctuary(true)}
          className="inline-flex items-center justify-center gap-2 self-start sm:self-center px-5 py-3 rounded-2xl text-xs font-semibold bg-[#36B5C4] text-[#111526] hover:bg-[#4CC7D6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Box className="w-4 h-4" />
          <span>Open 3D Sanctuary</span>
        </button>
      </section>

      {/* NEW: D3 30-Day Water Consumption Trends Section */}
      <HydrationTrendChart30D
        data={last30Days}
        dailyGoalMl={dailyGoalMl}
        unit={unit}
      />

      {/* Ethical Consistency System: Positive Streak, Fresh Tide Restart, Monthly 30-Day View & Weekly Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
                Positive Consistency System · Zero Shame
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-[#1F1D2B] dark:text-[#F3F0EA] tabular-nums">
                {consistency.currentPositiveStreak} {consistency.currentPositiveStreak === 1 ? 'day' : 'days'} current flow
              </h2>
              <p className="mt-1 text-sm text-[#645F75] dark:text-[#B3AEC4]">
                Best rhythm: <span className="font-semibold text-[#1F1D2B] dark:text-white">{consistency.bestPositiveStreak} days</span> · Total days nurtured: <span className="font-semibold text-[#1F1D2B] dark:text-white">{consistency.totalActiveDaysAllTime}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onRestartFreshTide}
              className="inline-flex items-center gap-1.5 self-start px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] text-[#256B9A] dark:text-[#79BCE8] hover:border-[#6C4FE0] transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start a Fresh Tide</span>
            </button>
          </div>

          <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] px-4 py-3 leading-relaxed">
            Missed a day? That is simply part of being human. You can begin a fresh streak anytime without ever losing your historical achievements, Tide Points, or Progress Garden blooms.
          </p>

          {/* 30-Day Monthly Progress Calendar */}
          <div className="pt-2 border-t border-[#EFEAE0] dark:border-[#262B45] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]">
                30-Day Monthly Progress
              </span>
              <span className="font-semibold text-[#6C4FE0] dark:text-[#A994FF] tabular-nums">
                {consistency.activeDaysLast30} of 30 days active
              </span>
            </div>

            <div className="grid grid-cols-10 gap-2">
              {consistency.monthlyDays.map((cell) => (
                <div
                  key={cell.key}
                  title={`${cell.key}: ${cell.points} Tide pts`}
                  className={`aspect-square rounded-xl flex items-center justify-center text-[11px] font-semibold tabular-nums transition-colors ${
                    cell.active
                      ? 'bg-[#36B5C4] text-white'
                      : 'bg-[#FAF8F4] dark:bg-[#212640] text-[#8E889F] border border-[#E6DFD3]/70 dark:border-[#2C3250]'
                  } ${cell.isToday ? 'ring-2 ring-[#6C4FE0] ring-offset-2 dark:ring-offset-[#1A1E33]' : ''}`}
                >
                  {cell.dayNumber}
                </div>
              ))}
            </div>
          </div>

          {/* 7-Day Hydration Consistency Chart */}
          <div className="pt-4 border-t border-[#EFEAE0] dark:border-[#262B45]">
            <div className="flex items-center justify-between text-xs text-[#645F75] dark:text-[#B3AEC4] mb-3">
              <span>Last 7 Days Hydration Wave</span>
              <span className="font-semibold text-[#256B9A] dark:text-[#79BCE8] tabular-nums">
                {formatVolume(total7DayMl, unit)} total
              </span>
            </div>

            <div className="grid grid-cols-7 gap-3 items-end h-32">
              {last7Days.map((day) => {
                const ratio = Math.min(
                  Math.max((day.ml / Math.max(dailyGoalMl, 1)) * 100, 8),
                  100
                );
                const met = day.ml >= dailyGoalMl;
                return (
                  <div
                    key={day.key}
                    className="flex flex-col items-center gap-1.5 h-full justify-end"
                  >
                    <div className="w-full max-w-[36px] h-20 rounded-xl bg-[#FAF8F4] dark:bg-[#212640] flex items-end overflow-hidden p-1">
                      <div
                        className={`w-full rounded-lg transition-all duration-500 ${
                          met
                            ? 'bg-[#36B5C4]'
                            : 'bg-[#6C4FE0]/45 dark:bg-[#A994FF]/45'
                        }`}
                        style={{ height: `${ratio}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Column: Weekly Achievements, Weekly Recap & Milestones */}
        <div className="lg:col-span-5 space-y-4">
          {/* Weekly Achievements List */}
          <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#256B9A] dark:text-[#79BCE8]">
                  Weekly Achievements
                </p>
                <h2 className="mt-0.5 font-display text-lg font-semibold">
                  This Week&apos;s Calm Wins
                </h2>
              </div>
              <button
                type="button"
                onClick={onOpenQuests}
                className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF] hover:underline cursor-pointer"
              >
                Daily Quests
              </button>
            </div>

            <div className="space-y-2.5">
              {consistency.weeklyAchievements.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl p-3.5 border flex items-start justify-between gap-3 ${
                    item.achieved
                      ? 'bg-[#EFEAFF]/55 dark:bg-[#231D44] border-[#6C4FE0]/40'
                      : 'bg-[#FAF8F4] dark:bg-[#212640] border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        item.achieved
                          ? 'text-[#6C4FE0] dark:text-[#A994FF]'
                          : 'text-[#A39CB3]'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#256B9A] dark:text-[#79BCE8] whitespace-nowrap tabular-nums">
                    {item.progressLabel}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-[#EFEAFF] dark:bg-[#231D44] p-6 space-y-4">
            <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
              Weekly Recap
            </p>
            <h2 className="font-display text-xl font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
              Your 7-Day Self-Care Report
            </h2>
            <p className="text-sm text-[#554E6E] dark:text-[#C8C3DC] leading-relaxed">
              {weeklySummary
                ? weeklySummary.insightMessage
                : 'Review hydration consistency, completed habits, mood check-ins, reflections, and achievements.'}
            </p>
            <button
              type="button"
              onClick={onOpenWeeklyRecap}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] cursor-pointer"
            >
              Open Weekly Recap
            </button>
          </section>

          <ShortcutRow
            meta={`${unlockedBadges.length} of ${badges.length} unlocked`}
            title="Achievement Collection"
            subtitle="Inspect every milestone badge and share cards locally."
            icon={<Award className="w-5 h-5 text-[#6C4FE0] dark:text-[#A994FF]" />}
            onClick={onOpenAchievements}
          />
        </div>
      </div>

      {/* Full-bleed Three.js 3D Tide Sanctuary Modal */}
      {show3DSanctuary && (
        <TideSanctuary3D
          gardenStage={consistency.gardenStage}
          totalTidePoints={consistency.totalTidePoints}
          last30Days={last30Days}
          unit={unit}
          onClose={() => setShow3DSanctuary(false)}
        />
      )}
    </div>
  );
};

/* ============================================================================
   SCREEN 13: WEEKLY RECAP (ALL 5 PILLARS)
   ============================================================================ */
interface WeeklyRecapScreenProps {
  weeklySummary: WeeklySummary | null;
  unit: MeasurementUnit;
  onCompileWeekly: () => void;
  onOpenShareCard: (mode?: ShareCardCategory) => void;
  onBack: () => void;
}

export const WeeklyRecapScreen: React.FC<WeeklyRecapScreenProps> = ({
  weeklySummary,
  unit,
  onCompileWeekly,
  onOpenShareCard,
  onBack,
}) => {
  const dominantMood = weeklySummary?.dominantMoodLevel
    ? MOOD_DEFINITIONS.find((m) => m.level === weeklySummary.dominantMoodLevel)
    : null;

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Weekly Tide Recap"
        subtitle="Your 7-day report covering hydration consistency, completed habits, mood check-ins, reflections, and personal achievements — stored 100% offline."
        onBack={onBack}
        action={
          <button
            type="button"
            onClick={onCompileWeekly}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#E6DFD3] dark:border-[#2C3250] bg-white dark:bg-[#1A1E33] hover:border-[#6C4FE0] whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Recap</span>
          </button>
        }
      />

      {!weeklySummary ? (
        <EmptySanctuaryState
          title="Your Weekly Tide is ready to compile"
          subtitle="Tap below to summarize your last 7 days of hydration, habits, moods, reflections, and achievements locally."
          actionLabel="Compile Weekly Recap"
          onAction={onCompileWeekly}
        />
      ) : (
        <div className="space-y-6">
          {/* Editorial Insight Banner */}
          <section className="rounded-3xl bg-gradient-to-br from-[#6C4FE0] to-[#256B9A] text-white p-8 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Weekly Reflection · Garden Stage: {weeklySummary.gardenStageName ?? 'Sprouting Meadow'}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold leading-snug max-w-2xl">
              {weeklySummary.insightMessage}
            </h2>
            <p className="text-xs text-white/85 tabular-nums">
              +{weeklySummary.weeklyPointsEarned ?? 0} Tide Points earned this week · Compiled locally on {new Date(weeklySummary.generatedAtMillis).toLocaleDateString()}
            </p>
          </section>

          {/* 5 Required Weekly Report Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Hydration Tracking Consistency */}
            <div className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-2">
              <p className="text-xs font-semibold text-[#256B9A] dark:text-[#79BCE8]">
                1 · Hydration Consistency
              </p>
              <p className="font-display text-2xl font-semibold tabular-nums">
                {weeklySummary.hydrationGoalDaysMet} / 7 days
              </p>
              <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
                {formatVolume(weeklySummary.totalWaterMl, unit)} total water logged this week
              </p>
            </div>

            {/* 2. Completed Habits */}
            <div className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-2">
              <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
                2 · Completed Habits
              </p>
              <p className="font-display text-2xl font-semibold tabular-nums">
                {weeklySummary.habitsCompletedCount ?? 0} check-ins
              </p>
              <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] truncate">
                {Math.round(weeklySummary.habitCompletionRate * 100)}% weekly steadiness
                {weeklySummary.topHabitTitle ? ` · Top: ${weeklySummary.topHabitTitle}` : ''}
              </p>
            </div>

            {/* 3. Mood Check-Ins */}
            <div className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-2">
              <p className="text-xs font-semibold text-[#36B5C4]">
                3 · Mood Check-Ins (Private)
              </p>
              <p className="font-display text-2xl font-semibold tabular-nums">
                {weeklySummary.moodCheckInsCount ?? 0} logged
              </p>
              <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                Most frequent tide: {dominantMood?.label ?? 'Balanced'}
              </p>
            </div>

            {/* 4. Reflection Entries */}
            <div className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-2">
              <p className="text-xs font-semibold text-[#256B9A] dark:text-[#79BCE8]">
                4 · Reflection Entries (Private)
              </p>
              <p className="font-display text-2xl font-semibold tabular-nums">
                {(weeklySummary.reflectionEntriesCount ?? 0) + (weeklySummary.appreciationEntriesCount ?? 0)} notes
              </p>
              <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
                {weeklySummary.reflectionEntriesCount ?? 0} journal reflections · {weeklySummary.appreciationEntriesCount ?? 0} appreciations
              </p>
            </div>

            {/* 5. Personal Achievements */}
            <div className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-2 sm:col-span-2 lg:col-span-2">
              <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
                5 · Personal Achievements &amp; Quests
              </p>
              <p className="font-display text-2xl font-semibold tabular-nums">
                {weeklySummary.unlockedBadgesCount ?? 0} badges unlocked · {weeklySummary.challengesCompleted} quests completed
              </p>
              <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                Your Progress Garden is blooming at <span className="font-semibold text-[#1F1D2B] dark:text-white">{weeklySummary.gardenStageName ?? 'Sprouting Meadow'}</span>.
              </p>
            </div>
          </div>

          {weeklySummary.highlightAppreciation && (
            <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-2">
              <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
                Private Highlight from Your Appreciation Vault (Never Shared)
              </p>
              <p className="font-display text-lg font-medium italic">
                &ldquo;{weeklySummary.highlightAppreciation}&rdquo;
              </p>
            </section>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#256B9A] dark:text-[#79BCE8]" />
              <span>Shareable cards exclude your private journal entries, appreciation notes, and moods.</span>
            </p>
            <button
              type="button"
              onClick={() => onOpenShareCard('weekly')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Weekly Progress Card</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   SCREEN 14: SETTINGS (CUSTOMIZABLE LOCAL REMINDERS + FULL LOCAL DATA MANAGER)
   ============================================================================ */
interface SettingsScreenProps {
  state: DailyTidePersistedState;
  settings: UserSettings;
  rewardSnapshot: RewardAccessSnapshot;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
  onExportLocalData: () => void;
  onImportLocalData: (rawJson: string) => void;
  onDeleteWaterLog: (id: string) => void;
  onDeleteMood: (id: string) => void;
  onDeleteJournal: (id: string) => void;
  onDeleteAppreciation: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  onDeletePositiveThought: (id: string) => void;
  onClearAllApplicationData: () => void;
  onOpenRewardUnlock: () => void;
  onOpenAboutStudio: () => void;
  onReplaySplash: () => void;
  onReplayOnboarding: () => void;
  onReplayQuickGuide: () => void;
}

type RecordManagerTab = 'water' | 'mood' | 'journal' | 'appreciation' | 'habits' | 'thoughts';

const FREQUENCY_LABELS: Record<ReminderFrequency, string> = {
  DAILY: 'Daily',
  WEEKDAYS: 'Weekdays',
  EVERY_2_DAYS: 'Every 2 Days',
  TWICE_DAILY: 'Twice Daily',
  WEEKLY: 'Weekly',
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  state,
  settings,
  rewardSnapshot,
  onUpdateSettings,
  onExportLocalData,
  onImportLocalData,
  onDeleteWaterLog,
  onDeleteMood,
  onDeleteJournal,
  onDeleteAppreciation,
  onDeleteHabit,
  onDeletePositiveThought,
  onClearAllApplicationData,
  onOpenRewardUnlock,
  onOpenAboutStudio,
  onReplaySplash,
  onReplayOnboarding,
  onReplayQuickGuide,
}) => {
  const [nameDraft, setNameDraft] = useState(settings.displayName);
  const [permissionStatus, setPermissionStatus] = useState<BrowserNotificationPermission>(() =>
    getNotificationPermissionStatus()
  );
  const [showRecordsManager, setShowRecordsManager] = useState(false);
  const [recordTab, setRecordTab] = useState<RecordManagerTab>('journal');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const schedule = settings.reminderSchedule;

  const anyReminderEnabled =
    schedule.water.enabled ||
    schedule.reflection.enabled ||
    schedule.habits.enabled ||
    schedule.selfCareCheckIn.enabled ||
    schedule.dailyUse.enabled;

  const updateSchedule = async (
    nextSchedule: LocalReminderPreferences,
    togglingOn: boolean
  ) => {
    // Only request notification permission at the moment the user explicitly turns ON a reminder
    if (togglingOn) {
      const result = await requestNotificationPermissionOnDemand();
      setPermissionStatus(result);
    }
    onUpdateSettings({
      remindersEnabled: nextSchedule.water.enabled,
      reminderIntervalMinutes: nextSchedule.water.intervalMinutes,
      reminderSchedule: nextSchedule,
    });
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportLocalData(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const totalLocalRecords =
    state.waterLogs.length +
    state.moodCheckIns.length +
    state.journalEntries.length +
    state.appreciationAnswers.length +
    state.habits.length +
    (state.positiveThoughts ?? []).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <ScreenHeader
        title="Settings & Local Privacy"
        subtitle="100% offline-first private storage directly on your device. No cloud, no login, no tracking."
      />

      {/* Offline-First Architecture Verification Banner */}
      <section className="rounded-3xl bg-[#EFEAFF] dark:bg-[#231D44] p-5 sm:p-6 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/85 dark:bg-white/10 flex items-center justify-center shrink-0">
            <WifiOff className="w-5 h-5 text-[#6C4FE0] dark:text-[#A994FF]" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-base font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
              Offline-First &amp; Private Storage Active
            </h2>
            <p className="text-xs text-[#554E6E] dark:text-[#C8C3DC] leading-relaxed">
              Every essential feature works in airplane mode. Your journal entries, moods, habits, and hydration logs stay strictly inside local device storage — never sent to cloud databases or advertising services.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-semibold text-[#1E1340] dark:text-[#E5E0F7]">
          <div className="rounded-xl bg-white/75 dark:bg-[#1A1E33]/80 px-3 py-2 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#36B5C4] shrink-0" />
            <span>No Login Needed</span>
          </div>
          <div className="rounded-xl bg-white/75 dark:bg-[#1A1E33]/80 px-3 py-2 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#36B5C4] shrink-0" />
            <span>No Cloud DB</span>
          </div>
          <div className="rounded-xl bg-white/75 dark:bg-[#1A1E33]/80 px-3 py-2 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#36B5C4] shrink-0" />
            <span>Airplane Mode OK</span>
          </div>
          <div className="rounded-xl bg-white/75 dark:bg-[#1A1E33]/80 px-3 py-2 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#36B5C4] shrink-0" />
            <span>Zero Ad Tracking</span>
          </div>
        </div>
      </section>

      {/* Profile & Hydration */}
      <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-5">
        <h2 className="font-display text-lg font-semibold">Personal Profile &amp; Hydration</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Your display name"
            className="flex-1 rounded-xl border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-4 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={() => onUpdateSettings({ displayName: nameDraft.trim() || 'Friend' })}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] cursor-pointer"
          >
            Save Name
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-medium">Water Measurement Unit</span>
          <div className="inline-flex gap-2">
            {(
              [
                ['ML', 'ml'],
                ['L', 'Litres (L)'],
                ['OZ', 'oz'],
              ] as [MeasurementUnit, string][]
            ).map(([u, label]) => (
              <button
                key={u}
                type="button"
                onClick={() => onUpdateSettings({ unit: u })}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                  settings.unit === u
                    ? 'border-[#6C4FE0] bg-[#EFEAFF] dark:bg-[#2E235C] text-[#1E1340] dark:text-white'
                    : 'border-[#E6DFD3] dark:border-[#2E3452] text-[#645F75] dark:text-[#B3AEC4]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Personal Daily Water Target</span>
            <span className="font-semibold text-[#256B9A] dark:text-[#79BCE8] tabular-nums">
              {formatVolume(settings.dailyWaterGoalMl, settings.unit)}
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={3500}
            step={100}
            value={settings.dailyWaterGoalMl}
            onChange={(e) => onUpdateSettings({ dailyWaterGoalMl: Number(e.target.value) })}
            className="w-full accent-[#36B5C4]"
          />
        </div>
      </section>

      {/* Appearance */}
      <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Appearance</h2>
            <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
              Choose Warm Ivory daylight or Midnight Tide dark theme
            </p>
          </div>
          <div className="inline-flex gap-2">
            {(
              [
                ['WARM_IVORY', 'Warm Ivory'],
                ['MIDNIGHT_TIDE', 'Midnight Tide'],
              ] as [ThemeMode, string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => onUpdateSettings({ themeMode: mode })}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                  settings.themeMode === mode
                    ? 'border-[#6C4FE0] bg-[#EFEAFF] dark:bg-[#2E235C] text-[#1E1340] dark:text-white'
                    : 'border-[#E6DFD3] dark:border-[#2E3452] text-[#645F75] dark:text-[#B3AEC4]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Customizable Local Reminders (All 4 Categories + Quiet Hours + On-Demand Permission) */}
      <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF8F4] dark:bg-[#212640] border border-[#E6DFD3] dark:border-[#2E3452] flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-[#6C4FE0] dark:text-[#A994FF]" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Customizable Local Reminders</h2>
              <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                Scheduled locally on your device. Notification permission is requested only when you turn a reminder on.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#FAF8F4] dark:bg-[#212640] border border-[#E6DFD3] dark:border-[#2E3452] text-[#645F75] dark:text-[#B3AEC4]">
            {anyReminderEnabled
              ? permissionStatus === 'granted'
                ? 'Notifications Ready'
                : permissionStatus === 'denied'
                ? 'System Alerts Blocked'
                : 'Local Schedule Active'
              : 'All Reminders Off'}
          </span>
        </div>

        {/* 1. Drinking Water Reminders */}
        <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">1 · Drinking Water Reminders</h3>
              <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                Gentle hydration nudges — automatically skipped when you reach your daily goal.
              </p>
            </div>
            <input
              type="checkbox"
              aria-label="Enable drinking water reminders"
              checked={schedule.water.enabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                void updateSchedule(
                  { ...schedule, water: { ...schedule.water, enabled } },
                  enabled
                );
              }}
              className="h-5 w-5 accent-[#6C4FE0] cursor-pointer"
            />
          </div>
          {schedule.water.enabled && (
            <div className="flex flex-wrap gap-2 pt-1">
              {[60, 90, 120, 180].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() =>
                    void updateSchedule(
                      { ...schedule, water: { ...schedule.water, intervalMinutes: mins } },
                      false
                    )
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer tabular-nums ${
                    schedule.water.intervalMinutes === mins
                      ? 'border-[#6C4FE0] bg-[#EFEAFF] dark:bg-[#2E235C] text-[#1E1340] dark:text-white'
                      : 'border-[#E6DFD3] dark:border-[#2E3452] bg-white dark:bg-[#1A1E33] text-[#645F75] dark:text-[#B3AEC4]'
                  }`}
                >
                  Every {mins} min
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Daily Reflection Reminders */}
        <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">2 · Daily Reflection Reminders</h3>
              <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                A calm cue to pause for your private reflection journal or appreciation vault.
              </p>
            </div>
            <input
              type="checkbox"
              aria-label="Enable daily reflection reminders"
              checked={schedule.reflection.enabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                void updateSchedule(
                  { ...schedule, reflection: { ...schedule.reflection, enabled } },
                  enabled
                );
              }}
              className="h-5 w-5 accent-[#6C4FE0] cursor-pointer"
            />
          </div>
          {schedule.reflection.enabled && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {(['DAILY', 'WEEKDAYS', 'EVERY_2_DAYS'] as ReminderFrequency[]).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() =>
                      void updateSchedule(
                        { ...schedule, reflection: { ...schedule.reflection, frequency: freq } },
                        false
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                      schedule.reflection.frequency === freq
                        ? 'border-[#6C4FE0] bg-[#EFEAFF] dark:bg-[#2E235C] text-[#1E1340] dark:text-white'
                        : 'border-[#E6DFD3] dark:border-[#2E3452] bg-white dark:bg-[#1A1E33] text-[#645F75] dark:text-[#B3AEC4]'
                    }`}
                  >
                    {FREQUENCY_LABELS[freq]}
                  </button>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
                <span>Time</span>
                <input
                  type="time"
                  value={schedule.reflection.preferredTime}
                  onChange={(e) =>
                    void updateSchedule(
                      {
                        ...schedule,
                        reflection: { ...schedule.reflection, preferredTime: e.target.value },
                      },
                      false
                    )
                  }
                  className="rounded-lg border border-[#E6DFD3] dark:border-[#2E3452] bg-white dark:bg-[#1A1E33] px-2.5 py-1 text-xs font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]"
                />
              </label>
            </div>
          )}
        </div>

        {/* 3. Habit Reminders */}
        <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">3 · Habit Reminders</h3>
              <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                Gentle check-ins to support your active personal habits without pressure.
              </p>
            </div>
            <input
              type="checkbox"
              aria-label="Enable habit reminders"
              checked={schedule.habits.enabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                void updateSchedule(
                  { ...schedule, habits: { ...schedule.habits, enabled } },
                  enabled
                );
              }}
              className="h-5 w-5 accent-[#6C4FE0] cursor-pointer"
            />
          </div>
          {schedule.habits.enabled && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {(['DAILY', 'WEEKDAYS', 'TWICE_DAILY'] as ReminderFrequency[]).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() =>
                      void updateSchedule(
                        { ...schedule, habits: { ...schedule.habits, frequency: freq } },
                        false
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                      schedule.habits.frequency === freq
                        ? 'border-[#6C4FE0] bg-[#EFEAFF] dark:bg-[#2E235C] text-[#1E1340] dark:text-white'
                        : 'border-[#E6DFD3] dark:border-[#2E3452] bg-white dark:bg-[#1A1E33] text-[#645F75] dark:text-[#B3AEC4]'
                    }`}
                  >
                    {FREQUENCY_LABELS[freq]}
                  </button>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
                <span>Time</span>
                <input
                  type="time"
                  value={schedule.habits.preferredTime}
                  onChange={(e) =>
                    void updateSchedule(
                      { ...schedule, habits: { ...schedule.habits, preferredTime: e.target.value } },
                      false
                    )
                  }
                  className="rounded-lg border border-[#E6DFD3] dark:border-[#2E3452] bg-white dark:bg-[#1A1E33] px-2.5 py-1 text-xs font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]"
                />
              </label>
            </div>
          )}
        </div>

        {/* 4. Self-Care Check-In Reminders */}
        <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">4 · Self-Care Check-In Reminders</h3>
              <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                A supportive nudge to notice your mood, drop your shoulders, or tend your garden.
              </p>
            </div>
            <input
              type="checkbox"
              aria-label="Enable self-care check-in reminders"
              checked={schedule.selfCareCheckIn.enabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                void updateSchedule(
                  { ...schedule, selfCareCheckIn: { ...schedule.selfCareCheckIn, enabled } },
                  enabled
                );
              }}
              className="h-5 w-5 accent-[#6C4FE0] cursor-pointer"
            />
          </div>
          {schedule.selfCareCheckIn.enabled && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {(['DAILY', 'EVERY_2_DAYS', 'WEEKLY'] as ReminderFrequency[]).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() =>
                      void updateSchedule(
                        {
                          ...schedule,
                          selfCareCheckIn: { ...schedule.selfCareCheckIn, frequency: freq },
                        },
                        false
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                      schedule.selfCareCheckIn.frequency === freq
                        ? 'border-[#6C4FE0] bg-[#EFEAFF] dark:bg-[#2E235C] text-[#1E1340] dark:text-white'
                        : 'border-[#E6DFD3] dark:border-[#2E3452] bg-white dark:bg-[#1A1E33] text-[#645F75] dark:text-[#B3AEC4]'
                    }`}
                  >
                    {FREQUENCY_LABELS[freq]}
                  </button>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
                <span>Time</span>
                <input
                  type="time"
                  value={schedule.selfCareCheckIn.preferredTime}
                  onChange={(e) =>
                    void updateSchedule(
                      {
                        ...schedule,
                        selfCareCheckIn: {
                          ...schedule.selfCareCheckIn,
                          preferredTime: e.target.value,
                        },
                      },
                      false
                    )
                  }
                  className="rounded-lg border border-[#E6DFD3] dark:border-[#2E3452] bg-white dark:bg-[#1A1E33] px-2.5 py-1 text-xs font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]"
                />
              </label>
            </div>
          )}
        </div>

        {/* 5. Daily Use Reminder */}
        <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">5 · Daily Use Reminder</h3>
              <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                One calm daily invitation to open Daily Tide and check in with yourself.
              </p>
            </div>
            <input
              type="checkbox"
              aria-label="Enable daily use reminder"
              checked={schedule.dailyUse.enabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                void updateSchedule(
                  { ...schedule, dailyUse: { ...schedule.dailyUse, enabled } },
                  enabled
                );
              }}
              className="h-5 w-5 accent-[#6C4FE0] cursor-pointer"
            />
          </div>
          {schedule.dailyUse.enabled && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
                Repeats once every day (outside quiet hours)
              </span>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
                <span>Time</span>
                <input
                  type="time"
                  value={schedule.dailyUse.preferredTime}
                  onChange={(e) =>
                    void updateSchedule(
                      {
                        ...schedule,
                        dailyUse: { ...schedule.dailyUse, preferredTime: e.target.value },
                      },
                      false
                    )
                  }
                  className="rounded-lg border border-[#E6DFD3] dark:border-[#2E3452] bg-white dark:bg-[#1A1E33] px-2.5 py-1 text-xs font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]"
                />
              </label>
            </div>
          )}
        </div>

        {/* 6. Post-Use Feedback Notification */}
        <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] p-4 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">6 · Post-Use Feedback Notification</h3>
              <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                {schedule.postUseFeedback.hasBeenSent
                  ? 'Delivered once after use — thank you for sharing time with Daily Tide.'
                  : 'Sends one polite check-in after using Daily Tide inviting optional feedback (never repeats).'}
              </p>
            </div>
            <input
              type="checkbox"
              aria-label="Enable post-use feedback notification"
              checked={schedule.postUseFeedback.enabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                void updateSchedule(
                  {
                    ...schedule,
                    postUseFeedback: { ...schedule.postUseFeedback, enabled },
                  },
                  enabled
                );
              }}
              className="h-5 w-5 accent-[#6C4FE0] cursor-pointer"
            />
          </div>
        </div>

        {/* Quiet Sleep Hours */}
        <div className="pt-3 border-t border-[#EFEAE0] dark:border-[#262B45] flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Quiet Sleep Hours</p>
            <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
              All local notifications pause silently between these times.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="time"
              aria-label="Quiet hours start"
              value={settings.quietHoursStart}
              onChange={(e) => onUpdateSettings({ quietHoursStart: e.target.value })}
              className="rounded-xl border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-2.5 py-1.5"
            />
            <span className="text-[#645F75]">to</span>
            <input
              type="time"
              aria-label="Quiet hours end"
              value={settings.quietHoursEnd}
              onChange={(e) => onUpdateSettings({ quietHoursEnd: e.target.value })}
              className="rounded-xl border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-2.5 py-1.5"
            />
          </div>
        </div>
      </section>

      {/* Local Data Management: Export, Import, Delete Individual Records, Clear All Data */}
      <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FAF8F4] dark:bg-[#212640] border border-[#E6DFD3] dark:border-[#2E3452] flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 text-[#256B9A] dark:text-[#79BCE8]" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Local Data Management</h2>
            <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
              Export or restore your private device backup as JSON, delete individual tracking records, or wipe application storage cleanly.
            </p>
          </div>
        </div>

        {/* Export / Import Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onExportLocalData}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Local Backup (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-semibold border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] text-[#1F1D2B] dark:text-[#F3F0EA] hover:border-[#6C4FE0] transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#256B9A] dark:text-[#79BCE8]" />
            <span>Import Local Backup (JSON)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFileChange}
            className="hidden"
          />
        </div>

        {/* Delete Individual Tracking Records & Journal Entries Browser */}
        <div className="rounded-2xl border border-[#E6DFD3] dark:border-[#2C3250] bg-[#FAF8F4] dark:bg-[#212640] p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Manage &amp; Delete Individual Records</h3>
              <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
                {totalLocalRecords} stored local records across water, moods, journal, appreciations, habits, and thoughts
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRecordsManager((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2E3452] hover:border-[#6C4FE0] cursor-pointer"
            >
              {showRecordsManager ? 'Hide Records' : 'Manage Records'}
            </button>
          </div>

          {showRecordsManager && (
            <div className="space-y-3 pt-2 border-t border-[#E6DFD3]/70 dark:border-[#2C3250]">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['journal', `Journal (${state.journalEntries.length})`],
                    ['water', `Water (${state.waterLogs.length})`],
                    ['mood', `Moods (${state.moodCheckIns.length})`],
                    ['appreciation', `Appreciations (${state.appreciationAnswers.length})`],
                    ['habits', `Habits (${state.habits.length})`],
                    ['thoughts', `Thoughts (${(state.positiveThoughts ?? []).length})`],
                  ] as [RecordManagerTab, string][]
                ).map(([tabId, label]) => (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => setRecordTab(tabId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                      recordTab === tabId
                        ? 'bg-[#1E1340] dark:bg-[#6C4FE0] text-white'
                        : 'bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2E3452] text-[#645F75] dark:text-[#B3AEC4]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {recordTab === 'journal' &&
                  (state.journalEntries.length === 0 ? (
                    <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] py-2">
                      No journal entries stored locally.
                    </p>
                  ) : (
                    state.journalEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-[#1A1E33] px-3.5 py-2.5 border border-[#E6DFD3]/80 dark:border-[#2C3250]"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{entry.title}</p>
                          <p className="text-[11px] text-[#645F75] dark:text-[#B3AEC4] truncate">
                            {formatDateKeyLabel(entry.dateKey)} · {entry.body || 'Guided reflection'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteJournal(entry.id)}
                          aria-label={`Delete journal ${entry.title}`}
                          className="p-1.5 rounded-lg text-[#645F75] hover:text-[#B84A5E] shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ))}

                {recordTab === 'water' &&
                  (state.waterLogs.length === 0 ? (
                    <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] py-2">
                      No hydration records stored locally.
                    </p>
                  ) : (
                    state.waterLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-[#1A1E33] px-3.5 py-2.5 border border-[#E6DFD3]/80 dark:border-[#2C3250]"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold tabular-nums">
                            {formatVolume(log.amountMl, settings.unit)} · {log.vesselName}
                          </p>
                          <p className="text-[11px] text-[#645F75] dark:text-[#B3AEC4]">
                            {formatDateKeyLabel(log.dateKey)} ·{' '}
                            {new Date(log.loggedAtMillis).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteWaterLog(log.id)}
                          aria-label="Delete water record"
                          className="p-1.5 rounded-lg text-[#645F75] hover:text-[#B84A5E] shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ))}

                {recordTab === 'mood' &&
                  (state.moodCheckIns.length === 0 ? (
                    <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] py-2">
                      No mood check-ins stored locally.
                    </p>
                  ) : (
                    state.moodCheckIns.map((mood) => {
                      const def = MOOD_DEFINITIONS.find((m) => m.level === mood.moodLevel);
                      return (
                        <div
                          key={mood.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-[#1A1E33] px-3.5 py-2.5 border border-[#E6DFD3]/80 dark:border-[#2C3250]"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold">
                              {def?.label ?? 'Steady'} · {formatDateKeyLabel(mood.dateKey)}
                            </p>
                            <p className="text-[11px] text-[#645F75] dark:text-[#B3AEC4] truncate">
                              {mood.note || mood.tags.join(', ') || 'Quick mood check-in'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteMood(mood.id)}
                            aria-label="Delete mood record"
                            className="p-1.5 rounded-lg text-[#645F75] hover:text-[#B84A5E] shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  ))}

                {recordTab === 'appreciation' &&
                  (state.appreciationAnswers.length === 0 ? (
                    <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] py-2">
                      No self-appreciation notes stored locally.
                    </p>
                  ) : (
                    state.appreciationAnswers.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-[#1A1E33] px-3.5 py-2.5 border border-[#E6DFD3]/80 dark:border-[#2C3250]"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{item.answerText}</p>
                          <p className="text-[11px] text-[#645F75] dark:text-[#B3AEC4] truncate">
                            {formatDateKeyLabel(item.dateKey)} · {item.promptText}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteAppreciation(item.id)}
                          aria-label="Delete appreciation record"
                          className="p-1.5 rounded-lg text-[#645F75] hover:text-[#B84A5E] shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ))}

                {recordTab === 'habits' &&
                  (state.habits.length === 0 ? (
                    <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] py-2">
                      No habits stored locally.
                    </p>
                  ) : (
                    state.habits.map((habit) => (
                      <div
                        key={habit.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-[#1A1E33] px-3.5 py-2.5 border border-[#E6DFD3]/80 dark:border-[#2C3250]"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{habit.title}</p>
                          <p className="text-[11px] text-[#645F75] dark:text-[#B3AEC4]">
                            {habit.timeOfDay} · {habit.completedDates.length} completions
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteHabit(habit.id)}
                          aria-label={`Delete habit ${habit.title}`}
                          className="p-1.5 rounded-lg text-[#645F75] hover:text-[#B84A5E] shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ))}

                {recordTab === 'thoughts' &&
                  ((state.positiveThoughts ?? []).length === 0 ? (
                    <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] py-2">
                      No positive thoughts stored locally.
                    </p>
                  ) : (
                    (state.positiveThoughts ?? []).map((pt) => (
                      <div
                        key={pt.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-[#1A1E33] px-3.5 py-2.5 border border-[#E6DFD3]/80 dark:border-[#2C3250]"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold italic truncate">
                            &ldquo;{pt.text}&rdquo;
                          </p>
                          <p className="text-[11px] text-[#645F75] dark:text-[#B3AEC4]">
                            {formatDateKeyLabel(pt.dateKey)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeletePositiveThought(pt.id)}
                          aria-label="Delete positive thought"
                          className="p-1.5 rounded-lg text-[#645F75] hover:text-[#B84A5E] shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Clear All Application Data */}
        <div className="pt-2 border-t border-[#EFEAE0] dark:border-[#262B45] flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#B84A5E]">Clear Application Data</p>
            <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
              Permanently erase all local logs, journals, moods, habits, and reminders on this device.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#B84A5E] border border-[#B84A5E]/40 hover:bg-[#B84A5E]/10 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        </div>
      </section>

      {/* Navigation to Dedicated Screens 15, 16 & Launch Experience */}
      <div className="space-y-3">
        <ShortcutRow
          meta={`${rewardSnapshot.unlockedLevelIds.length} of ${rewardSnapshot.levels.length} timed levels active`}
          title="Rewarded Access Manager"
          subtitle="Free essentials forever + optional timed access to special collections & visual themes."
          icon={<Gift className="w-5 h-5 text-[#6C4FE0] dark:text-[#A994FF]" />}
          onClick={onOpenRewardUnlock}
        />

        <ShortcutRow
          meta="Violet Dolphin Studio"
          title="About Violet Dolphin Studio"
          subtitle="Our offline-first manifesto, studio crest, and calm product philosophy."
          icon={<Info className="w-5 h-5 text-[#256B9A] dark:text-[#79BCE8]" />}
          onClick={onOpenAboutStudio}
        />
      </div>

      {/* Preview Flow Controls */}
      <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
          Launch Experience
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onReplayQuickGuide}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#6C4FE0]/40 bg-[#EFEAFF]/60 dark:bg-[#2A2252] text-[#1E1340] dark:text-[#F3F0EA] hover:border-[#6C4FE0] cursor-pointer"
          >
            How to Use Guide
          </button>
          <button
            type="button"
            onClick={onReplaySplash}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#E6DFD3] dark:border-[#2E3452] hover:border-[#6C4FE0] cursor-pointer"
          >
            Preview Splash
          </button>
          <button
            type="button"
            onClick={onReplayOnboarding}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#E6DFD3] dark:border-[#2E3452] hover:border-[#6C4FE0] cursor-pointer"
          >
            Change Name &amp; Setup
          </button>
        </div>
      </section>

      {/* Clear All Application Data Confirmation Modal */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 text-[#B84A5E]">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="font-display text-lg font-semibold">Clear All Application Data?</h3>
              </div>
              <button
                type="button"
                aria-label="Close confirmation"
                onClick={() => setShowClearConfirm(false)}
                className="p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[#645F75] dark:text-[#B3AEC4] leading-relaxed">
              This permanently removes every water log, mood check-in, private journal entry, self-appreciation note, habit, and reminder schedule from your device. Consider exporting a local JSON backup first.
            </p>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onExportLocalData();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#E6DFD3] dark:border-[#2E3452] text-[#256B9A] dark:text-[#79BCE8] cursor-pointer"
              >
                Export Backup First
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#645F75] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearAllApplicationData();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#B84A5E] text-white hover:opacity-90 cursor-pointer"
              >
                Yes, Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   SCREEN 15: REWARDED ACCESS MANAGER (GOOGLE ADMOB REWARDED ADS + UMP CONSENT)
   ============================================================================ */
interface RewardUnlockScreenProps {
  rewardSnapshot: RewardAccessSnapshot;
  consentState: PrivacyConsentState;
  onRequestOptionalAdUnlock: (levelId: RewardLevelId) => void;
  onOpenPrivacyConsent: () => void;
  onExpireLevelNowForTesting: (levelId: RewardLevelId) => void;
  onOpenRewardFeature: (route: 'motivation' | 'journal' | 'challenges' | 'share' | 'hydration') => void;
  onBack: () => void;
}

function formatRewardTimestamp(millis: number | null): string {
  if (millis === null) return '—';
  return new Date(millis).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const RewardUnlockScreen: React.FC<RewardUnlockScreenProps> = ({
  rewardSnapshot,
  consentState,
  onRequestOptionalAdUnlock,
  onOpenPrivacyConsent,
  onExpireLevelNowForTesting,
  onOpenRewardFeature,
  onBack,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ScreenHeader
        title="Rewarded Access (Google AdMob)"
        subtitle="Optional Google Mobile Ads rewarded videos using official test unit IDs. Essential self-care stays Free Level forever and works offline."
        onBack={onBack}
      />

      {/* FREE LEVEL — NEVER LOCKED BEHIND ADS */}
      <section className="rounded-3xl bg-[#EFEAFF] dark:bg-[#231D44] border border-[#DFD5FA] dark:border-[#342B61] p-6 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/85 dark:bg-white/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#6C4FE0] dark:text-[#A994FF]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C4FE0] dark:text-[#A994FF]">
                Free Level · Always Unlocked Forever
              </p>
              <h2 className="font-display text-lg font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
                Core Self-Care Never Requires Ads
              </h2>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-white/80 dark:bg-[#1A1E33] text-[#1E1340] dark:text-[#E5E0F7]">
            5 Core Features · Permanent Free Access
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {FREE_LEVEL_FEATURES.map((feat) => (
            <div
              key={feat.id}
              className="rounded-2xl bg-white/80 dark:bg-[#1A1E33]/85 px-4 py-3 space-y-1 border border-white/60 dark:border-[#2C3250]"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#36B5C4] shrink-0" />
                <span>{feat.title}</span>
              </div>
              <p className="text-[11px] text-[#554E6E] dark:text-[#B3AEC4] leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* GOOGLE UMP PRIVACY CONSENT & TEST AD CONFIGURATION */}
      <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#256B9A] dark:text-[#79BCE8]">
            Google Mobile Ads SDK · Official Test Configuration &amp; UMP Privacy Consent
          </p>
          <p className="text-sm font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
            {consentState.statusLabel}
          </p>
          <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
            Development Test Ad Unit ID:{' '}
            <code className="font-mono-code text-[#6C4FE0] dark:text-[#A994FF]">
              {ADMOB_OFFICIAL_TEST_REWARDED_AD_UNIT_ID}
            </code>
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenPrivacyConsent}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] hover:border-[#6C4FE0] whitespace-nowrap cursor-pointer"
        >
          Manage Ad Privacy Choices
        </button>
      </section>

      {/* CONFIGURABLE TIMED REWARD LEVELS 1 - 5 */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Optional Timed Reward Levels (Levels 1–5)
            </h2>
            <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
              Select any level to view pre-ad disclosure details (feature, duration, optionality) before loading a Google test rewarded video. Unlocked levels remain available offline until expiration.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] tabular-nums">
            {rewardSnapshot.unlockedLevelIds.length} / {rewardSnapshot.levels.length} Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewardSnapshot.levels.map((level) => {
            const featureRoute: 'motivation' | 'journal' | 'challenges' | 'share' | 'hydration' =
              level.config.id === 'level_4_visual_themes'
                ? 'share'
                : level.config.linkedRoute === 'settings'
                ? 'share'
                : level.config.linkedRoute;

            return (
              <div
                key={level.config.id}
                className={`rounded-3xl p-6 border flex flex-col justify-between gap-4 transition-colors ${
                  level.isUnlocked
                    ? 'bg-white dark:bg-[#1A1E33] border-[#36B5C4]/70 dark:border-[#36B5C4]/55'
                    : level.status === 'EXPIRED'
                    ? 'bg-white dark:bg-[#1A1E33] border-[#D9825B]/50'
                    : 'bg-white dark:bg-[#1A1E33] border-[#E6DFD3] dark:border-[#2C3250]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
                      {level.config.badgeLabel} · {level.config.durationHours}h Access · {level.config.requiredAdsCount} Rewarded Ad
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                        level.status === 'UNLOCKED'
                          ? 'bg-[#E4F7F9] dark:bg-[#163644] text-[#133A56] dark:text-[#79BCE8]'
                          : level.status === 'EXPIRED'
                          ? 'bg-[#FDF0EB] dark:bg-[#3A2220] text-[#9E4228] dark:text-[#F2A78D]'
                          : 'bg-[#FAF8F4] dark:bg-[#212640] text-[#645F75] dark:text-[#B3AEC4]'
                      }`}
                    >
                      {level.status === 'UNLOCKED' ? (
                        <Unlock className="w-3 h-3" />
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                      <span>{level.status}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      {level.config.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#645F75] dark:text-[#B3AEC4] leading-relaxed">
                      {level.config.featureSummary}
                    </p>
                  </div>

                  {/* Timestamps & Live Remaining Access Display */}
                  <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] p-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[#645F75] dark:text-[#B3AEC4]">
                        <Clock className="w-3.5 h-3.5 text-[#36B5C4]" />
                        <span>Remaining Access</span>
                      </span>
                      <span
                        className={`font-semibold tabular-nums ${
                          level.isUnlocked
                            ? 'text-[#256B9A] dark:text-[#79BCE8]'
                            : 'text-[#645F75] dark:text-[#B3AEC4]'
                        }`}
                      >
                        {level.isUnlocked
                          ? level.remainingFormatted
                          : level.status === 'EXPIRED'
                          ? 'Expired (auto-locked)'
                          : 'Locked'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[#645F75] dark:text-[#B3AEC4]">
                      <span>Unlocked At</span>
                      <span className="tabular-nums font-medium text-[#1F1D2B] dark:text-[#E5E0F7]">
                        {formatRewardTimestamp(level.unlockedAtMillis)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[#645F75] dark:text-[#B3AEC4]">
                      <span>Expires At</span>
                      <span className="tabular-nums font-medium text-[#1F1D2B] dark:text-[#E5E0F7]">
                        {formatRewardTimestamp(level.expiresAtMillis)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Controls: Explicit Optional Ad Unlock + Open Feature + Expiration Test */}
                <div className="space-y-2 pt-2 border-t border-[#EFEAE0] dark:border-[#262B45]">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onRequestOptionalAdUnlock(level.config.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] transition-colors cursor-pointer"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>
                        {level.isUnlocked
                          ? `Renew +${level.config.durationHours}h (Optional Ad)`
                          : `Unlock for ${level.config.durationHours}h (Optional Ad)`}
                      </span>
                    </button>

                    {level.isUnlocked && (
                      <button
                        type="button"
                        onClick={() => onOpenRewardFeature(featureRoute)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#E4F7F9] dark:bg-[#163644] text-[#133A56] dark:text-[#79BCE8] hover:opacity-90 cursor-pointer"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {level.isUnlocked && (
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[#645F75] dark:text-[#B3AEC4]">
                      <span className="inline-flex items-center gap-1">
                        <WifiOff className="w-3 h-3 text-[#36B5C4]" />
                        <span>Available offline until expiry</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onExpireLevelNowForTesting(level.config.id)}
                        className="font-semibold text-[#B84A5E] hover:underline cursor-pointer"
                      >
                        Simulate Expiration (Dev)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* REWARD HISTORY LOG */}
      <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#256B9A] dark:text-[#79BCE8]" />
            <div>
              <h2 className="font-display text-base font-semibold">Reward History</h2>
              <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                Persisted locally on this device — logs only verified completions, renewals, and expirations (never early dismissals or failed ads).
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
            {rewardSnapshot.history.length} events
          </span>
        </div>

        {rewardSnapshot.history.length === 0 ? (
          <EmptySanctuaryState
            title="No reward events yet"
            subtitle="Choose any optional level above to review pre-ad details and test Google AdMob rewarded video outcomes."
          />
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {rewardSnapshot.history.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-[#EFEAE0] dark:border-[#2C3250]"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        entry.eventType === 'EXPIRED'
                          ? 'bg-[#FDF0EB] dark:bg-[#3A2220] text-[#9E4228] dark:text-[#F2A78D]'
                          : entry.eventType === 'RENEWED'
                          ? 'bg-[#EFEAFF] dark:bg-[#2E235C] text-[#6C4FE0] dark:text-[#A994FF]'
                          : 'bg-[#E4F7F9] dark:bg-[#163644] text-[#133A56] dark:text-[#79BCE8]'
                      }`}
                    >
                      {entry.eventType}
                    </span>
                    <span className="text-xs font-semibold">
                      Level {entry.levelNumber} · {entry.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
                    Unlocked {formatRewardTimestamp(entry.unlockedAtMillis)} → Expires{' '}
                    {formatRewardTimestamp(entry.expiresAtMillis)} ({entry.durationHours}h ·{' '}
                    {entry.verificationSource})
                  </p>
                </div>
                <span className="text-[11px] text-[#645F75] dark:text-[#B3AEC4] tabular-nums shrink-0">
                  {formatRewardTimestamp(entry.timestampMillis)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* TRANSPARENT ARCHITECTURE & PRIVACY ISOLATION NOTE */}
      <section className="rounded-3xl bg-[#FAF8F4] dark:bg-[#191D31] border border-[#E6DFD3] dark:border-[#2C3250] p-5 sm:p-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#256B9A] dark:text-[#79BCE8] shrink-0 mt-0.5" />
        <div className="space-y-1.5 text-xs text-[#554E6E] dark:text-[#C8C3DC] leading-relaxed">
          <p className="font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
            Separated Ad Layer, Zero Firebase &amp; Local Security Disclosure
          </p>
          <p>
            Advertising logic is isolated inside the dedicated <code className="px-1 py-0.5 rounded bg-white dark:bg-[#242942]">ads</code> module using official Google Mobile Ads SDK test IDs (<code className="px-1 py-0.5 rounded bg-white dark:bg-[#242942]">{ADMOB_OFFICIAL_TEST_REWARDED_AD_UNIT_ID}</code>) and Google UMP consent. No Firebase or cloud backend is used.
          </p>
          <p>
            Earned rewards are persisted locally and checked against device time for seamless offline access after unlocking (not tamper-proof locally; server-side verification can be plugged into <code className="px-1 py-0.5 rounded bg-white dark:bg-[#242942]">RewardVerificationProvider</code> later). Personal journal entries, moods, and hydration logs are never sent to advertising services.
          </p>
        </div>
      </section>
    </div>
  );
};

/* ============================================================================
   SCREEN 16: ABOUT VIOLET DOLPHIN STUDIO
   ============================================================================ */
interface AboutStudioScreenProps {
  onBack: () => void;
}

export const AboutStudioScreen: React.FC<AboutStudioScreenProps> = ({ onBack }) => {
  const [copiedUpi, setCopiedUpi] = useState(false);

  const handleCopyUpi = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(DEVELOPER_UPI_ID).then(() => {
        setCopiedUpi(true);
        window.setTimeout(() => setCopiedUpi(false), 2500);
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <ScreenHeader
        title="About Violet Dolphin Studio"
        subtitle="Thoughtful, private mobile craft designed to support healthier everyday lives."
        onBack={onBack}
      />

      <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-8 sm:p-10 text-center space-y-5">
        <img
          src={STUDIO_LOGO_PATH}
          alt="Violet Dolphin Studio Logo"
          referrerPolicy="no-referrer"
          className="mx-auto w-36 h-36 rounded-3xl object-cover shadow-md border border-[#E6DFD3] dark:border-[#2C3250]"
        />
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
            Violet Dolphin Studio
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
            Build · Train · Grow
          </p>
          <p className="mt-1 text-sm text-[#645F75] dark:text-[#B3AEC4]">
            Smart Tools. Healthier You.™
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-2.5">
          <h3 className="font-display text-base font-semibold">100% Offline-First Craft</h3>
          <p className="text-sm text-[#645F75] dark:text-[#B3AEC4] leading-relaxed">
            Daily Tide runs completely locally on your device. No remote accounts, no cloud tracking, and no internet needed after install.
          </p>
        </section>

        <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-2.5">
          <h3 className="font-display text-base font-semibold">Healthy, Ethical Retention</h3>
          <p className="text-sm text-[#645F75] dark:text-[#B3AEC4] leading-relaxed">
            We replace manipulative streaks, forced ads, and guilt alerts with a growing Progress Garden, daily self-care quests, and gentle restarts that protect every milestone you earned.
          </p>
        </section>
      </div>

      <section className="rounded-3xl bg-[#EFEAFF] dark:bg-[#231D44] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-display text-sm font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
            Daily Tide · Version 1.0.0
          </p>
          <p className="text-xs text-[#554E6E] dark:text-[#C8C3DC]">
            Package ID: com.violetdolphinstudio.dailytide
          </p>
        </div>
        <span className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
          Little habits. Better days.
        </span>
      </section>

      {/* Buy Me a Coffee / Help This Developer QR Scanner Section */}
      <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF3E0] dark:bg-[#3A2B1D] flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5 text-[#C2781A] dark:text-[#F6C177]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6C4FE0] dark:text-[#A994FF]">
                Optional Support · Thank You
              </p>
              <h3 className="font-display text-xl font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
                Buy Me a Coffee · Help This Developer
              </h3>
              <p className="mt-1 text-sm text-[#645F75] dark:text-[#B3AEC4] leading-relaxed">
                Daily Tide is crafted independently at Violet Dolphin Studio with no forced paywalls or data tracking. If this app brings calm to your day, you can scan the UPI QR code below to support future updates.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center text-center gap-4 rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] border border-[#EFEAE0] dark:border-[#2C3250] p-6">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#E6DFD3]">
            <img
              src={DEVELOPER_COFFEE_QR_PATH}
              alt="UPI QR code to buy Khushal at Violet Dolphin Studio a coffee"
              referrerPolicy="no-referrer"
              className="w-60 sm:w-64 h-auto rounded-xl object-contain"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
              Scan with any UPI app (Google Pay, PhonePe, Paytm, BHIM)
            </p>
            <div className="inline-flex flex-wrap items-center justify-center gap-2">
              <code className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2E3452] text-xs font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
                {DEVELOPER_UPI_ID}
              </code>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] transition-colors cursor-pointer"
              >
                {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUpi ? 'UPI ID Copied!' : 'Copy UPI ID'}</span>
              </button>
            </div>
          </div>

          <p className="inline-flex items-center gap-1.5 text-xs text-[#645F75] dark:text-[#B3AEC4] pt-1">
            <Heart className="w-3.5 h-3.5 text-[#D96B84]" />
            <span>Every coffee helps keep Daily Tide calm, offline-first, and improving for everyone.</span>
          </p>
        </div>
      </section>
    </div>
  );
};

import React from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  Heart,
  Share2,
  Smile,
  Sparkles,
} from 'lucide-react';
import {
  Affirmation,
  AchievementBadge,
  AppreciationPrompt,
  ConsistencyMetrics,
  DailyQuestId,
  HabitItem,
  MeasurementUnit,
  MoodCheckIn,
  WaterVessel,
} from '../types/dailyTide';
import {
  DAILY_SELF_CARE_QUESTS,
  MOOD_DEFINITIONS,
  formatVolume,
  getTodayKey,
} from '../data/localStore';
import { HydrationWaveWidget } from '../components/HydrationWaveWidget';
import { ProgressGardenCanvas } from '../components/ProgressGardenCanvas';
import { ProgressRing, ShortcutRow } from '../components/TidePrimitives';

interface HomeDashboardScreenProps {
  todayKey?: string;
  displayName: string;
  unit: MeasurementUnit;
  consumedMl: number;
  goalMl: number;
  vessels: WaterVessel[];
  canUndoWater: boolean;
  latestTodayMood: MoodCheckIn | null;
  todayAffirmation: Affirmation;
  completedQuestIds: DailyQuestId[];
  consistency: ConsistencyMetrics;
  todayPrompt: AppreciationPrompt;
  habits: HabitItem[];
  badges: AchievementBadge[];
  onQuickAddWater: (vessel: WaterVessel) => void;
  onUndoWater: () => void;
  onToggleHabit: (habitId: string) => void;
  onToggleQuest: (questId: DailyQuestId) => void;
  onToggleAffirmationFavorite: (affirmationId: string) => void;
  onNavigate: (
    dest:
      | 'hydration'
      | 'mood'
      | 'journal'
      | 'motivation'
      | 'habits'
      | 'challenges'
      | 'achievements'
      | 'progress'
      | 'weekly'
  ) => void;
  onOpenShareCard: (mode?: 'achievement' | 'motivation' | 'weekly' | 'milestone') => void;
}

export const HomeDashboardScreen: React.FC<HomeDashboardScreenProps> = ({
  todayKey: todayKeyProp,
  displayName,
  unit,
  consumedMl,
  goalMl,
  vessels,
  canUndoWater,
  latestTodayMood,
  todayAffirmation,
  completedQuestIds,
  consistency,
  todayPrompt,
  habits,
  badges,
  onQuickAddWater,
  onUndoWater,
  onToggleHabit,
  onToggleQuest,
  onToggleAffirmationFavorite,
  onNavigate,
  onOpenShareCard,
}) => {
  const todayKey = todayKeyProp ?? getTodayKey();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const activeHabits = habits.filter((h) => !h.isPaused);
  const completedHabitsCount = activeHabits.filter((h) =>
    h.completedDates.includes(todayKey)
  ).length;
  const habitsProgress =
    activeHabits.length > 0 ? completedHabitsCount / activeHabits.length : 0;
  const hydrationProgress = Math.min(consumedMl / Math.max(goalMl, 1), 1);
  const questsProgress = completedQuestIds.length / DAILY_SELF_CARE_QUESTS.length;

  const unlockedBadges = badges.filter((b) => b.unlockedAtMillis !== null);
  const nextBadge = badges.find((b) => b.unlockedAtMillis === null) ?? badges[0];
  const moodDef = latestTodayMood
    ? MOOD_DEFINITIONS.find((m) => m.level === latestTodayMood.moodLevel)
    : null;

  return (
    <div className="space-y-6">
      {/* Greeting Header & Today's Date */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
            {formattedDate} · {consistency.currentPositiveStreak} {consistency.currentPositiveStreak === 1 ? 'day' : 'days'} positive flow
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-[#1F1D2B] dark:text-[#F3F0EA]">
            {greeting}, {displayName || 'Friend'}
          </h1>
          <p className="mt-1 text-sm text-[#645F75] dark:text-[#B3AEC4]">
            Little habits. Better days — move at a calm, steady pace today.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenShareCard('achievement')}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#E6DFD3] dark:border-[#2C3250] bg-white dark:bg-[#1A1E33] text-[#1F1D2B] dark:text-[#F3F0EA] hover:border-[#6C4FE0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-[#6C4FE0] dark:text-[#A994FF]" />
          <span>Share Tide Card</span>
        </button>
      </div>

      {/* Visually Attractive Daily Progress Section (3 Interactive Progress Rings) */}
      <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]">
              Today&apos;s Tide Balance
            </h2>
            <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
              +{consistency.todayPoints} Tide Points today · Select any ring to open its tracker
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('progress')}
            className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF] hover:underline whitespace-nowrap cursor-pointer"
          >
            Garden &amp; Progress
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <div className="flex flex-col items-center text-center">
            <ProgressRing
              progress={hydrationProgress}
              size={88}
              strokeWidth={8}
              colorClass="text-[#36B5C4]"
              onClick={() => onNavigate('hydration')}
              ariaLabel="Open Hydration Tracker"
            />
            <p className="mt-2.5 font-display text-sm font-semibold">Hydration</p>
            <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
              {formatVolume(consumedMl, unit)}
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <ProgressRing
              progress={habitsProgress}
              size={88}
              strokeWidth={8}
              colorClass="text-[#6C4FE0] dark:text-[#A994FF]"
              onClick={() => onNavigate('habits')}
              ariaLabel="Open Habit Tracker"
            />
            <p className="mt-2.5 font-display text-sm font-semibold">Habits</p>
            <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
              {completedHabitsCount} of {activeHabits.length} done
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <ProgressRing
              progress={questsProgress}
              size={88}
              strokeWidth={8}
              colorClass="text-[#256B9A] dark:text-[#79BCE8]"
              onClick={() => onNavigate('challenges')}
              ariaLabel="Open Daily Self-Care Quests"
            />
            <p className="mt-2.5 font-display text-sm font-semibold">Daily Quests</p>
            <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
              {completedQuestIds.length} of {DAILY_SELF_CARE_QUESTS.length} done
            </p>
          </div>
        </div>
      </section>

      {/* Main 2-Column Editorial Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Daily Motivation + Progress Garden + Hydration + Self-Care Tasks */}
        <div className="lg:col-span-7 space-y-6">
          {/* Daily Motivational Message (Fresh offline daily quote) */}
          <section className="rounded-3xl bg-[#EFEAFF] dark:bg-[#231D44] p-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => onNavigate('motivation')}
              className="text-left flex-1 cursor-pointer"
            >
              <p className="text-xs font-medium text-[#6C4FE0] dark:text-[#A994FF]">
                Daily Motivation · {todayAffirmation.toneCategory}
              </p>
              <p className="mt-2 font-display text-lg sm:text-xl font-medium text-[#1E1340] dark:text-[#F3F0EA] leading-snug">
                {todayAffirmation.text}
              </p>
            </button>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                type="button"
                aria-label="Favorite affirmation"
                onClick={() => onToggleAffirmationFavorite(todayAffirmation.id)}
                className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-2xl bg-white/75 dark:bg-white/10 text-[#6C4FE0] dark:text-[#A994FF] hover:scale-105 transition-transform cursor-pointer"
              >
                <Heart className={`w-4 h-4 ${todayAffirmation.isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                aria-label="Share daily motivation card"
                onClick={() => onOpenShareCard('motivation')}
                className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-2xl bg-white/75 dark:bg-white/10 text-[#256B9A] dark:text-[#79BCE8] hover:scale-105 transition-transform cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Compact Animated Offline Progress Garden */}
          <ProgressGardenCanvas
            gardenStage={consistency.gardenStage}
            stageProgress={consistency.gardenStageProgress}
            totalTidePoints={consistency.totalTidePoints}
            todayPoints={consistency.todayPoints}
            pointsToNextStage={consistency.pointsToNextStage}
            unlockedBadges={unlockedBadges}
            compact
            onInspectGarden={() => onNavigate('progress')}
          />

          {/* Hydration Progress Wave */}
          <HydrationWaveWidget
            consumedMl={consumedMl}
            goalMl={goalMl}
            unit={unit}
            vessels={vessels}
            canUndo={canUndoWater}
            onQuickAdd={onQuickAddWater}
            onUndo={onUndoWater}
            onOpenManageVessels={() => onNavigate('hydration')}
          />

          {/* Today's Self-Care Tasks */}
          <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Today&apos;s Self-Care Tasks</h2>
                <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                  Check off habits calmly as your day unfolds
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('habits')}
                className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF] hover:underline cursor-pointer"
              >
                All Habits
              </button>
            </div>

            {habits.length === 0 ? (
              <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] p-6 text-center">
                <p className="text-sm font-medium">No active habits yet.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('habits')}
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white cursor-pointer"
                >
                  Create a Habit
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#EFEAE0] dark:divide-[#262B45]">
                {habits.map((habit) => {
                  const completed = habit.completedDates.includes(todayKey);
                  return (
                    <button
                      key={habit.id}
                      type="button"
                      disabled={habit.isPaused}
                      onClick={() => onToggleHabit(habit.id)}
                      className="w-full py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4 text-left group cursor-pointer disabled:opacity-55"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {completed ? (
                          <CheckCircle2 className="w-6 h-6 text-[#6C4FE0] dark:text-[#A994FF] shrink-0" />
                        ) : (
                          <Circle className="w-6 h-6 text-[#A39CB3] group-hover:text-[#6C4FE0] shrink-0 transition-colors" />
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${completed ? 'line-through opacity-65' : ''}`}>
                            {habit.title}
                          </p>
                          <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] truncate">
                            {habit.timeOfDay}
                            {habit.isPaused
                              ? ' · Paused for rest'
                              : habit.description
                              ? ` · ${habit.description}`
                              : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {Array.from({ length: 5 }, (_, idx) => {
                          const key = getTodayKey(-(4 - idx));
                          const done = habit.completedDates.includes(key);
                          return (
                            <span
                              key={key}
                              className={`w-2 h-2 rounded-full ${
                                done ? 'bg-[#36B5C4]' : 'bg-[#EAE4DA] dark:bg-[#2F3554]'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Daily Self-Care Quests Quick Card, Mood, Reflection, Achievement Progress */}
        <div className="lg:col-span-5 space-y-4">
          {/* Interactive Daily Self-Care Quests Preview */}
          <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#256B9A] dark:text-[#79BCE8] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Daily Self-Care Quests</span>
                </p>
                <h2 className="mt-0.5 font-display text-base font-semibold">
                  {completedQuestIds.length} of {DAILY_SELF_CARE_QUESTS.length} nurtured today
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('challenges')}
                className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF] hover:underline cursor-pointer"
              >
                All Quests
              </button>
            </div>

            <div className="space-y-2">
              {DAILY_SELF_CARE_QUESTS.map((quest) => {
                const done = completedQuestIds.includes(quest.id);
                return (
                  <button
                    key={quest.id}
                    type="button"
                    onClick={() => onToggleQuest(quest.id)}
                    className="w-full flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 bg-[#FAF8F4] dark:bg-[#212640] hover:border-[#6C4FE0] border border-transparent text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-[#6C4FE0] dark:text-[#A994FF] shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#A39CB3] shrink-0" />
                      )}
                      <span
                        className={`text-xs font-medium truncate ${
                          done ? 'line-through opacity-65' : ''
                        }`}
                      >
                        {quest.title}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#256B9A] dark:text-[#79BCE8] shrink-0 tabular-nums">
                      +{quest.points}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <ShortcutRow
            meta={moodDef ? `Checked in · ${moodDef.label}` : 'Mood Check-In'}
            title={moodDef ? `Feeling ${moodDef.label} today` : 'How does your tide feel?'}
            subtitle={
              moodDef
                ? moodDef.gentleSummary
                : 'Take 10 calm seconds to log your emotional tide and context.'
            }
            icon={<Smile className="w-5 h-5 text-[#6C4FE0] dark:text-[#A994FF]" />}
            onClick={() => onNavigate('mood')}
          />

          <ShortcutRow
            meta={`Daily Reflection · ${todayPrompt.category}`}
            title="Self-Reflection & Appreciation"
            subtitle={todayPrompt.promptText}
            icon={<BookOpen className="w-5 h-5 text-[#256B9A] dark:text-[#79BCE8]" />}
            onClick={() => onNavigate('journal')}
          />

          {/* Achievement Progress Card */}
          <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">Achievement Progress</h2>
              <button
                type="button"
                onClick={() => onNavigate('achievements')}
                className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF] hover:underline cursor-pointer"
              >
                View Collection
              </button>
            </div>

            <div className="flex items-center gap-4">
              <ProgressRing
                progress={unlockedBadges.length / Math.max(badges.length, 1)}
                size={68}
                strokeWidth={7}
                colorClass="text-[#6C4FE0] dark:text-[#A994FF]"
                centerLabel={`${unlockedBadges.length}/${badges.length}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]">
                  {nextBadge ? `Next: ${nextBadge.title}` : 'All milestones unlocked'}
                </p>
                <p className="mt-0.5 text-xs text-[#645F75] dark:text-[#B3AEC4] leading-relaxed">
                  {nextBadge
                    ? `${nextBadge.description} (${nextBadge.progressCurrent}/${nextBadge.progressTarget})`
                    : 'Celebrate your calm consistency with a shareable card.'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#EFEAE0] dark:border-[#262B45] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onNavigate('weekly')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#256B9A] dark:text-[#79BCE8] hover:underline cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Open Weekly Recap</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('achievements')}
                className="text-xs font-medium text-[#645F75] dark:text-[#B3AEC4] hover:text-[#6C4FE0] cursor-pointer"
              >
                All {badges.length} Badges
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

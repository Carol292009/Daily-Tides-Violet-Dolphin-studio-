import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Sprout,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import {
  DailyChallengeRecord,
  DailyQuestId,
  GardenStageInfo,
  HabitItem,
  HabitTimeOfDay,
  PositiveThoughtEntry,
  SelfCareChallenge,
} from '../types/dailyTide';
import {
  CURATED_CHALLENGES,
  DAILY_SELF_CARE_QUESTS,
  getTodayKey,
} from '../data/localStore';
import { RewardLevelSnapshot } from '../rewards/rewardAccessManager';
import { LEVEL_3_SPECIAL_CHALLENGES } from '../rewards/rewardContentCatalog';
import {
  EmptySanctuaryState,
  ProgressRing,
  ScreenHeader,
} from '../components/TidePrimitives';

/* ============================================================================
   SCREEN 9: HABIT TRACKER (FEATURE 6 — CREATE, EDIT, COMPLETE, PAUSE, DELETE)
   ============================================================================ */
interface HabitTrackerScreenProps {
  todayKey: string;
  habits: HabitItem[];
  onToggleHabit: (id: string) => void;
  onCreateHabit: (title: string, description: string, timeOfDay: HabitTimeOfDay) => void;
  onEditHabit: (id: string, title: string, description: string, timeOfDay: HabitTimeOfDay) => void;
  onTogglePause: (id: string) => void;
  onDeleteHabit: (id: string) => void;
}

export const HabitTrackerScreen: React.FC<HabitTrackerScreenProps> = ({
  todayKey,
  habits,
  onToggleHabit,
  onCreateHabit,
  onEditHabit,
  onTogglePause,
  onDeleteHabit,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<HabitTimeOfDay>('Morning');
  const [filterSlot, setFilterSlot] = useState<'All' | HabitTimeOfDay>('All');

  const activeHabits = habits.filter((h) => !h.isPaused);
  const doneToday = activeHabits.filter((h) => h.completedDates.includes(todayKey)).length;
  const progress = activeHabits.length > 0 ? doneToday / activeHabits.length : 0;

  const visibleHabits = habits.filter(
    (h) => filterSlot === 'All' || h.timeOfDay === filterSlot
  );

  const openCreateModal = () => {
    setEditingHabitId(null);
    setTitle('');
    setDesc('');
    setTimeOfDay('Morning');
    setShowModal(true);
  };

  const openEditModal = (habit: HabitItem) => {
    setEditingHabitId(habit.id);
    setTitle(habit.title);
    setDesc(habit.description);
    setTimeOfDay(habit.timeOfDay);
    setShowModal(true);
  };

  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (editingHabitId) {
      onEditHabit(editingHabitId, title.trim(), desc.trim(), timeOfDay);
    } else {
      onCreateHabit(title.trim(), desc.trim(), timeOfDay);
    }
    setShowModal(false);
    setEditingHabitId(null);
    setTitle('');
    setDesc('');
  };

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Habit Tracker"
        subtitle="Create, edit, complete, pause, or remove habits at your own calm rhythm — saved strictly offline."
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Habit</span>
          </button>
        }
      />

      {/* Today's Habit Ring Summary + Time-of-Day Filter */}
      <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <ProgressRing
            progress={progress}
            size={80}
            strokeWidth={8}
            colorClass="text-[#6C4FE0] dark:text-[#A994FF]"
            centerLabel={`${doneToday}/${activeHabits.length}`}
          />
          <div>
            <h2 className="font-display text-lg font-semibold">Today&apos;s Routine Flow</h2>
            <p className="mt-1 text-sm text-[#645F75] dark:text-[#B3AEC4]">
              {doneToday === activeHabits.length && activeHabits.length > 0
                ? 'All active habits completed calmly today.'
                : 'Check off each habit at your own unhurried pace.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['All', 'Morning', 'Afternoon', 'Evening', 'Anytime'] as const).map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setFilterSlot(slot)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                filterSlot === slot
                  ? 'bg-[#1E1340] dark:bg-[#6C4FE0] text-white'
                  : 'bg-[#FAF8F4] dark:bg-[#212640] text-[#645F75] dark:text-[#B3AEC4] border border-[#E6DFD3] dark:border-[#2E3452]'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </section>

      {visibleHabits.length === 0 ? (
        <EmptySanctuaryState
          title={
            habits.length === 0
              ? 'Your habit space is calm and open'
              : `No ${filterSlot.toLowerCase()} habits yet`
          }
          subtitle="Start with one gentle 2-minute daily habit that feels good to keep."
          actionLabel="Create Habit"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleHabits.map((habit) => {
            const done = habit.completedDates.includes(todayKey);
            return (
              <div
                key={habit.id}
                className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-5 flex flex-col justify-between gap-4"
              >
                <button
                  type="button"
                  disabled={habit.isPaused}
                  onClick={() => onToggleHabit(habit.id)}
                  className="flex items-start gap-3.5 text-left cursor-pointer disabled:opacity-55"
                >
                  {done ? (
                    <CheckCircle2 className="w-6 h-6 text-[#6C4FE0] dark:text-[#A994FF] shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-6 h-6 text-[#A39CB3] shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <h3
                      className={`font-display text-base font-semibold ${
                        done ? 'line-through opacity-65' : ''
                      }`}
                    >
                      {habit.title}
                    </h3>
                    {habit.description && (
                      <p className="mt-0.5 text-sm text-[#645F75] dark:text-[#B3AEC4]">
                        {habit.description}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
                      {habit.timeOfDay} · {habit.completedDates.length} total check-ins
                      {habit.isPaused ? ' · Rest Day Paused' : ''}
                    </p>
                  </div>
                </button>

                <div className="flex items-center justify-between pt-3 border-t border-[#EFEAE0] dark:border-[#262B45]">
                  <div className="flex items-center gap-1.5" aria-label="Last 7 days">
                    {Array.from({ length: 7 }, (_, i) => {
                      const key = getTodayKey(-(6 - i));
                      const checked = habit.completedDates.includes(key);
                      return (
                        <span
                          key={key}
                          className={`w-2.5 h-2.5 rounded-full ${
                            checked ? 'bg-[#36B5C4]' : 'bg-[#EAE4DA] dark:bg-[#2F3554]'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(habit)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#645F75] dark:text-[#B3AEC4] hover:text-[#6C4FE0] cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onTogglePause(habit.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#645F75] dark:text-[#B3AEC4] hover:text-[#256B9A] cursor-pointer"
                    >
                      {habit.isPaused ? (
                        <PlayCircle className="w-4 h-4" />
                      ) : (
                        <PauseCircle className="w-4 h-4" />
                      )}
                      <span>{habit.isPaused ? 'Resume' : 'Pause'}</span>
                    </button>
                    <button
                      type="button"
                      aria-label="Delete habit"
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-1.5 text-[#645F75] hover:text-[#B84A5E] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveHabit}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">
                {editingHabitId ? 'Edit Habit' : 'Create Gentle Habit'}
              </h3>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setShowModal(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Habit name (e.g., Stretch shoulders for 2 min)"
              className="w-full rounded-xl border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-4 py-2.5 text-sm"
            />
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Why it feels good (optional)"
              className="w-full rounded-xl border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-4 py-2.5 text-sm"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Morning', 'Afternoon', 'Evening', 'Anytime'] as HabitTimeOfDay[]).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTimeOfDay(slot)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                    timeOfDay === slot
                      ? 'border-[#6C4FE0] bg-[#EFEAFF] dark:bg-[#2E235C] text-[#1E1340] dark:text-white'
                      : 'border-[#E6DFD3] dark:border-[#2E3452] text-[#645F75] dark:text-[#B3AEC4]'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#645F75] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] cursor-pointer"
              >
                {editingHabitId ? 'Update Habit' : 'Save Habit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   SCREEN 10: DAILY SELF-CARE QUESTS & CALM RITUALS
   ============================================================================ */
interface DailyChallengesScreenProps {
  todayKey: string;
  completedQuestIds: DailyQuestId[];
  todayPoints: number;
  gardenStage: GardenStageInfo;
  positiveThoughts: PositiveThoughtEntry[];
  activeChallenge: SelfCareChallenge;
  dailyChallenge: DailyChallengeRecord;
  specialChallengesAccess: RewardLevelSnapshot;
  onToggleQuest: (questId: DailyQuestId) => void;
  onSavePositiveThought: (text: string) => void;
  onDeletePositiveThought: (id: string) => void;
  onOpenLinkedRoute: (dest: 'hydration' | 'journal' | 'habits' | 'progress') => void;
  onCompleteChallenge: () => void;
  onSwapChallenge: (useMockReward: boolean) => void;
  onPickChallenge: (challengeId: string) => void;
  onOpenRewardUnlock: () => void;
  onBack: () => void;
}

export const DailyChallengesScreen: React.FC<DailyChallengesScreenProps> = ({
  todayKey,
  completedQuestIds,
  todayPoints,
  gardenStage,
  positiveThoughts,
  activeChallenge,
  dailyChallenge,
  specialChallengesAccess,
  onToggleQuest,
  onSavePositiveThought,
  onDeletePositiveThought,
  onOpenLinkedRoute,
  onCompleteChallenge,
  onSwapChallenge,
  onPickChallenge,
  onOpenRewardUnlock,
  onBack,
}) => {
  const [thoughtDraft, setThoughtDraft] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Body' | 'Mind' | 'Space' | 'Joy'>('All');

  const todayThoughts = positiveThoughts.filter((t) => t.dateKey === todayKey);
  const completedCount = completedQuestIds.length;
  const questProgress = completedCount / DAILY_SELF_CARE_QUESTS.length;

  const library = CURATED_CHALLENGES.filter(
    (c) => categoryFilter === 'All' || c.category === categoryFilter
  );

  const handleThoughtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!thoughtDraft.trim()) return;
    onSavePositiveThought(thoughtDraft.trim());
    setThoughtDraft('');
  };

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Daily Self-Care Quests"
        subtitle="Small, enjoyable daily challenges that earn Tide Points and gently grow your Progress Garden."
        onBack={onBack}
        action={
          <button
            type="button"
            onClick={() => onOpenLinkedRoute('progress')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#EFEAFF] dark:bg-[#2E235C] text-[#1E1340] dark:text-white hover:opacity-90 whitespace-nowrap cursor-pointer"
          >
            <Sprout className="w-4 h-4 text-[#6C4FE0] dark:text-[#A994FF]" />
            <span>View Progress Garden</span>
          </button>
        }
      />

      {/* Daily Quests Summary Banner */}
      <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <ProgressRing
            progress={questProgress}
            size={84}
            strokeWidth={8}
            colorClass="text-[#36B5C4]"
            centerLabel={`${completedCount}/${DAILY_SELF_CARE_QUESTS.length}`}
          />
          <div>
            <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
              Garden Stage {gardenStage.stageIndex} · {gardenStage.name}
            </p>
            <h2 className="mt-0.5 font-display text-xl font-semibold">
              {completedCount === DAILY_SELF_CARE_QUESTS.length
                ? 'All five quests blossomed today'
                : 'Nurture your tide one small quest at a time'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#645F75] dark:text-[#B3AEC4]">
              Earned <span className="font-semibold text-[#1E1340] dark:text-white tabular-nums">+{todayPoints} Tide Points</span> today · Zero penalty if you rest.
            </p>
          </div>
        </div>
      </section>

      {/* The 5 Core Daily Self-Care Quests */}
      <div className="space-y-3">
        {DAILY_SELF_CARE_QUESTS.map((quest) => {
          const isDone = completedQuestIds.includes(quest.id);
          return (
            <div
              key={quest.id}
              className={`rounded-3xl p-5 sm:p-6 border transition-colors ${
                isDone
                  ? 'bg-[#EFEAFF]/45 dark:bg-[#231D44]/65 border-[#6C4FE0]/45'
                  : 'bg-white dark:bg-[#1A1E33] border-[#E6DFD3] dark:border-[#2C3250]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => onToggleQuest(quest.id)}
                  className="flex items-start gap-3.5 text-left flex-1 cursor-pointer"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-6 h-6 text-[#6C4FE0] dark:text-[#A994FF] shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-6 h-6 text-[#A39CB3] shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#256B9A] dark:text-[#79BCE8]">
                      {quest.category} · {quest.durationLabel} · +{quest.points} pts
                    </p>
                    <h3
                      className={`mt-0.5 font-display text-base font-semibold ${
                        isDone ? 'line-through opacity-75' : ''
                      }`}
                    >
                      {quest.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-[#645F75] dark:text-[#B3AEC4]">
                      {quest.description}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-2 sm:shrink-0 pl-9 sm:pl-0">
                  {quest.linkedRoute !== 'challenges' && (
                    <button
                      type="button"
                      onClick={() => onOpenLinkedRoute(quest.linkedRoute as 'hydration' | 'journal' | 'habits')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] text-[#1F1D2B] dark:text-[#F3F0EA] hover:border-[#6C4FE0] cursor-pointer"
                    >
                      <span>Open Tracker</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onToggleQuest(quest.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      isDone
                        ? 'bg-[#E4F7F9] dark:bg-[#163644] text-[#133A56] dark:text-[#79BCE8]'
                        : 'bg-[#6C4FE0] text-white hover:bg-[#5B3FD0]'
                    }`}
                  >
                    {isDone ? 'Completed' : 'Mark Done'}
                  </button>
                </div>
              </div>

              {/* Inline Positive Thought Composer inside the "Write one positive thought" quest */}
              {quest.id === 'positive_thought' && (
                <div className="mt-4 pt-4 border-t border-[#EFEAE0] dark:border-[#262B45] pl-0 sm:pl-9 space-y-3">
                  <form onSubmit={handleThoughtSubmit} className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={thoughtDraft}
                      onChange={(e) => setThoughtDraft(e.target.value)}
                      placeholder="Write one encouraging thought for today (saved privately on device)..."
                      className="flex-1 rounded-xl border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C4FE0]"
                    />
                    <button
                      type="submit"
                      disabled={!thoughtDraft.trim()}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#256B9A] text-white hover:bg-[#1D5982] disabled:opacity-45 whitespace-nowrap cursor-pointer"
                    >
                      Save Positive Thought
                    </button>
                  </form>
                  {todayThoughts.length > 0 && (
                    <div className="space-y-1.5">
                      {todayThoughts.map((pt) => (
                        <div
                          key={pt.id}
                          className="flex items-center justify-between gap-3 bg-white/80 dark:bg-[#1A1E33]/80 rounded-xl px-3.5 py-2 border border-[#E6DFD3]/70 dark:border-[#2C3250]"
                        >
                          <p className="text-sm italic text-[#1E1340] dark:text-[#E5E0F7]">
                            &ldquo;{pt.text}&rdquo;
                          </p>
                          <button
                            type="button"
                            aria-label="Delete positive thought"
                            onClick={() => onDeletePositiveThought(pt.id)}
                            className="p-1 text-[#645F75] hover:text-[#B84A5E] shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bonus Featured Micro-Ritual */}
      <section className="rounded-3xl bg-gradient-to-br from-[#E4F7F9] via-white to-[#EFEAFF] dark:from-[#163442] dark:via-[#1A1E33] dark:to-[#241E45] border border-[#E6DFD3] dark:border-[#2C3250] p-7 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold text-[#256B9A] dark:text-[#79BCE8]">
            Bonus Calm Ritual · {activeChallenge.category} · {activeChallenge.durationMinutes} min · +20 pts
          </p>
          {dailyChallenge.status !== 'COMPLETED' && (
            <button
              type="button"
              onClick={() =>
                dailyChallenge.swapsUsed >= 1
                  ? onOpenRewardUnlock()
                  : onSwapChallenge(false)
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF] hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{dailyChallenge.swapsUsed >= 1 ? 'Unlock Extra Swap' : 'Free Gentle Swap'}</span>
            </button>
          )}
        </div>

        <h2 className="font-display text-2xl font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
          {activeChallenge.title}
        </h2>
        <p className="text-sm text-[#554E6E] dark:text-[#C8C3DC] leading-relaxed max-w-2xl">
          {activeChallenge.description}
        </p>

        <div>
          {dailyChallenge.status === 'COMPLETED' ? (
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
              <Sparkles className="w-4 h-4" />
              <span>Completed with care today.</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onCompleteChallenge}
              className="px-5 py-2.5 rounded-2xl text-sm font-semibold bg-[#256B9A] text-white hover:bg-[#1D5982] transition-colors cursor-pointer"
            >
              Complete Bonus Ritual
            </button>
          )}
        </div>
      </section>

      {/* LEVEL 3: SPECIAL SELF-CARE CHALLENGES (24H TIMED OFFLINE REWARD) */}
      <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
              Level 3 Optional Pack · 24h Reward Access
            </p>
            <h2 className="font-display text-lg font-semibold">
              Special Self-Care Challenges
            </h2>
            <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
              Restorative multi-step rituals available completely offline once unlocked. All 5 Daily Self-Care Quests above remain permanently free.
            </p>
          </div>
          {specialChallengesAccess.isUnlocked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#E4F7F9] dark:bg-[#163644] text-[#133A56] dark:text-[#79BCE8] tabular-nums">
              <Unlock className="w-3.5 h-3.5" />
              <span>Active · {specialChallengesAccess.remainingFormatted}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={onOpenRewardUnlock}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>
                {specialChallengesAccess.status === 'EXPIRED'
                  ? 'Access Expired · Re-Unlock 24h'
                  : 'Unlock for 24 Hours'}
              </span>
            </button>
          )}
        </div>

        {specialChallengesAccess.isUnlocked ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LEVEL_3_SPECIAL_CHALLENGES.map((challenge) => {
              const isCurrent = challenge.id === activeChallenge.id;
              return (
                <div
                  key={challenge.id}
                  className={`rounded-2xl p-4 border flex flex-col justify-between gap-3 ${
                    isCurrent
                      ? 'bg-[#EFEAFF]/60 dark:bg-[#231D44] border-[#6C4FE0]/50'
                      : 'bg-[#FAF8F4] dark:bg-[#212640] border-[#E6DFD3] dark:border-[#2E3452]'
                  }`}
                >
                  <div>
                    <p className="text-[11px] font-semibold text-[#256B9A] dark:text-[#79BCE8]">
                      Special Ritual · {challenge.category} · {challenge.durationMinutes} min
                    </p>
                    <h3 className="mt-1 font-display text-sm font-semibold">{challenge.title}</h3>
                    <p className="mt-1 text-xs text-[#645F75] dark:text-[#B3AEC4] leading-relaxed">
                      {challenge.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => onPickChallenge(challenge.id)}
                    className="self-start px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white disabled:opacity-50 hover:bg-[#5B3FD0] cursor-pointer"
                  >
                    {isCurrent ? 'Active Bonus Ritual' : 'Activate Special Challenge'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] px-4 py-3.5 text-xs text-[#645F75] dark:text-[#B3AEC4] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#6C4FE0] dark:text-[#A994FF] shrink-0" />
            <span>
              Unlock 4 restorative offline challenges (Digital Sunset, Five-Senses Walk, Tea Ceremony, Horizon Reset) for 24 hours.
            </span>
          </div>
        )}
      </section>

      {/* Curated Offline Ritual Library */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Calm Ritual Library</h2>
        <div className="flex flex-wrap gap-1.5">
          {(['All', 'Body', 'Mind', 'Space', 'Joy'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#1E1340] dark:bg-[#6C4FE0] text-white'
                  : 'bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] text-[#645F75] dark:text-[#B3AEC4]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {library.map((challenge) => {
          const isCurrent = challenge.id === activeChallenge.id;
          return (
            <div
              key={challenge.id}
              className={`rounded-3xl p-5 border flex flex-col justify-between gap-4 ${
                isCurrent
                  ? 'bg-[#EFEAFF]/60 dark:bg-[#231D44] border-[#6C4FE0]/50'
                  : 'bg-white dark:bg-[#1A1E33] border-[#E6DFD3] dark:border-[#2C3250]'
              }`}
            >
              <div>
                <p className="text-xs font-medium text-[#256B9A] dark:text-[#79BCE8]">
                  {challenge.category} · {challenge.durationMinutes} min
                </p>
                <h3 className="mt-1.5 font-display text-base font-semibold">
                  {challenge.title}
                </h3>
                <p className="mt-1 text-xs text-[#645F75] dark:text-[#B3AEC4] leading-relaxed">
                  {challenge.description}
                </p>
              </div>
              <button
                type="button"
                disabled={isCurrent}
                onClick={() => onPickChallenge(challenge.id)}
                className="self-start px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] text-[#1F1D2B] dark:text-[#F3F0EA] disabled:opacity-50 hover:border-[#6C4FE0] cursor-pointer"
              >
                {isCurrent ? 'Selected for Today' : 'Set as Bonus Ritual'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

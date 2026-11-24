import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  CloudRain,
  Droplets,
  Heart,
  Lock,
  Pencil,
  Plus,
  Search,
  Share2,
  Shuffle,
  Sparkles,
  Sun,
  Trash2,
  Unlock,
  Waves,
  X,
} from 'lucide-react';
import {
  AppreciationAnswer,
  AppreciationPrompt,
  GuidedReflectionResponses,
  JournalEntry,
  MeasurementUnit,
  MoodCheckIn,
  MotivationCategory,
  PersonalBodyMetrics,
  WaterLog,
  WaterVessel,
} from '../types/dailyTide';
import {
  DAILY_REFLECTION_QUESTIONS,
  MOOD_CONTEXT_TAGS,
  MOOD_DEFINITIONS,
  MOTIVATION_CATEGORIES,
  MOTIVATION_LIBRARY,
  SELF_APPRECIATION_PROMPTS,
  formatDateKeyLabel,
  formatLitresOnly,
  formatVolume,
  getTodayKey,
} from '../data/localStore';
import { RewardLevelSnapshot } from '../rewards/rewardAccessManager';
import {
  LEVEL_1_SPECIAL_MOTIVATION_COLLECTION,
  LEVEL_2_ADVANCED_REFLECTION_COLLECTION,
} from '../rewards/rewardContentCatalog';
import { HydrationWaveWidget } from '../components/HydrationWaveWidget';
import { PersonalBmiHydrationGuideCard } from '../components/PersonalBmiHydrationGuideCard';
import {
  EmptySanctuaryState,
  ProgressRing,
  ScreenHeader,
} from '../components/TidePrimitives';

/* ============================================================================
   FRIENDLY VISUAL MOOD INDICATOR ICON
   ============================================================================ */
export const MoodVisualIcon: React.FC<{ level: 1 | 2 | 3 | 4 | 5; className?: string }> = ({
  level,
  className = 'w-6 h-6',
}) => {
  switch (level) {
    case 1:
      return <CloudRain className={className} />;
    case 2:
      return <Cloud className={className} />;
    case 3:
      return <Waves className={className} />;
    case 4:
      return <Sparkles className={className} />;
    case 5:
      return <Sun className={className} />;
  }
};

/* ============================================================================
   SCREEN 5: HYDRATION TRACKER (FEATURE 1)
   ============================================================================ */
interface HydrationTrackerScreenProps {
  todayKey: string;
  consumedMl: number;
  goalMl: number;
  unit: MeasurementUnit;
  vessels: WaterVessel[];
  allWaterLogs: WaterLog[];
  todayLogs: WaterLog[];
  canUndo: boolean;
  bodyMetrics?: PersonalBodyMetrics;
  bmiHydrationAccess: RewardLevelSnapshot;
  onChangeUnit: (unit: MeasurementUnit) => void;
  onSaveBodyMetrics: (metrics: PersonalBodyMetrics) => void;
  onRequestUnlockBmiGuide: () => void;
  onQuickAdd: (vessel: WaterVessel) => void;
  onLogCustomAmount: (amountMl: number, label: string) => void;
  onUndo: () => void;
  onDeleteLog: (id: string) => void;
  onAddVessel: (name: string, volumeMl: number) => void;
  onDeleteVessel: (id: string) => void;
  onUpdateGoal: (goalMl: number) => void;
  onBack: () => void;
}

export const HydrationTrackerScreen: React.FC<HydrationTrackerScreenProps> = ({
  todayKey,
  consumedMl,
  goalMl,
  unit,
  vessels,
  allWaterLogs,
  todayLogs,
  canUndo,
  bodyMetrics,
  bmiHydrationAccess,
  onChangeUnit,
  onSaveBodyMetrics,
  onRequestUnlockBmiGuide,
  onQuickAdd,
  onLogCustomAmount,
  onUndo,
  onDeleteLog,
  onAddVessel,
  onDeleteVessel,
  onUpdateGoal,
  onBack,
}) => {
  const [vesselName, setVesselName] = useState('');
  const [vesselMl, setVesselMl] = useState('350');
  const [customSipInput, setCustomSipInput] = useState(unit === 'L' ? '0.25' : '200');
  const [goalInput, setGoalInput] = useState(
    unit === 'L' ? String(Number((goalMl / 1000).toFixed(2))) : String(goalMl)
  );
  const [selectedHistoryKey, setSelectedHistoryKey] = useState<string>(todayKey);

  // Keep selected date aligned when midnight auto-rollover happens
  const effectiveSelectedKey = selectedHistoryKey || todayKey;

  const historyDays = useMemo(() => {
    const totalsByDay = new Map<string, WaterLog[]>();
    allWaterLogs.forEach((log) => {
      const existing = totalsByDay.get(log.dateKey) ?? [];
      existing.push(log);
      totalsByDay.set(log.dateKey, existing);
    });

    return Array.from({ length: 14 }, (_, idx) => {
      const key = getTodayKey(-(13 - idx));
      const logs = (totalsByDay.get(key) ?? []).sort((a, b) => b.loggedAtMillis - a.loggedAtMillis);
      const totalMl = logs.reduce((s, l) => s + l.amountMl, 0);
      const [y, m, d] = key.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const shortDay = dateObj.toLocaleDateString(undefined, { weekday: 'narrow' });
      const shortDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return {
        dateKey: key,
        shortDay,
        shortDate,
        totalMl,
        logs,
        goalMet: totalMl >= goalMl,
      };
    });
  }, [allWaterLogs, goalMl, todayKey]);

  const selectedDayLogs = useMemo(() => {
    if (effectiveSelectedKey === todayKey) return todayLogs;
    return allWaterLogs
      .filter((l) => l.dateKey === effectiveSelectedKey)
      .sort((a, b) => b.loggedAtMillis - a.loggedAtMillis);
  }, [allWaterLogs, effectiveSelectedKey, todayKey, todayLogs]);

  const selectedDayTotalMl = useMemo(
    () => selectedDayLogs.reduce((sum, l) => sum + l.amountMl, 0),
    [selectedDayLogs]
  );

  const handleAddVesselSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(vesselMl, 10);
    if (!vesselName.trim() || Number.isNaN(parsed) || parsed < 25 || parsed > 3000) return;
    onAddVessel(vesselName.trim(), parsed);
    setVesselName('');
    setVesselMl('350');
  };

  const handleSwitchUnit = (nextUnit: MeasurementUnit) => {
    onChangeUnit(nextUnit);
    setCustomSipInput(nextUnit === 'L' ? '0.25' : nextUnit === 'OZ' ? '8' : '200');
    setGoalInput(
      nextUnit === 'L'
        ? String(Number((goalMl / 1000).toFixed(2)))
        : nextUnit === 'OZ'
        ? String(Math.round(goalMl / 29.5735))
        : String(goalMl)
    );
  };

  const handleCustomSipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = parseFloat(customSipInput);
    if (Number.isNaN(raw) || raw <= 0) return;
    const amountMl =
      unit === 'L'
        ? Math.round(raw * 1000)
        : unit === 'OZ'
        ? Math.round(raw * 29.5735)
        : Math.round(raw);
    if (amountMl < 10 || amountMl > 3000) return;
    onLogCustomAmount(amountMl, 'Custom Sip');
    setSelectedHistoryKey(todayKey);
  };

  const handleApplyGoalInput = () => {
    const raw = parseFloat(goalInput);
    if (Number.isNaN(raw) || raw <= 0) {
      setGoalInput(
        unit === 'L'
          ? String(Number((goalMl / 1000).toFixed(2)))
          : unit === 'OZ'
          ? String(Math.round(goalMl / 29.5735))
          : String(goalMl)
      );
      return;
    }
    const parsedMl =
      unit === 'L'
        ? Math.round(raw * 1000)
        : unit === 'OZ'
        ? Math.round(raw * 29.5735)
        : Math.round(raw);
    if (parsedMl >= 500 && parsedMl <= 6000) {
      onUpdateGoal(parsedMl);
    } else {
      setGoalInput(
        unit === 'L'
          ? String(Number((goalMl / 1000).toFixed(2)))
          : unit === 'OZ'
          ? String(Math.round(goalMl / 29.5735))
          : String(goalMl)
      );
    }
  };

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Hydration Tracker"
        subtitle="Customize your personal daily target, log sips with one tap, and explore your hydration history."
        onBack={onBack}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <HydrationWaveWidget
            consumedMl={consumedMl}
            goalMl={goalMl}
            unit={unit}
            vessels={vessels}
            canUndo={canUndo}
            onQuickAdd={(v) => {
              onQuickAdd(v);
              setSelectedHistoryKey(todayKey);
            }}
            onUndo={onUndo}
          />

          {/* Quick Custom Sip Entry */}
          <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold">Quick Custom Amount</h2>
              <div className="inline-flex items-center gap-1 rounded-xl bg-[#FAF8F4] dark:bg-[#212640] p-0.5 border border-[#E6DFD3] dark:border-[#2E3452]">
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
                    onClick={() => handleSwitchUnit(u)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      unit === u
                        ? 'bg-[#256B9A] text-white'
                        : 'text-[#645F75] dark:text-[#B3AEC4] hover:text-[#1F1D2B] dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={handleCustomSipSubmit} className="flex gap-2.5">
              <input
                type="number"
                step={unit === 'L' ? '0.05' : '1'}
                min={unit === 'L' ? 0.05 : 1}
                max={unit === 'L' ? 3 : unit === 'OZ' ? 100 : 3000}
                value={customSipInput}
                onChange={(e) => setCustomSipInput(e.target.value)}
                aria-label={`Custom water amount in ${unit === 'L' ? 'litres' : unit.toLowerCase()}`}
                className="flex-1 rounded-xl border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-4 py-2.5 text-sm tabular-nums"
                placeholder={
                  unit === 'L'
                    ? 'Amount in Litres (e.g. 0.5)'
                    : unit === 'OZ'
                    ? 'Amount in oz (e.g. 8)'
                    : 'Amount in ml (e.g. 250)'
                }
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#256B9A] text-white text-xs font-semibold hover:bg-[#1D5982] cursor-pointer whitespace-nowrap"
              >
                <Droplets className="w-4 h-4" />
                <span>Log {unit === 'L' ? 'Litres' : unit === 'OZ' ? 'oz' : 'ml'}</span>
              </button>
            </form>
            <p className="text-[11px] text-[#645F75] dark:text-[#B3AEC4]">
              Resets automatically at midnight · Today&apos;s intake: <strong className="tabular-nums">{formatLitresOnly(consumedMl)}</strong> ({consumedMl.toLocaleString()} ml)
            </p>
          </section>

          {/* Daily Water Goal Control (Non-medical, user-customized, Litres + ml + oz) */}
          <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-semibold">Your Personal Water Target</h2>
                <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] mt-0.5">
                  View in Litres (L), ml, or oz — hydration needs vary for every body. Customize freely to match your routine.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-display text-lg font-semibold text-[#256B9A] dark:text-[#79BCE8] tabular-nums block">
                  {formatVolume(goalMl, unit)}
                </span>
                {unit !== 'L' && (
                  <span className="text-[11px] text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
                    ({formatLitresOnly(goalMl)})
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min={800}
              max={4500}
              step={100}
              value={Math.min(Math.max(goalMl, 800), 4500)}
              onChange={(e) => {
                const val = Number(e.target.value);
                onUpdateGoal(val);
                setGoalInput(
                  unit === 'L'
                    ? String(Number((val / 1000).toFixed(2)))
                    : unit === 'OZ'
                    ? String(Math.round(val / 29.5735))
                    : String(val)
                );
              }}
              aria-label="Daily water goal slider"
              className="w-full accent-[#36B5C4]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {[1500, 2000, 2500, 3000, 3500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      onUpdateGoal(preset);
                      setGoalInput(
                        unit === 'L'
                          ? String(Number((preset / 1000).toFixed(2)))
                          : unit === 'OZ'
                          ? String(Math.round(preset / 29.5735))
                          : String(preset)
                      );
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                      goalMl === preset
                        ? 'bg-[#256B9A] text-white'
                        : 'bg-[#FAF8F4] dark:bg-[#212640] text-[#645F75] dark:text-[#B3AEC4] border border-[#E6DFD3] dark:border-[#2E3452]'
                    }`}
                  >
                    {formatVolume(preset, unit)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={unit === 'L' ? '0.1' : '50'}
                  min={unit === 'L' ? 0.5 : unit === 'OZ' ? 16 : 500}
                  max={unit === 'L' ? 6 : unit === 'OZ' ? 200 : 6000}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onBlur={handleApplyGoalInput}
                  aria-label={`Exact daily water goal in ${unit === 'L' ? 'litres' : unit.toLowerCase()}`}
                  className="w-24 rounded-xl border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-3 py-1.5 text-xs tabular-nums"
                />
                <button
                  type="button"
                  onClick={handleApplyGoalInput}
                  className="px-3 py-1.5 rounded-xl bg-[#EFEAFF] dark:bg-[#2E235C] text-[#6C4FE0] dark:text-[#C4B5FF] text-xs font-semibold cursor-pointer"
                >
                  Set {unit === 'L' ? 'L' : unit === 'OZ' ? 'oz' : 'ml'}
                </button>
              </div>
            </div>
          </section>

          {/* Premium Ad-Unlocked Personal BMI & Safe Hydration Guide */}
          <PersonalBmiHydrationGuideCard
            unit={unit}
            currentGoalMl={goalMl}
            savedMetrics={bodyMetrics}
            rewardAccess={bmiHydrationAccess}
            onSaveMetrics={onSaveBodyMetrics}
            onApplyRecommendedGoal={(recommendedMl) => {
              onUpdateGoal(recommendedMl);
              setGoalInput(
                unit === 'L'
                  ? String(Number((recommendedMl / 1000).toFixed(2)))
                  : unit === 'OZ'
                  ? String(Math.round(recommendedMl / 29.5735))
                  : String(recommendedMl)
              );
            }}
            onRequestAdUnlock={onRequestUnlockBmiGuide}
          />

          {/* 14-Day Historical Consumption Chart */}
          <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">14-Day Hydration History</h2>
                <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                  Tap any day bar to inspect or edit entries from that day.
                </p>
              </div>
              <span className="text-xs font-medium text-[#256B9A] dark:text-[#79BCE8] tabular-nums">
                {historyDays.filter((d) => d.goalMet).length}/14 targets met
              </span>
            </div>

            <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 items-end h-32 pt-2">
              {historyDays.map((day) => {
                const ratio = Math.min(Math.max(day.totalMl / Math.max(goalMl, 1), 0.08), 1);
                const isSelected = effectiveSelectedKey === day.dateKey;
                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => setSelectedHistoryKey(day.dateKey)}
                    title={`${day.shortDate}: ${formatVolume(day.totalMl, unit)}`}
                    className="flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
                  >
                    <div className="w-full max-w-[24px] h-24 rounded-lg bg-[#F2ECE3] dark:bg-[#222742] flex items-end overflow-hidden p-0.5">
                      <div
                        className={`w-full rounded-md transition-all duration-300 ${
                          isSelected
                            ? 'bg-[#6C4FE0]'
                            : day.goalMet
                            ? 'bg-[#36B5C4]'
                            : day.totalMl > 0
                            ? 'bg-[#8FAFD0] dark:bg-[#3A5A7E]'
                            : 'bg-transparent'
                        }`}
                        style={{ height: day.totalMl > 0 ? `${Math.round(ratio * 100)}%` : '0%' }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-medium ${
                        isSelected
                          ? 'text-[#6C4FE0] dark:text-[#A994FF] font-bold'
                          : 'text-[#645F75] dark:text-[#B3AEC4]'
                      }`}
                    >
                      {day.shortDay}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Selected Day Drink Log (Today or Historical) */}
          <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">
                  {formatDateKeyLabel(effectiveSelectedKey, todayKey)}&apos;s Water Log
                </h2>
                <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
                  {formatVolume(selectedDayTotalMl, unit)} total · {selectedDayLogs.length}{' '}
                  {selectedDayLogs.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>
              {effectiveSelectedKey !== todayKey && (
                <button
                  type="button"
                  onClick={() => setSelectedHistoryKey(todayKey)}
                  className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF] hover:underline cursor-pointer"
                >
                  Back to Today
                </button>
              )}
            </div>

            {selectedDayLogs.length === 0 ? (
              <EmptySanctuaryState
                title={
                  effectiveSelectedKey === todayKey
                    ? 'No sips logged yet today'
                    : `No entries recorded on ${formatDateKeyLabel(effectiveSelectedKey, todayKey)}`
                }
                subtitle={
                  effectiveSelectedKey === todayKey
                    ? 'Tap any glass above to log your first calm sip.'
                    : 'Every day is a gentle ebb and flow.'
                }
              />
            ) : (
              <div className="divide-y divide-[#EFEAE0] dark:divide-[#262B45]">
                {selectedDayLogs.map((log) => (
                  <div
                    key={log.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium tabular-nums">
                        {formatVolume(log.amountMl, unit)} · {log.vesselName}
                      </p>
                      <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                        {new Date(log.loggedAtMillis).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove incorrect water entry"
                      onClick={() => onDeleteLog(log.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[#645F75] hover:text-[#B84A5E] hover:bg-[#FAF0F2] dark:hover:bg-[#3A1E28] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Custom Glasses Manager */}
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Custom Water Glasses</h2>
              <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] mt-0.5">
                Save your own bottles, mugs, or tumblers for one-tap logging.
              </p>
            </div>
            <form onSubmit={handleAddVesselSubmit} className="space-y-3">
              <input
                type="text"
                value={vesselName}
                onChange={(e) => setVesselName(e.target.value)}
                placeholder="Glass name (e.g., Ceramic Mug)"
                className="w-full rounded-xl border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-4 py-2.5 text-sm"
              />
              <div className="flex gap-2.5">
                <input
                  type="number"
                  min={25}
                  max={3000}
                  value={vesselMl}
                  onChange={(e) => setVesselMl(e.target.value)}
                  placeholder="Volume (ml)"
                  className="flex-1 rounded-xl border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-4 py-2.5 text-sm tabular-nums"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6C4FE0] text-white text-xs font-semibold hover:bg-[#5B3FD0] cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Glass</span>
                </button>
              </div>
            </form>

            <div className="pt-2 space-y-2.5">
              {vessels.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{v.name}</p>
                    <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
                      {formatVolume(v.volumeMl, unit)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onQuickAdd(v);
                        setSelectedHistoryKey(todayKey);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#256B9A] text-white text-xs font-medium hover:bg-[#1D5982] cursor-pointer"
                    >
                      <Droplets className="w-3.5 h-3.5" />
                      <span>Log</span>
                    </button>
                    {!v.isDefault && (
                      <button
                        type="button"
                        aria-label="Remove custom glass"
                        onClick={() => onDeleteVessel(v.id)}
                        className="p-1.5 text-[#645F75] hover:text-[#B84A5E] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Historical Daily Breakdown Table */}
          <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-3">
            <h2 className="font-display text-base font-semibold">Recent Daily Totals</h2>
            <div className="divide-y divide-[#EFEAE0] dark:divide-[#262B45]">
              {[...historyDays]
                .reverse()
                .slice(0, 7)
                .map((day) => {
                  const pct = Math.min(Math.round((day.totalMl / Math.max(goalMl, 1)) * 100), 100);
                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      onClick={() => setSelectedHistoryKey(day.dateKey)}
                      className={`w-full py-2.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                        effectiveSelectedKey === day.dateKey
                          ? 'text-[#6C4FE0] dark:text-[#A994FF]'
                          : ''
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatDateKeyLabel(day.dateKey, todayKey)}
                        </p>
                        <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                          {day.logs.length} {day.logs.length === 1 ? 'log' : 'logs'}
                        </p>
                      </div>
                      <div className="text-right tabular-nums">
                        <p className="text-sm font-semibold">{formatVolume(day.totalMl, unit)}</p>
                        <p
                          className={`text-xs ${
                            day.goalMet
                              ? 'text-[#256B9A] dark:text-[#55CEDC]'
                              : 'text-[#645F75] dark:text-[#B3AEC4]'
                          }`}
                        >
                          {pct}% of target
                        </p>
                      </div>
                    </button>
                  );
                })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   SCREEN 6: MOOD CHECK-IN (FEATURE 5)
   ============================================================================ */
interface MoodCheckInScreenProps {
  todayKey: string;
  moodCheckIns: MoodCheckIn[];
  onSaveMood: (level: 1 | 2 | 3 | 4 | 5, tags: string[], note: string) => void;
  onDeleteMood: (id: string) => void;
  onBack: () => void;
}

export const MoodCheckInScreen: React.FC<MoodCheckInScreenProps> = ({
  todayKey,
  moodCheckIns,
  onSaveMood,
  onDeleteMood,
  onBack,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [tags, setTags] = useState<string[]>(['Rested']);
  const [note, setNote] = useState('');

  const activeDef = MOOD_DEFINITIONS.find((m) => m.level === selectedLevel) ?? MOOD_DEFINITIONS[3];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMood(selectedLevel, tags, note.trim());
    setNote('');
  };

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Mood Tracker"
        subtitle="Record your emotional tide with friendly visual check-ins — stored privately on your device."
        onBack={onBack}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 sm:p-7 space-y-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: activeDef.accentHex }}
              >
                <MoodVisualIcon level={activeDef.level} className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold">{activeDef.label}</h2>
                <p className="mt-0.5 text-sm text-[#645F75] dark:text-[#B3AEC4]">
                  {activeDef.gentleSummary}
                </p>
              </div>
            </div>
            <ProgressRing
              progress={selectedLevel / 5}
              size={60}
              strokeWidth={6}
              colorClass="text-[#6C4FE0] dark:text-[#A994FF]"
              centerLabel={`${selectedLevel}/5`}
            />
          </div>

          <div className="grid grid-cols-5 gap-2.5">
            {MOOD_DEFINITIONS.map((m) => {
              const active = selectedLevel === m.level;
              return (
                <button
                  key={m.level}
                  type="button"
                  onClick={() => setSelectedLevel(m.level)}
                  className={`rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 text-center border transition-all cursor-pointer ${
                    active
                      ? 'border-[#6C4FE0] bg-[#EFEAFF] dark:bg-[#2E235C] text-[#1E1340] dark:text-white shadow-sm'
                      : 'border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] text-[#645F75] dark:text-[#B3AEC4] hover:border-[#6C4FE0]/50'
                  }`}
                >
                  <span
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: active ? m.accentHex : 'transparent',
                      color: active ? '#FFFFFF' : m.accentHex,
                    }}
                  >
                    <MoodVisualIcon level={m.level} className="w-5 h-5" />
                  </span>
                  <span className="block text-xs font-semibold truncate w-full">{m.label}</span>
                </button>
              );
            })}
          </div>

          <div>
            <p className="text-sm font-medium mb-2.5">What describes this moment?</p>
            <div className="flex flex-wrap gap-2">
              {MOOD_CONTEXT_TAGS.map((tag) => {
                const picked = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      )
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      picked
                        ? 'bg-[#256B9A] text-white'
                        : 'bg-[#FAF8F4] dark:bg-[#212640] text-[#645F75] dark:text-[#B3AEC4] border border-[#E6DFD3] dark:border-[#2E3452]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Optional brief note</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A gentle sentence about what shaped your mood..."
              className="w-full rounded-2xl border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-4 py-3 text-sm focus:outline-none focus:border-[#6C4FE0]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#6C4FE0] text-white font-semibold text-sm hover:bg-[#5B3FD0] transition-colors cursor-pointer"
          >
            Save Mood Check-In
          </button>
        </form>

        {/* Recent Check-In Timeline */}
        <section className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent Mood Tide</h2>
            <span className="text-xs text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
              {moodCheckIns.length} saved
            </span>
          </div>
          {moodCheckIns.length === 0 ? (
            <EmptySanctuaryState
              title="No check-ins yet"
              subtitle="Your saved emotional snapshots will appear here privately."
            />
          ) : (
            <div className="space-y-3">
              {moodCheckIns.slice(0, 10).map((item) => {
                const def = MOOD_DEFINITIONS.find((m) => m.level === item.moodLevel) ?? MOOD_DEFINITIONS[2];
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: def.accentHex }}
                        >
                          <MoodVisualIcon level={def.level} className="w-4 h-4" />
                        </span>
                        <div>
                          <span className="font-display text-sm font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]">
                            {def.label}
                          </span>
                          <span className="ml-2 text-xs text-[#645F75] dark:text-[#B3AEC4]">
                            {formatDateKeyLabel(item.dateKey, todayKey)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label="Delete mood check-in"
                        onClick={() => onDeleteMood(item.id)}
                        className="p-1.5 text-[#645F75] hover:text-[#B84A5E] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {item.tags.length > 0 && (
                      <p className="text-xs text-[#256B9A] dark:text-[#79BCE8]">
                        {item.tags.join(' · ')}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] leading-relaxed">
                        {item.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

/* ============================================================================
   SCREEN 7: DAILY REFLECTION & SELF-APPRECIATION (FEATURES 2 & 3)
   ============================================================================ */
interface SelfReflectionJournalScreenProps {
  todayKey: string;
  entries: JournalEntry[];
  appreciations: AppreciationAnswer[];
  todayPrompt: AppreciationPrompt;
  advancedReflectionAccess: RewardLevelSnapshot;
  onSaveJournal: (
    title: string,
    body: string,
    guidedResponses?: GuidedReflectionResponses,
    editId?: string
  ) => void;
  onDeleteJournal: (id: string) => void;
  onSaveAppreciation: (prompt: AppreciationPrompt, answer: string) => void;
  onDeleteAppreciation: (id: string) => void;
  onSwapPrompt: () => void;
  onOpenRewardUnlock: () => void;
}

export const SelfReflectionJournalScreen: React.FC<SelfReflectionJournalScreenProps> = ({
  todayKey,
  entries,
  appreciations,
  todayPrompt,
  advancedReflectionAccess,
  onSaveJournal,
  onDeleteJournal,
  onSaveAppreciation,
  onDeleteAppreciation,
  onSwapPrompt,
  onOpenRewardUnlock,
}) => {
  const [tab, setTab] = useState<'reflection' | 'appreciation'>('reflection');
  const [composerMode, setComposerMode] = useState<'guided' | 'freeform'>('guided');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Guided reflection fields
  const [guided, setGuided] = useState<GuidedReflectionResponses>({
    happyToday: '',
    accomplished: '',
    gratefulFor: '',
    learnedToday: '',
    improveTomorrow: '',
  });
  // Freeform journal fields
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [query, setQuery] = useState('');

  // Self-Appreciation fields
  const [activePrompt, setActivePrompt] = useState<AppreciationPrompt>(todayPrompt);
  const [appreciationDraft, setAppreciationDraft] = useState('');

  const hasGuidedContent = Object.values(guided).some((v) => Boolean(v?.trim()));

  const filtered = entries.filter((e) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const guidedText = e.guidedResponses
      ? Object.values(e.guidedResponses).join(' ').toLowerCase()
      : '';
    return (
      e.title.toLowerCase().includes(q) ||
      e.body.toLowerCase().includes(q) ||
      guidedText.includes(q)
    );
  });

  const resetComposer = () => {
    setEditingEntryId(null);
    setTitle('');
    setBody('');
    setGuided({
      happyToday: '',
      accomplished: '',
      gratefulFor: '',
      learnedToday: '',
      improveTomorrow: '',
    });
  };

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (composerMode === 'guided') {
      if (!hasGuidedContent) return;
      const cleaned: GuidedReflectionResponses = {};
      const summaryLines: string[] = [];
      DAILY_REFLECTION_QUESTIONS.forEach((q) => {
        const val = guided[q.key]?.trim();
        if (val) {
          cleaned[q.key] = val;
          summaryLines.push(`${q.question}\n${val}`);
        }
      });
      onSaveJournal(
        title.trim() || 'Daily Guided Reflection',
        summaryLines.join('\n\n'),
        cleaned,
        editingEntryId ?? undefined
      );
      resetComposer();
    } else {
      if (!body.trim()) return;
      onSaveJournal(
        title.trim() || 'Daily Reflection',
        body.trim(),
        undefined,
        editingEntryId ?? undefined
      );
      resetComposer();
    }
  };

  const startEditEntry = (entry: JournalEntry) => {
    setTab('reflection');
    setEditingEntryId(entry.id);
    setTitle(entry.title);
    if (entry.guidedResponses && Object.keys(entry.guidedResponses).length > 0) {
      setComposerMode('guided');
      setGuided({
        happyToday: entry.guidedResponses.happyToday ?? '',
        accomplished: entry.guidedResponses.accomplished ?? '',
        gratefulFor: entry.guidedResponses.gratefulFor ?? '',
        learnedToday: entry.guidedResponses.learnedToday ?? '',
        improveTomorrow: entry.guidedResponses.improveTomorrow ?? '',
      });
    } else {
      setComposerMode('freeform');
      setBody(entry.body);
    }
  };

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Daily Reflection & Self-Appreciation"
        subtitle="Guided evening reflection questions and your personal self-appreciation vault — stored strictly offline."
        action={
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#EFEAE0] dark:bg-[#1E223A]">
            {(
              [
                ['reflection', 'Daily Reflection'],
                ['appreciation', 'Self-Appreciation'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  tab === id
                    ? 'bg-white dark:bg-[#2E235C] text-[#1E1340] dark:text-white shadow-sm'
                    : 'text-[#645F75] dark:text-[#B3AEC4]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {tab === 'reflection' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Guided & Freeform Reflection Composer */}
          <form
            onSubmit={handleSaveReflection}
            className="lg:col-span-6 rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">
                {editingEntryId ? 'Edit Reflection' : 'Today’s Reflection'}
              </h2>
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#FAF8F4] dark:bg-[#212640] border border-[#E6DFD3] dark:border-[#2E3452]">
                {(
                  [
                    ['guided', 'Guided 5Q'],
                    ['freeform', 'Freeform'],
                  ] as const
                ).map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setComposerMode(m)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      composerMode === m
                        ? 'bg-[#6C4FE0] text-white'
                        : 'text-[#645F75] dark:text-[#B3AEC4]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional title (e.g., Peaceful Tuesday)"
              className="w-full rounded-xl border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-4 py-2.5 text-sm"
            />

            {composerMode === 'guided' ? (
              <div className="space-y-3.5">
                {DAILY_REFLECTION_QUESTIONS.map((q) => (
                  <div key={q.key} className="space-y-1">
                    <label className="block text-xs font-semibold text-[#1E1340] dark:text-[#E7E3F5]">
                      {q.question}
                    </label>
                    <textarea
                      rows={2}
                      value={guided[q.key] ?? ''}
                      onChange={(e) =>
                        setGuided((prev) => ({ ...prev, [q.key]: e.target.value }))
                      }
                      placeholder={q.placeholder}
                      className="w-full rounded-xl border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-[#6C4FE0]"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <textarea
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write freely in your private sanctuary..."
                className="w-full rounded-2xl border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-[#6C4FE0]"
              />
            )}

            <div className="flex items-center gap-2 pt-1">
              {editingEntryId && (
                <button
                  type="button"
                  onClick={resetComposer}
                  className="px-4 py-3 rounded-xl text-xs font-semibold border border-[#E6DFD3] dark:border-[#2E3452] text-[#645F75] dark:text-[#B3AEC4] cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                disabled={composerMode === 'guided' ? !hasGuidedContent : !body.trim()}
                className="flex-1 py-3 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white disabled:opacity-45 hover:bg-[#5B3FD0] cursor-pointer"
              >
                {editingEntryId ? 'Update Reflection' : 'Save Reflection Locally'}
              </button>
            </div>
          </form>

          {/* Saved Reflections Archive */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-[#645F75] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search reflections locally..."
                className="w-full rounded-2xl border border-[#E6DFD3] dark:border-[#2E3452] bg-white dark:bg-[#1A1E33] pl-10 pr-4 py-3 text-sm"
              />
            </div>

            {filtered.length === 0 ? (
              <EmptySanctuaryState
                title="Quiet pages await"
                subtitle={
                  query
                    ? 'No entries matched your search phrase.'
                    : 'Answer one or more reflection questions to build your private local archive.'
                }
              />
            ) : (
              filtered.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-semibold">{entry.title}</h3>
                      <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] mt-0.5">
                        {formatDateKeyLabel(entry.dateKey, todayKey)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Edit reflection"
                        onClick={() => startEditEntry(entry)}
                        className="p-1.5 text-[#645F75] hover:text-[#6C4FE0] cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete reflection"
                        onClick={() => onDeleteJournal(entry.id)}
                        className="p-1.5 text-[#645F75] hover:text-[#B84A5E] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {entry.guidedResponses && Object.keys(entry.guidedResponses).length > 0 ? (
                    <div className="space-y-2.5 pt-1">
                      {DAILY_REFLECTION_QUESTIONS.map((q) => {
                        const ans = entry.guidedResponses?.[q.key];
                        if (!ans) return null;
                        return (
                          <div
                            key={q.key}
                            className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] px-4 py-3"
                          >
                            <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
                              {q.question}
                            </p>
                            <p className="mt-1 text-sm text-[#342F49] dark:text-[#E2DFF0] leading-relaxed">
                              {ans}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-[#342F49] dark:text-[#D5D1E4] whitespace-pre-wrap">
                      {entry.body}
                    </p>
                  )}
                </article>
              ))
            )}
          </div>

          {/* LEVEL 2: ADVANCED REFLECTION COLLECTION (24H TIMED OFFLINE REWARD) */}
          <section className="lg:col-span-12 rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
                  Level 2 Optional Collection · 24h Reward Access
                </p>
                <h2 className="font-display text-lg font-semibold">
                  Advanced Reflection Collection
                </h2>
                <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                  Deep emotional clarity, energy audit, values compass, and future-self templates — available offline once unlocked. Basic 5Q reflection &amp; journaling always stay free.
                </p>
              </div>
              {advancedReflectionAccess.isUnlocked ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#E4F7F9] dark:bg-[#163644] text-[#133A56] dark:text-[#79BCE8] tabular-nums">
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Active · {advancedReflectionAccess.remainingFormatted}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenRewardUnlock}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {advancedReflectionAccess.status === 'EXPIRED'
                      ? 'Access Expired · Re-Unlock 24h'
                      : 'Unlock for 24 Hours'}
                  </span>
                </button>
              )}
            </div>

            {advancedReflectionAccess.isUnlocked ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LEVEL_2_ADVANCED_REFLECTION_COLLECTION.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] border border-[#E6DFD3] dark:border-[#2E3452] p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-[#256B9A] dark:text-[#79BCE8]">
                        {tpl.category}
                      </p>
                      <h3 className="font-display text-sm font-semibold">{tpl.title}</h3>
                      <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">{tpl.subtitle}</p>
                      <ul className="pt-1 space-y-1 text-xs text-[#342F49] dark:text-[#D5D1E4]">
                        {tpl.prompts.map((p) => (
                          <li key={p}>• {p}</li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEntryId(null);
                        setComposerMode('freeform');
                        setTitle(tpl.title);
                        setBody(tpl.prompts.map((p) => `${p}\n`).join('\n'));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="self-start px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] cursor-pointer"
                    >
                      Load Prompts into Composer
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] px-4 py-3.5 flex items-center justify-between gap-3 text-xs text-[#645F75] dark:text-[#B3AEC4]">
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#6C4FE0] dark:text-[#A994FF] shrink-0" />
                  <span>
                    Unlock 4 guided deep-reflection frameworks for 24 hours via Rewarded Access (100% offline once unlocked).
                  </span>
                </span>
              </div>
            )}
          </section>
        </div>
      ) : (
        /* FEATURE 3: SELF-APPRECIATION DEDICATED EXPERIENCE */
        <div className="space-y-6">
          <section className="rounded-3xl bg-gradient-to-br from-[#EFEAFF] via-[#FAF8F4] to-[#E4F7F9] dark:from-[#241E45] dark:via-[#1A1E33] dark:to-[#153140] border border-[#E6DFD3] dark:border-[#2C3250] p-6 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
                  Daily Self-Appreciation · {activePrompt.category}
                </p>
                <h2 className="mt-1 font-display text-xl sm:text-2xl font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
                  {activePrompt.promptText}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSwapPrompt();
                  const idx = SELF_APPRECIATION_PROMPTS.findIndex((p) => p.id === activePrompt.id);
                  setActivePrompt(
                    SELF_APPRECIATION_PROMPTS[(idx + 1) % SELF_APPRECIATION_PROMPTS.length]
                  );
                }}
                className="text-xs font-semibold text-[#554E6E] dark:text-[#C4BED9] hover:text-[#6C4FE0] cursor-pointer"
              >
                Rotate Question
              </button>
            </div>

            {/* Selectable Self-Appreciation Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {SELF_APPRECIATION_PROMPTS.slice(0, 4).map((prompt) => {
                const selected = activePrompt.id === prompt.id;
                return (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => setActivePrompt(prompt)}
                    className={`rounded-2xl p-3.5 text-left border transition-all cursor-pointer ${
                      selected
                        ? 'border-[#6C4FE0] bg-white dark:bg-[#2B2256] text-[#1E1340] dark:text-white shadow-sm'
                        : 'border-[#E6DFD3] dark:border-[#2E3452] bg-white/65 dark:bg-[#191D31]/80 text-[#554E6E] dark:text-[#C4BED9] hover:border-[#6C4FE0]/50'
                    }`}
                  >
                    <p className="text-[11px] font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
                      {prompt.category}
                    </p>
                    <p className="mt-1 text-xs font-medium leading-snug">{prompt.promptText}</p>
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!appreciationDraft.trim()) return;
                onSaveAppreciation(activePrompt, appreciationDraft.trim());
                setAppreciationDraft('');
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                value={appreciationDraft}
                onChange={(e) => setAppreciationDraft(e.target.value)}
                placeholder="Write a kind truth you want to remember about yourself..."
                className="flex-1 rounded-2xl border border-[#E6DFD3] dark:border-[#2E3452] bg-white dark:bg-[#16192C] px-4 py-3.5 text-sm focus:outline-none focus:border-[#6C4FE0]"
              />
              <button
                type="submit"
                disabled={!appreciationDraft.trim()}
                className="px-6 py-3.5 rounded-2xl text-xs font-semibold bg-[#6C4FE0] text-white disabled:opacity-45 hover:bg-[#5B3FD0] whitespace-nowrap cursor-pointer"
              >
                Save to Vault
              </button>
            </form>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-lg font-semibold">
              Self-Appreciation Vault · {appreciations.length} saved
            </h2>
            {appreciations.length === 0 ? (
              <EmptySanctuaryState
                title="Your Appreciation Vault is open"
                subtitle="Pick any prompt above and celebrate something real about yourself today."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appreciations.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-5 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
                        {item.promptText}
                      </p>
                      <button
                        type="button"
                        aria-label="Delete appreciation note"
                        onClick={() => onDeleteAppreciation(item.id)}
                        className="p-1 text-[#645F75] hover:text-[#B84A5E] cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm leading-relaxed text-[#1F1D2B] dark:text-[#F3F0EA]">
                      {item.answerText}
                    </p>
                    <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
                      {formatDateKeyLabel(item.dateKey, todayKey)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   SCREEN 8: MOTIVATION LIBRARY (FEATURE 4 — 105 OFFLINE MESSAGES, 7 CATEGORIES)
   ============================================================================ */
interface MotivationScreenProps {
  favoriteAffirmationIds: string[];
  specialMotivationAccess: RewardLevelSnapshot;
  onToggleFavorite: (id: string) => void;
  onShareQuote: (quoteText: string) => void;
  onOpenRewardUnlock: () => void;
  onBack: () => void;
}

export const MotivationScreen: React.FC<MotivationScreenProps> = ({
  favoriteAffirmationIds,
  specialMotivationAccess,
  onToggleFavorite,
  onShareQuote,
  onOpenRewardUnlock,
  onBack,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'FAVORITES' | MotivationCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const filteredMessages = useMemo(() => {
    return MOTIVATION_LIBRARY.filter((msg) => {
      if (categoryFilter === 'FAVORITES') {
        if (!favoriteAffirmationIds.includes(msg.id)) return false;
      } else if (categoryFilter !== 'ALL' && msg.toneCategory !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          msg.text.toLowerCase().includes(q) ||
          msg.toneCategory.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [categoryFilter, favoriteAffirmationIds, searchQuery]);

  const safePool = filteredMessages.length > 0 ? filteredMessages : MOTIVATION_LIBRARY;
  const normalizedIdx = ((featuredIndex % safePool.length) + safePool.length) % safePool.length;
  const featured = safePool[normalizedIdx];
  const isFeaturedFav = favoriteAffirmationIds.includes(featured.id);

  const handleShuffle = () => {
    if (safePool.length <= 1) return;
    let next = Math.floor(Math.random() * safePool.length);
    if (next === normalizedIdx) next = (normalizedIdx + 1) % safePool.length;
    setFeaturedIndex(next);
  };

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Motivation Library"
        subtitle={`${MOTIVATION_LIBRARY.length} original offline messages across 7 personal growth themes — always available without internet.`}
        onBack={onBack}
      />

      {/* Featured Message Editorial Spotlight */}
      <section className="rounded-3xl bg-gradient-to-br from-[#EFEAFF] via-[#FAF8F4] to-[#E4F7F9] dark:from-[#241E45] dark:via-[#1A1E33] dark:to-[#153140] border border-[#E6DFD3] dark:border-[#2C3250] p-7 sm:p-9 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
            {featured.toneCategory} · Message {normalizedIdx + 1} of {safePool.length}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous motivational message"
              onClick={() => setFeaturedIndex((i) => i - 1)}
              className="p-2 rounded-xl bg-white/80 dark:bg-[#222742] border border-[#E6DFD3] dark:border-[#323857] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Next motivational message"
              onClick={() => setFeaturedIndex((i) => i + 1)}
              className="p-2 rounded-xl bg-white/80 dark:bg-[#222742] border border-[#E6DFD3] dark:border-[#323857] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <blockquote className="font-display text-2xl sm:text-3xl font-semibold text-[#1E1340] dark:text-[#F3F0EA] leading-snug max-w-3xl text-balance">
          &ldquo;{featured.text}&rdquo;
        </blockquote>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onToggleFavorite(featured.id)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] cursor-pointer"
          >
            <Heart className={`w-4 h-4 ${isFeaturedFav ? 'fill-current' : ''}`} />
            <span>{isFeaturedFav ? 'Saved to Favorites' : 'Save Favorite'}</span>
          </button>
          <button
            type="button"
            onClick={handleShuffle}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#222742] border border-[#E6DFD3] dark:border-[#323857] text-[#1F1D2B] dark:text-[#F3F0EA] cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
          <button
            type="button"
            onClick={() => onShareQuote(featured.text)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#222742] border border-[#E6DFD3] dark:border-[#323857] text-[#256B9A] dark:text-[#79BCE8] cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share as Card</span>
          </button>
        </div>
      </section>

      {/* LEVEL 1: SPECIAL MOTIVATION COLLECTION (2H TIMED OFFLINE REWARD) */}
      <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
              Level 1 Optional Collection · 2h Reward Access
            </p>
            <h2 className="font-display text-lg font-semibold">
              Special Motivation Collection
            </h2>
            <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
              Curated restorative essays with calm reflection cues. All 105 Basic Motivation messages below remain permanently free.
            </p>
          </div>
          {specialMotivationAccess.isUnlocked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#E4F7F9] dark:bg-[#163644] text-[#133A56] dark:text-[#79BCE8] tabular-nums">
              <Unlock className="w-3.5 h-3.5" />
              <span>Active · {specialMotivationAccess.remainingFormatted}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={onOpenRewardUnlock}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>
                {specialMotivationAccess.status === 'EXPIRED'
                  ? 'Access Expired · Re-Unlock 2h'
                  : 'Unlock for 2 Hours'}
              </span>
            </button>
          )}
        </div>

        {specialMotivationAccess.isUnlocked ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LEVEL_1_SPECIAL_MOTIVATION_COLLECTION.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] border border-[#E6DFD3] dark:border-[#2E3452] p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-[#256B9A] dark:text-[#79BCE8]">
                    {item.theme}
                  </p>
                  <h3 className="font-display text-sm font-semibold">{item.title}</h3>
                  <p className="text-xs text-[#1F1D2B] dark:text-[#F3F0EA] leading-relaxed">
                    {item.message}
                  </p>
                  <p className="text-[11px] italic text-[#645F75] dark:text-[#B3AEC4]">
                    Cue: {item.reflectionCue}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onShareQuote(item.message)}
                  className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF] hover:underline cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share as Card</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] px-4 py-3.5 text-xs text-[#645F75] dark:text-[#B3AEC4] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#6C4FE0] dark:text-[#A994FF] shrink-0" />
            <span>
              Unlock 6 curated deep-calm essays &amp; cues for 2 hours via Rewarded Access (available offline after unlocking).
            </span>
          </div>
        )}
      </section>

      {/* Search + 7 Exact Categories Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#645F75] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setFeaturedIndex(0);
            }}
            placeholder="Search all 105 offline messages by keyword or theme..."
            className="w-full rounded-2xl border border-[#E6DFD3] dark:border-[#2E3452] bg-white dark:bg-[#1A1E33] pl-10 pr-10 py-3 text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#645F75] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('ALL');
              setFeaturedIndex(0);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-[#1E1340] dark:bg-[#6C4FE0] text-white'
                : 'bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] text-[#645F75] dark:text-[#B3AEC4]'
            }`}
          >
            All ({MOTIVATION_LIBRARY.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter('FAVORITES');
              setFeaturedIndex(0);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              categoryFilter === 'FAVORITES'
                ? 'bg-[#6C4FE0] text-white'
                : 'bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] text-[#645F75] dark:text-[#B3AEC4]'
            }`}
          >
            Favorites ({favoriteAffirmationIds.length})
          </button>

          {MOTIVATION_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setCategoryFilter(category);
                setFeaturedIndex(0);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                categoryFilter === category
                  ? 'bg-[#256B9A] text-white'
                  : 'bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] text-[#645F75] dark:text-[#B3AEC4]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Browsable Message Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">
            {categoryFilter === 'ALL'
              ? 'Full Offline Collection'
              : categoryFilter === 'FAVORITES'
              ? 'Your Saved Favorites'
              : categoryFilter}{' '}
            · {filteredMessages.length} messages
          </h2>
        </div>

        {filteredMessages.length === 0 ? (
          <EmptySanctuaryState
            title="No messages matched"
            subtitle={
              categoryFilter === 'FAVORITES'
                ? 'Tap the heart on any message to keep it in your favorites sanctuary.'
                : 'Try another search word or category filter.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMessages.map((item, idx) => {
              const fav = favoriteAffirmationIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-[#256B9A] dark:text-[#79BCE8]">
                      {item.toneCategory}
                    </p>
                    <p className="text-sm font-medium leading-relaxed text-[#1F1D2B] dark:text-[#F3F0EA]">
                      {item.text}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#EFEAE0] dark:border-[#262B45]">
                    <button
                      type="button"
                      onClick={() => setFeaturedIndex(idx)}
                      className="text-xs font-medium text-[#645F75] dark:text-[#B3AEC4] hover:text-[#6C4FE0] cursor-pointer"
                    >
                      Spotlight
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Share message as card"
                        onClick={() => onShareQuote(item.text)}
                        className="p-1.5 text-[#645F75] hover:text-[#256B9A] cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={fav ? 'Remove favorite' : 'Save favorite'}
                        onClick={() => onToggleFavorite(item.id)}
                        className={`p-1.5 cursor-pointer ${
                          fav ? 'text-[#6C4FE0] dark:text-[#A994FF]' : 'text-[#645F75]'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

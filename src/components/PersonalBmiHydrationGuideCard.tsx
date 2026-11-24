import React, { useMemo, useState } from 'react';
import {
  Activity,
  Brain,
  CheckCircle2,
  Clock,
  Droplets,
  Gift,
  HeartPulse,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
  Sun,
  Unlock,
} from 'lucide-react';
import {
  ActivityLevel,
  ClimateType,
  MeasurementUnit,
  PersonalBodyMetrics,
} from '../types/dailyTide';
import { formatLitresOnly, formatVolume } from '../data/localStore';
import { RewardLevelSnapshot } from '../rewards/rewardAccessManager';

export interface BmiHydrationGuidanceResult {
  bmi: number;
  bmiCategory: 'Underweight' | 'Healthy Range' | 'Overweight' | 'Elevated BMI';
  bmiSummary: string;
  bmiMarkerPercent: number;
  healthyWeightMinKg: number;
  healthyWeightMaxKg: number;
  recommendedMl: number;
  safeRangeMinMl: number;
  safeRangeMaxMl: number;
  safeHourlyMaxMl: number;
  pacingSlots: {
    window: string;
    label: string;
    amountMl: number;
    tip: string;
  }[];
  benefits: {
    title: string;
    detail: string;
    icon: 'focus' | 'digestion' | 'recovery' | 'balance';
  }[];
}

export const DEFAULT_BODY_METRICS: PersonalBodyMetrics = {
  heightCm: 168,
  weightKg: 65,
  activityLevel: 'MODERATE',
  climate: 'TEMPERATE',
  measurementSystem: 'METRIC',
};

/**
 * Pure, strictly local BMI & gentle hydration wellness estimator.
 * Never transmits personal body metrics over the network or to ad services.
 * Uses conservative, safe daily pacing windows and clearly frames output as general wellness guidance.
 */
export function calculatePersonalHydrationBmiGuide(
  metrics: PersonalBodyMetrics
): BmiHydrationGuidanceResult {
  const safeHeightCm = Math.min(Math.max(metrics.heightCm || 168, 120), 230);
  const safeWeightKg = Math.min(Math.max(metrics.weightKg || 65, 32), 220);
  const heightM = safeHeightCm / 100;

  const rawBmi = safeWeightKg / (heightM * heightM);
  const bmi = Number(rawBmi.toFixed(1));

  let bmiCategory: BmiHydrationGuidanceResult['bmiCategory'] = 'Healthy Range';
  let bmiSummary =
    'Your BMI sits within the standard balanced wellness range. Steady, spaced-out hydration supports energy, clarity, and daily recovery.';

  if (bmi < 18.5) {
    bmiCategory = 'Underweight';
    bmiSummary =
      'Your BMI is below 18.5. Gentle hydration alongside nourishing meals supports steady energy — avoid drinking large volumes right before eating so appetite stays comfortable.';
  } else if (bmi < 25) {
    bmiCategory = 'Healthy Range';
    bmiSummary =
      'Your BMI sits within the standard balanced wellness range. Steady, spaced-out hydration supports energy, clarity, and daily recovery.';
  } else if (bmi < 30) {
    bmiCategory = 'Overweight';
    bmiSummary =
      'Your BMI is slightly above 24.9. Sipping water evenly across the day can support metabolism, satiety cues, and joint comfort without extreme targets.';
  } else {
    bmiCategory = 'Elevated BMI';
    bmiSummary =
      'Your BMI is 30 or above. Consistent, comfortably paced sips support circulation, digestion, and energy — paired with safe upper limits so hydration always feels gentle.';
  }

  // Visual bar maps BMI 15..40 to 0..100%
  const bmiMarkerPercent = Math.min(Math.max(((bmi - 15) / 25) * 100, 2), 98);

  const healthyWeightMinKg = Math.round(18.5 * heightM * heightM);
  const healthyWeightMaxKg = Math.round(24.9 * heightM * heightM);

  // Conservative wellness hydration baseline: ~32 ml/kg for balanced reference weight
  // (using adjusted weight above BMI 28 to prevent unrealistically high recommendations)
  const effectiveWeightKg =
    bmi > 28
      ? healthyWeightMaxKg + (safeWeightKg - healthyWeightMaxKg) * 0.45
      : safeWeightKg;

  const activityBonus =
    metrics.activityLevel === 'ACTIVE' ? 500 : metrics.activityLevel === 'MODERATE' ? 250 : 0;
  const climateBonus =
    metrics.climate === 'WARM' ? 350 : metrics.climate === 'TEMPERATE' ? 100 : 0;

  const rawTarget = effectiveWeightKg * 32 + activityBonus + climateBonus;
  const clampedTarget = Math.min(Math.max(rawTarget, 1500), 4000);
  const recommendedMl = Math.round(clampedTarget / 50) * 50;

  const safeRangeMinMl = Math.max(1400, Math.round((recommendedMl - 250) / 50) * 50);
  const safeRangeMaxMl = Math.min(4200, Math.round((recommendedMl + 250) / 50) * 50);
  const safeHourlyMaxMl = 750; // Safe pacing guardrail against rapid over-hydration

  // Split into 4 calm windows: 25% Morning, 30% Midday, 30% Afternoon, 15% Evening
  const morningMl = Math.round((recommendedMl * 0.25) / 50) * 50;
  const middayMl = Math.round((recommendedMl * 0.3) / 50) * 50;
  const afternoonMl = Math.round((recommendedMl * 0.3) / 50) * 50;
  const eveningMl = Math.max(200, recommendedMl - morningMl - middayMl - afternoonMl);

  const pacingSlots = [
    {
      window: '7:00 – 10:30 AM',
      label: 'Morning Rehydration',
      amountMl: morningMl,
      tip: 'Start gently after waking to replenish overnight fluid loss.',
    },
    {
      window: '10:30 AM – 2:30 PM',
      label: 'Midday Steady Flow',
      amountMl: middayMl,
      tip: 'Sip steadily alongside lunch to support focus and digestion.',
    },
    {
      window: '2:30 – 6:30 PM',
      label: 'Afternoon Refresh',
      amountMl: afternoonMl,
      tip:
        metrics.activityLevel === 'ACTIVE'
          ? 'Replenish movement sweat gradually with small sips and electrolytes if needed.'
          : 'Prevents the late-afternoon energy dip and supports mental clarity.',
    },
    {
      window: '6:30 – 9:30 PM',
      label: 'Calm Evening Taper',
      amountMl: eveningMl,
      tip: 'Keep evening sips lighter so your sleep stays uninterrupted.',
    },
  ];

  const benefits: BmiHydrationGuidanceResult['benefits'] = [
    {
      title: 'Sharper Focus & Calm Mood',
      detail:
        'Even mild 1–2% dehydration can increase fatigue and tension. Keeping your intake near your personal Litre range supports clear thinking.',
      icon: 'focus',
    },
    {
      title: 'Smooth Digestion & Appetite Cues',
      detail:
        bmi >= 25
          ? 'Spacing water between meals helps distinguish true hunger from thirst and supports gentle metabolic rhythm.'
          : 'Sipping steadily between meals supports nutrient absorption without crowding mealtime comfort.',
      icon: 'digestion',
    },
    {
      title:
        metrics.activityLevel === 'ACTIVE'
          ? 'Muscle Recovery & Joint Cushioning'
          : 'Circulation & Joint Comfort',
      detail:
        metrics.activityLevel === 'ACTIVE'
          ? 'Active bodies lose fluid faster; consistent hydration cushions joints and aids post-movement recovery.'
          : 'Steady daily hydration lubricates joints, supports circulation, and reduces stiffness from sitting.',
      icon: 'recovery',
    },
    {
      title:
        metrics.climate === 'WARM'
          ? 'Cooling Balance in Warm Weather'
          : 'Skin Hydration & Safer Pacing',
      detail:
        metrics.climate === 'WARM'
          ? 'Warmer air increases silent fluid loss. Sip calmly throughout the day instead of drinking too much at once.'
          : 'Spread intake evenly (staying under 750 ml per hour) to keep electrolyte balance safe and skin refreshed.',
      icon: 'balance',
    },
  ];

  return {
    bmi,
    bmiCategory,
    bmiSummary,
    bmiMarkerPercent,
    healthyWeightMinKg,
    healthyWeightMaxKg,
    recommendedMl,
    safeRangeMinMl,
    safeRangeMaxMl,
    safeHourlyMaxMl,
    pacingSlots,
    benefits,
  };
}

interface PersonalBmiHydrationGuideCardProps {
  unit: MeasurementUnit;
  currentGoalMl: number;
  savedMetrics?: PersonalBodyMetrics;
  rewardAccess: RewardLevelSnapshot;
  onSaveMetrics: (metrics: PersonalBodyMetrics) => void;
  onApplyRecommendedGoal: (goalMl: number) => void;
  onRequestAdUnlock: () => void;
}

export const PersonalBmiHydrationGuideCard: React.FC<PersonalBmiHydrationGuideCardProps> = ({
  unit,
  currentGoalMl,
  savedMetrics,
  rewardAccess,
  onSaveMetrics,
  onApplyRecommendedGoal,
  onRequestAdUnlock,
}) => {
  const [metrics, setMetrics] = useState<PersonalBodyMetrics>(
    savedMetrics ?? DEFAULT_BODY_METRICS
  );
  const [appliedFlash, setAppliedFlash] = useState(false);

  const updateMetrics = (partial: Partial<PersonalBodyMetrics>) => {
    setMetrics((prev) => {
      const next = { ...prev, ...partial };
      onSaveMetrics(next);
      return next;
    });
  };

  const guide = useMemo(() => calculatePersonalHydrationBmiGuide(metrics), [metrics]);

  // Imperial helpers synced from canonical cm/kg
  const totalInches = Math.round(metrics.heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  const weightLbs = Math.round(metrics.weightKg * 2.20462);

  const handleSetImperialHeight = (nextFeet: number, nextInches: number) => {
    const safeFt = Math.min(Math.max(nextFeet, 4), 7);
    const safeIn = Math.min(Math.max(nextInches, 0), 11);
    const cm = Math.round((safeFt * 12 + safeIn) * 2.54);
    updateMetrics({ heightCm: Math.min(Math.max(cm, 120), 230) });
  };

  const handleSetImperialWeight = (lbs: number) => {
    const safeLbs = Math.min(Math.max(lbs, 70), 485);
    const kg = Number((safeLbs / 2.20462).toFixed(1));
    updateMetrics({ weightKg: kg });
  };

  const handleApplyGoal = () => {
    onApplyRecommendedGoal(guide.recommendedMl);
    setAppliedFlash(true);
    window.setTimeout(() => setAppliedFlash(false), 2400);
  };

  const categoryColorClass =
    guide.bmiCategory === 'Healthy Range'
      ? 'bg-[#E6F7F2] dark:bg-[#16362F] text-[#1D7A5F] dark:text-[#7DE0C0]'
      : guide.bmiCategory === 'Underweight'
      ? 'bg-[#E6F4FA] dark:bg-[#173245] text-[#256B9A] dark:text-[#79BCE8]'
      : guide.bmiCategory === 'Overweight'
      ? 'bg-[#FFF3E0] dark:bg-[#3A2B1D] text-[#A86214] dark:text-[#F6C177]'
      : 'bg-[#FDECEF] dark:bg-[#3B1F29] text-[#A63D55] dark:text-[#F49EB0]';

  // LOCKED / EXPIRED PREMIUM PREVIEW GATE (UNLOCKED AFTER COMPLETING OPTIONAL REWARDED AD)
  if (!rewardAccess.isUnlocked) {
    return (
      <section className="rounded-3xl bg-gradient-to-br from-[#F4F0FF] via-white to-[#E6F7F9] dark:from-[#211C42] dark:via-[#1A1E33] dark:to-[#162C3A] border border-[#D9CEF7] dark:border-[#342D61] p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#6C4FE0] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6C4FE0] dark:text-[#A994FF]">
                {rewardAccess.config.badgeLabel} · Optional Ad Unlock ({rewardAccess.config.durationHours}h)
              </p>
              <h2 className="font-display text-lg font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
                Personal BMI &amp; Safe Hydration Guide
              </h2>
              <p className="mt-1 text-xs text-[#554E6E] dark:text-[#C8C3DC] leading-relaxed">
                Get personalized hydration guidance calculated from your height, weight (BMI), activity, and climate — shown clearly in Litres (L), ml, and oz with safer pacing tips.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white/80 dark:bg-[#1A1E33] text-[#645F75] dark:text-[#B3AEC4] border border-[#E6DFD3] dark:border-[#2C3250]">
            <Lock className="w-3 h-3" />
            <span>{rewardAccess.status === 'EXPIRED' ? 'Expired' : 'Premium'}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="rounded-2xl bg-white/85 dark:bg-[#1A1E33]/85 border border-[#E6DFD3]/70 dark:border-[#2C3250] p-3.5 space-y-1">
            <p className="font-semibold text-[#1E1340] dark:text-[#F3F0EA] flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#6C4FE0] dark:text-[#A994FF]" />
              <span>Height &amp; Weight BMI</span>
            </p>
            <p className="text-[11px] text-[#645F75] dark:text-[#B3AEC4]">
              Private on-device BMI bar &amp; healthy reference range in metric or imperial.
            </p>
          </div>
          <div className="rounded-2xl bg-white/85 dark:bg-[#1A1E33]/85 border border-[#E6DFD3]/70 dark:border-[#2C3250] p-3.5 space-y-1">
            <p className="font-semibold text-[#1E1340] dark:text-[#F3F0EA] flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-[#36B5C4]" />
              <span>Safe Litre Guidance</span>
            </p>
            <p className="text-[11px] text-[#645F75] dark:text-[#B3AEC4]">
              Tailored daily range in Litres (L) + 4-part safe pacing plan so you never over-hydrate.
            </p>
          </div>
          <div className="rounded-2xl bg-white/85 dark:bg-[#1A1E33]/85 border border-[#E6DFD3]/70 dark:border-[#2C3250] p-3.5 space-y-1">
            <p className="font-semibold text-[#1E1340] dark:text-[#F3F0EA] flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-[#256B9A] dark:text-[#79BCE8]" />
              <span>Body &amp; Focus Benefits</span>
            </p>
            <p className="text-[11px] text-[#645F75] dark:text-[#B3AEC4]">
              Personalized digestion, energy, climate &amp; recovery insights — 100% private.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-[#554E6E] dark:text-[#B3AEC4] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#36B5C4] shrink-0" />
            <span>100% optional · works offline for 48h after unlocking · basic tracking is always free</span>
          </p>
          <button
            type="button"
            onClick={onRequestAdUnlock}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#6C4FE0] text-white text-xs sm:text-sm font-semibold hover:bg-[#5B3FD0] transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Gift className="w-4 h-4" />
            <span>Watch Optional Ad · Unlock 48h Premium Guide</span>
          </button>
        </div>
      </section>
    );
  }

  // UNLOCKED PREMIUM PERSONAL BMI & SAFE HYDRATION STUDIO
  return (
    <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border-2 border-[#6C4FE0]/40 dark:border-[#6C4FE0]/50 p-6 space-y-6 shadow-xs">
      {/* Header with Live Expiration Countdown */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#EFEAFF] dark:bg-[#2A2252] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#6C4FE0] dark:text-[#A994FF]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6C4FE0] dark:text-[#A994FF]">
              Premium Unlocked · Private On-Device Guidance
            </p>
            <h2 className="font-display text-lg sm:text-xl font-semibold">
              Personal BMI &amp; Safe Hydration Guide
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#E4F7F9] dark:bg-[#163644] text-[#133A56] dark:text-[#79BCE8] tabular-nums">
            <Unlock className="w-3.5 h-3.5" />
            <Clock className="w-3 h-3" />
            <span>{rewardAccess.remainingFormatted}</span>
          </span>
        </div>
      </div>

      {/* Height, Weight, Activity & Climate Inputs */}
      <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] border border-[#EFEAE0] dark:border-[#2C3250] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]">
            Your Body &amp; Routine Profile (saved strictly on your device)
          </p>
          <div className="inline-flex rounded-xl bg-white dark:bg-[#1A1E33] p-0.5 border border-[#E6DFD3] dark:border-[#2E3452]">
            {(['METRIC', 'IMPERIAL'] as const).map((sys) => (
              <button
                key={sys}
                type="button"
                onClick={() => updateMetrics({ measurementSystem: sys })}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                  metrics.measurementSystem === sys
                    ? 'bg-[#6C4FE0] text-white'
                    : 'text-[#645F75] dark:text-[#B3AEC4]'
                }`}
              >
                {sys === 'METRIC' ? 'cm / kg' : 'ft·in / lbs'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metrics.measurementSystem === 'METRIC' ? (
            <>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label htmlFor="bmi-height-cm" className="font-medium text-[#645F75] dark:text-[#B3AEC4]">
                    Height (cm)
                  </label>
                  <span className="font-semibold tabular-nums">{metrics.heightCm} cm</span>
                </div>
                <input
                  id="bmi-height-cm"
                  type="range"
                  min={130}
                  max={215}
                  step={1}
                  value={metrics.heightCm}
                  onChange={(e) => updateMetrics({ heightCm: Number(e.target.value) })}
                  className="w-full accent-[#6C4FE0]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label htmlFor="bmi-weight-kg" className="font-medium text-[#645F75] dark:text-[#B3AEC4]">
                    Weight (kg)
                  </label>
                  <span className="font-semibold tabular-nums">{metrics.weightKg} kg</span>
                </div>
                <input
                  id="bmi-weight-kg"
                  type="range"
                  min={38}
                  max={160}
                  step={1}
                  value={metrics.weightKg}
                  onChange={(e) => updateMetrics({ weightKg: Number(e.target.value) })}
                  className="w-full accent-[#36B5C4]"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <span className="block text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
                  Height (ft / in)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2E3452] px-3 py-2">
                    <input
                      type="number"
                      min={4}
                      max={7}
                      value={feet}
                      onChange={(e) => handleSetImperialHeight(Number(e.target.value), inches)}
                      aria-label="Height feet"
                      className="w-full bg-transparent text-sm font-semibold tabular-nums focus:outline-none"
                    />
                    <span className="text-xs text-[#645F75]">ft</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2E3452] px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      max={11}
                      value={inches}
                      onChange={(e) => handleSetImperialHeight(feet, Number(e.target.value))}
                      aria-label="Height inches"
                      className="w-full bg-transparent text-sm font-semibold tabular-nums focus:outline-none"
                    />
                    <span className="text-xs text-[#645F75]">in</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label htmlFor="bmi-weight-lbs" className="font-medium text-[#645F75] dark:text-[#B3AEC4]">
                    Weight (lbs)
                  </label>
                  <span className="font-semibold tabular-nums">{weightLbs} lbs</span>
                </div>
                <input
                  id="bmi-weight-lbs"
                  type="range"
                  min={85}
                  max={350}
                  step={1}
                  value={weightLbs}
                  onChange={(e) => handleSetImperialWeight(Number(e.target.value))}
                  className="w-full accent-[#36B5C4]"
                />
              </div>
            </>
          )}
        </div>

        {/* Activity & Climate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-[#645F75] dark:text-[#B3AEC4] inline-flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#6C4FE0]" />
              <span>Daily Activity Level</span>
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  ['LIGHT', 'Light'],
                  ['MODERATE', 'Moderate'],
                  ['ACTIVE', 'Active'],
                ] as [ActivityLevel, string][]
              ).map(([lvl, label]) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => updateMetrics({ activityLevel: lvl })}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    metrics.activityLevel === lvl
                      ? 'border-[#6C4FE0] bg-[#EFEAFF] dark:bg-[#2E235C] text-[#1E1340] dark:text-white'
                      : 'border-[#E6DFD3] dark:border-[#2E3452] bg-white dark:bg-[#1A1E33] text-[#645F75] dark:text-[#B3AEC4]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-[#645F75] dark:text-[#B3AEC4] inline-flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-[#E09F3E]" />
              <span>Local Climate</span>
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  ['COOL', 'Cool'],
                  ['TEMPERATE', 'Mild'],
                  ['WARM', 'Warm / Hot'],
                ] as [ClimateType, string][]
              ).map(([clim, label]) => (
                <button
                  key={clim}
                  type="button"
                  onClick={() => updateMetrics({ climate: clim })}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    metrics.climate === clim
                      ? 'border-[#36B5C4] bg-[#E4F7F9] dark:bg-[#163644] text-[#133A56] dark:text-[#AEE8F0]'
                      : 'border-[#E6DFD3] dark:border-[#2E3452] bg-white dark:bg-[#1A1E33] text-[#645F75] dark:text-[#B3AEC4]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BMI Summary & Recommended Safe Water Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BMI Card */}
        <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] border border-[#EFEAE0] dark:border-[#2C3250] p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#645F75] dark:text-[#B3AEC4]">
              Estimated BMI
            </span>
            <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${categoryColorClass}`}>
              {guide.bmiCategory}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold tabular-nums text-[#1E1340] dark:text-[#F3F0EA]">
              {guide.bmi}
            </span>
            <span className="text-xs text-[#645F75] dark:text-[#B3AEC4]">kg/m²</span>
          </div>

          {/* Visual BMI Range Bar */}
          <div className="space-y-1.5">
            <div className="relative h-2.5 rounded-full overflow-hidden flex">
              <div className="w-[14%] bg-[#79BCE8]" />
              <div className="w-[26%] bg-[#36B5C4]" />
              <div className="w-[20%] bg-[#E09F3E]" />
              <div className="w-[40%] bg-[#D96B84]" />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#1E1340] dark:bg-white border-2 border-white dark:border-[#1E1340] shadow-xs"
                style={{ left: `${guide.bmiMarkerPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
              <span>15</span>
              <span>18.5</span>
              <span>25</span>
              <span>30</span>
              <span>40</span>
            </div>
          </div>

          <p className="text-xs text-[#554E6E] dark:text-[#C8C3DC] leading-relaxed">
            {guide.bmiSummary}
          </p>
          <p className="text-[11px] text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
            Standard healthy weight reference for {metrics.heightCm} cm:{' '}
            <strong className="text-[#1F1D2B] dark:text-[#F3F0EA]">
              {guide.healthyWeightMinKg}–{guide.healthyWeightMaxKg} kg
            </strong>
          </p>
        </div>

        {/* Personalized Safe Hydration Range Card */}
        <div className="rounded-2xl bg-gradient-to-br from-[#E4F7F9] to-[#EFEAFF] dark:from-[#163140] dark:to-[#241E46] border border-[#CBEAF0] dark:border-[#2C3E58] p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#256B9A] dark:text-[#79BCE8]">
              Suggested Safe Daily Intake
            </span>
            <div className="flex items-baseline flex-wrap gap-2">
              <span className="font-display text-3xl font-semibold tabular-nums text-[#133A56] dark:text-white">
                {formatLitresOnly(guide.recommendedMl)}
              </span>
              <span className="text-xs font-medium text-[#3C5064] dark:text-[#BBD8E8] tabular-nums">
                ({guide.recommendedMl.toLocaleString()} ml ·{' '}
                {Math.round(guide.recommendedMl / 29.5735)} oz)
              </span>
            </div>
            <p className="text-xs text-[#2B4357] dark:text-[#C8DFEE] leading-relaxed tabular-nums">
              Comfortable daily window:{' '}
              <strong>
                {formatLitresOnly(guide.safeRangeMinMl)} – {formatLitresOnly(guide.safeRangeMaxMl)}
              </strong>
              . Keep pace gentle (under {formatVolume(guide.safeHourlyMaxMl, unit)} per hour) so hydration stays safe and balanced.
            </p>
          </div>

          <button
            type="button"
            onClick={handleApplyGoal}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#256B9A] text-white text-xs font-semibold hover:bg-[#1D5982] transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {appliedFlash
                ? `Applied ${formatVolume(guide.recommendedMl, unit)} to Your Goal!`
                : currentGoalMl === guide.recommendedMl
                ? `Already Active (${formatVolume(guide.recommendedMl, unit)})`
                : `Apply ${formatVolume(guide.recommendedMl, unit)} as My Daily Goal`}
            </span>
          </button>
        </div>
      </div>

      {/* Safer 4-Part Daily Pacing Schedule */}
      <div className="space-y-2.5">
        <h3 className="font-display text-sm font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]">
          Safer Daily Hydration Pacing Plan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {guide.pacingSlots.map((slot) => (
            <div
              key={slot.label}
              className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] border border-[#EFEAE0] dark:border-[#2C3250] p-3.5 space-y-1"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6C4FE0] dark:text-[#A994FF]">
                {slot.window}
              </p>
              <p className="text-xs font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]">
                {slot.label}
              </p>
              <p className="font-display text-base font-semibold text-[#256B9A] dark:text-[#79BCE8] tabular-nums">
                {formatVolume(slot.amountMl, unit)}
              </p>
              <p className="text-[11px] text-[#645F75] dark:text-[#B3AEC4] leading-snug">
                {slot.tip}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Personalized Wellness Benefits */}
      <div className="space-y-2.5">
        <h3 className="font-display text-sm font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]">
          Personal Benefits of Staying Within Your Safe Hydration Range
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {guide.benefits.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] border border-[#EFEAE0] dark:border-[#2C3250] p-4 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-[#EFEAFF] dark:bg-[#2E235C] flex items-center justify-center shrink-0 mt-0.5">
                {item.icon === 'focus' ? (
                  <Brain className="w-4 h-4 text-[#6C4FE0] dark:text-[#A994FF]" />
                ) : item.icon === 'digestion' ? (
                  <Droplets className="w-4 h-4 text-[#36B5C4]" />
                ) : item.icon === 'recovery' ? (
                  <HeartPulse className="w-4 h-4 text-[#256B9A] dark:text-[#79BCE8]" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[#E09F3E]" />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]">
                  {item.title}
                </p>
                <p className="text-[11px] text-[#645F75] dark:text-[#B3AEC4] leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transparent Non-Medical Wellness Disclaimer */}
      <p className="text-[11px] text-[#645F75] dark:text-[#B3AEC4] leading-relaxed pt-2 border-t border-[#EFEAE0] dark:border-[#262B45]">
        Wellness note: BMI and water estimates are general everyday self-care guidance only — never medical advice. Listen to your thirst, avoid rapid over-hydration, and follow your healthcare provider&apos;s advice if you have kidney, heart, or fluid-balance conditions.
      </p>
    </section>
  );
};

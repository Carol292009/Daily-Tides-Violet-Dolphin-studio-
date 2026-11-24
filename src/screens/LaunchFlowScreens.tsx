import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, Droplets, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { MeasurementUnit } from '../types/dailyTide';
import { STUDIO_LOGO_PATH, formatVolume } from '../data/localStore';
import { requestNotificationPermissionOnDemand } from '../data/localBackup';
import { ProgressRing } from '../components/TidePrimitives';

/* ============================================================================
   SCREEN 1: SPLASH SCREEN
   ============================================================================ */
interface SplashScreenProps {
  onContinue: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  useEffect(() => {
    const timer = window.setTimeout(onContinue, 1750);
    return () => window.clearTimeout(timer);
  }, [onContinue]);

  return (
    <div className="min-h-screen bg-[#FAF8F4] dark:bg-[#111322] text-[#1F1D2B] dark:text-[#F3F0EA] flex flex-col items-center justify-between p-8">
      <div className="h-6" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="flex flex-col items-center text-center max-w-md"
      >
        <img
          src={STUDIO_LOGO_PATH}
          alt="Daily Tide by Violet Dolphin Studio"
          referrerPolicy="no-referrer"
          className="w-28 h-28 rounded-3xl object-cover shadow-md border border-[#E6DFD3] dark:border-[#2C3250]"
        />
        <h1 className="mt-7 font-display text-4xl font-semibold tracking-tight text-[#1F1D2B] dark:text-[#F3F0EA]">
          Daily Tide
        </h1>
        <p className="mt-2 text-base text-[#645F75] dark:text-[#B3AEC4]">
          Little habits. Better days.
        </p>

        <button
          type="button"
          onClick={onContinue}
          className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF] hover:bg-[#EFEAFF] dark:hover:bg-[#231D44] transition-colors cursor-pointer"
        >
          <span>Enter Sanctuary</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>

      <div className="text-center space-y-1">
        <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
          By Violet Dolphin Studio
        </p>
        <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
          Smart Tools. Healthier You. · Offline-First
        </p>
      </div>
    </div>
  );
};

/* ============================================================================
   SCREEN 2: ONBOARDING (BEGINS IMMEDIATELY WITH USER NAME ENTRY)
   ============================================================================ */
interface OnboardingScreenProps {
  initialName: string;
  onQuickEnterDashboard: (displayName: string) => void;
  onContinueToSetup: (displayName: string) => void;
}

const ONBOARDING_HIGHLIGHTS = [
  {
    kicker: 'Hydration & Quests',
    title: 'Small daily care that grows your garden',
    description:
      'Log water with custom glasses, complete gentle daily quests, and watch your offline Progress Garden bloom.',
    icon: Droplets,
    accent: 'text-[#36B5C4]',
  },
  {
    kicker: 'Reflection & Kindness',
    title: 'Moods, journaling, and self-appreciation',
    description:
      'Pause for 5-minute reflections, save daily wins, and draw from 105 local motivational affirmations.',
    icon: HeartHandshake,
    accent: 'text-[#6C4FE0] dark:text-[#A994FF]',
  },
  {
    kicker: '100% Local & Private',
    title: 'Everything stays strictly on your device',
    description:
      'No accounts, no cloud sync, no internet required. Zero manipulative alerts or guilt-based streaks.',
    icon: ShieldCheck,
    accent: 'text-[#256B9A] dark:text-[#79BCE8]',
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  initialName,
  onQuickEnterDashboard,
  onContinueToSetup,
}) => {
  const [name, setName] = useState(initialName === 'Friend' ? '' : initialName);
  const [step, setStep] = useState(0); // Step 0 = Ask User Name First, Steps 1..3 = Calm Feature Tour

  const resolvedName = name.trim() || 'Friend';

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickEnterDashboard(resolvedName);
  };

  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] dark:bg-[#111322] text-[#1F1D2B] dark:text-[#F3F0EA] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-8 sm:p-10 space-y-7 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={STUDIO_LOGO_PATH}
                alt="Violet Dolphin Studio"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-xl object-cover border border-[#E6DFD3] dark:border-[#2C3250]"
              />
              <div>
                <p className="font-display text-sm font-semibold leading-tight">Daily Tide</p>
                <p className="text-[11px] text-[#645F75] dark:text-[#B3AEC4]">
                  By Violet Dolphin Studio
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-[#6C4FE0] dark:text-[#A994FF]">
              100% Offline
            </span>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Welcome to your calm self-care space</span>
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">
              What should we call you?
            </h1>
            <p className="text-sm text-[#645F75] dark:text-[#B3AEC4] leading-relaxed">
              Write your name so Daily Tide can greet you personally on your dashboard. Stored only on your device.
            </p>
          </div>

          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div>
              <label htmlFor="welcome-display-name" className="block text-xs font-semibold mb-1.5 text-[#645F75] dark:text-[#B3AEC4]">
                Your Name
              </label>
              <input
                id="welcome-display-name"
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Type your name here..."
                className="w-full rounded-2xl border-2 border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-4 py-3.5 text-base font-medium focus:outline-none focus:border-[#6C4FE0] transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#6C4FE0] text-white font-semibold text-sm hover:bg-[#5B3FD0] transition-colors cursor-pointer"
            >
              <span>
                {name.trim() ? `Open ${name.trim()}’s Dashboard` : 'Enter My Dashboard'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-[#EFEAE0] dark:border-[#262B45] flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-[#256B9A] dark:text-[#79BCE8] hover:underline cursor-pointer"
            >
              See quick tour first
            </button>
            <button
              type="button"
              onClick={() => onContinueToSetup(resolvedName)}
              className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF] hover:underline cursor-pointer"
            >
              Customize hydration goal &amp; habits →
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const slide = ONBOARDING_HIGHLIGHTS[step - 1];
  const SlideIcon = slide.icon;

  return (
    <div className="min-h-screen bg-[#FAF8F4] dark:bg-[#111322] text-[#1F1D2B] dark:text-[#F3F0EA] flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-8 sm:p-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={STUDIO_LOGO_PATH}
              alt="Violet Dolphin Studio"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-display text-sm font-semibold">
              Daily Tide{name.trim() ? ` · ${name.trim()}` : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onQuickEnterDashboard(resolvedName)}
            className="text-xs font-medium text-[#645F75] dark:text-[#B3AEC4] hover:text-[#6C4FE0] cursor-pointer py-1 px-2"
          >
            Go to Dashboard
          </button>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28 }}
          className="py-4 text-center space-y-4"
        >
          <div className="mx-auto w-16 h-16 rounded-3xl bg-[#FAF8F4] dark:bg-[#222742] border border-[#E6DFD3] dark:border-[#2F3554] flex items-center justify-center">
            <SlideIcon className={`w-7 h-7 ${slide.accent}`} />
          </div>
          <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
            {slide.kicker}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
            {slide.title}
          </h2>
          <p className="text-sm sm:text-base text-[#645F75] dark:text-[#B3AEC4] leading-relaxed max-w-md mx-auto">
            {slide.description}
          </p>
        </motion.div>

        <div className="flex items-center justify-center gap-2">
          {ONBOARDING_HIGHLIGHTS.map((s, idx) => (
            <button
              key={s.kicker}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              onClick={() => setStep(idx + 1)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx + 1 === step
                  ? 'w-7 bg-[#6C4FE0]'
                  : 'w-2 bg-[#E0D9CD] dark:bg-[#313756]'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="px-4 py-3 rounded-xl text-sm font-medium text-[#645F75] dark:text-[#B3AEC4] hover:bg-[#FAF8F4] dark:hover:bg-[#222742] cursor-pointer"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (step < ONBOARDING_HIGHLIGHTS.length) {
                setStep((s) => s + 1);
              } else {
                onContinueToSetup(resolvedName);
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] transition-colors cursor-pointer"
          >
            <span>
              {step < ONBOARDING_HIGHLIGHTS.length ? 'Continue' : 'Personalize Setup'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   SCREEN 3: PERSONAL SELF-CARE SETUP
   ============================================================================ */
interface PersonalSetupScreenProps {
  initialName: string;
  initialUnit: MeasurementUnit;
  initialGoalMl: number;
  initialReminders: boolean;
  onFinish: (payload: {
    displayName: string;
    unit: MeasurementUnit;
    dailyWaterGoalMl: number;
    remindersEnabled: boolean;
    starterHabits: string[];
  }) => void;
}

const STARTER_HABIT_OPTIONS = [
  'Morning glass of water',
  'Five slow breaths',
  'Unplug 20 min before sleep',
  '10-minute gentle walk',
  'Evening gratitude note',
];

export const PersonalSetupScreen: React.FC<PersonalSetupScreenProps> = ({
  initialName,
  initialUnit,
  initialGoalMl,
  initialReminders,
  onFinish,
}) => {
  const [name, setName] = useState(initialName === 'Friend' ? '' : initialName);
  const [unit, setUnit] = useState<MeasurementUnit>(initialUnit);
  const [goalMl, setGoalMl] = useState(initialGoalMl);
  const [reminders, setReminders] = useState(initialReminders);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);

  const toggleStarterHabit = (title: string) => {
    setSelectedHabits((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] dark:bg-[#111322] text-[#1F1D2B] dark:text-[#F3F0EA] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-7 sm:p-10 space-y-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF]">
              Personal Self-Care Setup
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold tracking-tight">
              Shape your daily tide
            </h1>
            <p className="mt-1 text-sm text-[#645F75] dark:text-[#B3AEC4]">
              Choose your own personal targets — you can adjust everything anytime in Settings.
            </p>
          </div>
          <ProgressRing
            progress={(goalMl - 800) / 2700}
            size={88}
            strokeWidth={8}
            colorClass="text-[#36B5C4]"
            centerLabel={formatVolume(goalMl, unit)}
            subLabel="personal target"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">What should we call you?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name"
              className="w-full rounded-xl border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-4 py-3 text-sm focus:outline-none focus:border-[#6C4FE0]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Measurement Unit</label>
            <div className="grid grid-cols-3 gap-2">
              {(['ML', 'L', 'OZ'] as MeasurementUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    unit === u
                      ? 'border-[#6C4FE0] bg-[#EFEAFF] dark:bg-[#2E235C] text-[#1E1340] dark:text-white'
                      : 'border-[#E6DFD3] dark:border-[#2E3452] text-[#645F75] dark:text-[#B3AEC4]'
                  }`}
                >
                  {u === 'ML' ? 'ml' : u === 'L' ? 'Litres (L)' : 'oz'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Personal Daily Water Target</span>
            <span className="font-semibold text-[#256B9A] dark:text-[#79BCE8] tabular-nums">
              {formatVolume(goalMl, unit)}
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={3500}
            step={100}
            value={goalMl}
            onChange={(e) => setGoalMl(Number(e.target.value))}
            className="w-full accent-[#36B5C4]"
          />
          <p className="mt-1 text-xs text-[#645F75] dark:text-[#B3AEC4]">
            Hydration needs vary by person, climate, and activity — set what feels comfortable for you.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium mb-2.5">
            Pick starter self-care habits <span className="text-xs font-normal text-[#645F75] dark:text-[#B3AEC4]">(optional — or add your own later)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {STARTER_HABIT_OPTIONS.map((title) => {
              const picked = selectedHabits.includes(title);
              return (
                <button
                  key={title}
                  type="button"
                  onClick={() => toggleStarterHabit(title)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    picked
                      ? 'border-[#6C4FE0] bg-[#EFEAFF] dark:bg-[#2E235C] text-[#1E1340] dark:text-white'
                      : 'border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] text-[#645F75] dark:text-[#B3AEC4]'
                  }`}
                >
                  {picked && <Check className="w-3.5 h-3.5 text-[#6C4FE0] dark:text-[#A994FF]" />}
                  <span>{title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex items-center justify-between gap-4 rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] px-4 py-3.5 cursor-pointer">
          <div>
            <p className="text-sm font-medium">Gentle drinking reminders (optional)</p>
            <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
              Off by default · permission is requested only when enabled · paused during quiet hours (10:00 PM – 7:30 AM)
            </p>
          </div>
          <input
            type="checkbox"
            checked={reminders}
            onChange={(e) => {
              const checked = e.target.checked;
              setReminders(checked);
              if (checked) {
                void requestNotificationPermissionOnDemand();
              }
            }}
            className="h-5 w-5 accent-[#6C4FE0]"
          />
        </label>

        <button
          type="button"
          onClick={() =>
            onFinish({
              displayName: name.trim() || 'Friend',
              unit,
              dailyWaterGoalMl: goalMl,
              remindersEnabled: reminders,
              starterHabits: selectedHabits,
            })
          }
          className="w-full py-3.5 rounded-2xl bg-[#6C4FE0] text-white font-semibold text-sm hover:bg-[#5B3FD0] transition-colors cursor-pointer"
        >
          Begin My Daily Tide
        </button>
      </div>
    </div>
  );
};

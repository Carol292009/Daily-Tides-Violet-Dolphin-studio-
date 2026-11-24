import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Droplets,
  Lock,
  Sparkles,
  Sprout,
  X,
} from 'lucide-react';
import { STUDIO_LOGO_PATH } from '../data/localStore';

interface OneTimeQuickGuideModalProps {
  displayName: string;
  isFirstTime: boolean;
  onComplete: () => void;
}

interface GuideStep {
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentBg: string;
  accentText: string;
  howToItems: { label: string; detail: string }[];
  tip: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    badge: 'Step 1 of 4 · Hydration',
    title: 'Log water in one tap & set your own goal',
    subtitle:
      'Start every day on a clean slate. Track your personal hydration pace without rigid rules.',
    icon: Droplets,
    accentBg: 'bg-[#E6F7F9] dark:bg-[#193441]',
    accentText: 'text-[#256B9A] dark:text-[#79BCE8]',
    howToItems: [
      {
        label: 'One-tap glasses & bottles',
        detail: 'Tap Small Cup, Glass, Bottle, or Large Flask right on Home or the Hydration tab.',
      },
      {
        label: 'Custom sizes & instant undo',
        detail: 'Add your favorite mug or bottle size, edit your personal daily goal, or undo a mistap anytime.',
      },
      {
        label: 'Automatic daily reset',
        detail: 'Today’s ring resets each morning while keeping your 30-day history safely saved.',
      },
    ],
    tip: 'Open the Hydration tab anytime to adjust your ml/oz target or add custom containers.',
  },
  {
    badge: 'Step 2 of 4 · Mood & Reflection',
    title: 'Check in with your mood & private journal',
    subtitle:
      'Everything you write stays strictly on your device — never uploaded, synced, or shared.',
    icon: BookOpen,
    accentBg: 'bg-[#EFEAFF] dark:bg-[#2A2252]',
    accentText: 'text-[#6C4FE0] dark:text-[#A994FF]',
    howToItems: [
      {
        label: 'Daily Mood Check-In',
        detail: 'Pick how your tide feels (Heavy to Radiant), add quick context tags, and jot an optional note.',
      },
      {
        label: 'Guided Reflection & Freewriting',
        detail: 'Answer 5 gentle reflection questions or write freely inside the Reflect tab.',
      },
      {
        label: 'Self-Appreciation & 105 Motivations',
        detail: 'Collect small personal wins in your Vault and browse 105 offline affirmations by mood.',
      },
    ],
    tip: 'Use the Reflect tab whenever you have 2–5 quiet minutes — no login or internet needed.',
  },
  {
    badge: 'Step 3 of 4 · Habits & Quests',
    title: 'Build your own gentle habits & tiny quests',
    subtitle:
      'Your routine starts completely empty so you only track habits that genuinely matter to you.',
    icon: CheckCircle2,
    accentBg: 'bg-[#E9F5EC] dark:bg-[#1B332A]',
    accentText: 'text-[#2D8A68] dark:text-[#6EE7B7]',
    howToItems: [
      {
        label: 'Create personal habits',
        detail: 'Open the Habits tab to add Morning, Afternoon, Evening, or Anytime rituals — pause or edit anytime.',
      },
      {
        label: 'Complete Daily Quests',
        detail: 'Tiny quests like morning water, one habit, or a positive thought auto-complete as you care for yourself.',
      },
      {
        label: 'Zero-shame consistency',
        detail: 'Missing a day never erases your earned points, badges, or garden growth.',
      },
    ],
    tip: 'Tap "+ New Habit" on the Habits screen to add your very first daily ritual.',
  },
  {
    badge: 'Step 4 of 4 · Garden & Privacy',
    title: 'Watch your Progress Garden & 30-day trends grow',
    subtitle:
      'Every logged sip, mood, habit, and reflection earns Tide Points and unlocks your personal insights.',
    icon: Sprout,
    accentBg: 'bg-[#FFF3E0] dark:bg-[#3A2B1D]',
    accentText: 'text-[#C2781A] dark:text-[#F6C177]',
    howToItems: [
      {
        label: '5-Stage Garden & 3D Tide Sanctuary',
        detail: 'Start at Stage 1 (Dewy Shoreline) and grow plants, blooms, and milestones as your real data builds.',
      },
      {
        label: '30-Day Trends & Weekly Recap',
        detail: 'Visit Garden & Progress for your interactive 30-day hydration chart, badges, and shareable cards.',
      },
      {
        label: 'Local Backup & Reminders',
        detail: 'Visit Settings to set optional quiet-hours reminders or export/import a local JSON backup anytime.',
      },
    ],
    tip: 'This walkthrough only shows once. You can reopen it anytime under Settings → Launch Experience.',
  },
];

export const OneTimeQuickGuideModal: React.FC<OneTimeQuickGuideModalProps> = ({
  displayName,
  isFirstTime,
  onComplete,
}) => {
  const [stepIdx, setStepIdx] = useState(0);
  const step = GUIDE_STEPS[stepIdx];
  const StepIcon = step.icon;
  const isLastStep = stepIdx === GUIDE_STEPS.length - 1;
  const cleanName = displayName.trim() && displayName !== 'Friend' ? displayName.trim() : null;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onComplete();
      } else if (e.key === 'ArrowRight') {
        setStepIdx((prev) => Math.min(prev + 1, GUIDE_STEPS.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setStepIdx((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111322]/65 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-guide-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.24 }}
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] shadow-2xl overflow-hidden my-auto"
      >
        {/* Top Header */}
        <div className="px-6 sm:px-7 pt-6 pb-4 border-b border-[#EFEAE0] dark:border-[#262B45] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={STUDIO_LOGO_PATH}
              alt="Daily Tide"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover border border-[#E6DFD3] dark:border-[#2C3250] shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6C4FE0] dark:text-[#A994FF]">
                {isFirstTime ? 'One-Time Quick Guide' : 'How to Use Daily Tide'}
              </p>
              <p className="font-display text-sm sm:text-base font-semibold text-[#1F1D2B] dark:text-[#F3F0EA] truncate">
                {cleanName ? `Welcome, ${cleanName} — here’s how Daily Tide works` : 'How to get started with Daily Tide'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onComplete}
            aria-label="Close quick guide"
            className="p-2 rounded-xl text-[#645F75] dark:text-[#B3AEC4] hover:bg-[#FAF8F4] dark:hover:bg-[#232844] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Step Body */}
        <div className="px-6 sm:px-7 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIdx}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl ${step.accentBg} flex items-center justify-center shrink-0`}
                >
                  <StepIcon className={`w-6 h-6 ${step.accentText}`} />
                </div>
                <div className="space-y-1">
                  <p className={`text-xs font-semibold ${step.accentText}`}>{step.badge}</p>
                  <h2
                    id="quick-guide-title"
                    className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#1F1D2B] dark:text-[#F3F0EA]"
                  >
                    {step.title}
                  </h2>
                  <p className="text-sm text-[#645F75] dark:text-[#B3AEC4] leading-relaxed">
                    {step.subtitle}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {step.howToItems.map((item, idx) => (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] border border-[#EFEAE0] dark:border-[#2C3250] px-4 py-3 flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#EFEAFF] dark:bg-[#31275E] text-[#6C4FE0] dark:text-[#A994FF] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]">
                        {item.label}
                      </p>
                      <p className="text-xs text-[#645F75] dark:text-[#B3AEC4] leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-[#EFEAFF]/75 dark:bg-[#251F47] px-4 py-3 flex items-start gap-2.5">
                {isLastStep ? (
                  <Lock className="w-4 h-4 text-[#6C4FE0] dark:text-[#A994FF] shrink-0 mt-0.5" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[#6C4FE0] dark:text-[#A994FF] shrink-0 mt-0.5" />
                )}
                <p className="text-xs text-[#3C3554] dark:text-[#D5D0EA] leading-relaxed">
                  {step.tip}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Controls & Step Dots */}
        <div className="px-6 sm:px-7 py-4 border-t border-[#EFEAE0] dark:border-[#262B45] bg-[#FAF8F4]/70 dark:bg-[#161A2E] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {GUIDE_STEPS.map((s, idx) => (
              <button
                key={s.badge}
                type="button"
                aria-label={`Go to step ${idx + 1}`}
                onClick={() => setStepIdx(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === stepIdx
                    ? 'w-7 bg-[#6C4FE0]'
                    : 'w-2 bg-[#D9D1C4] dark:bg-[#343B5C] hover:bg-[#B8AECC]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {stepIdx === 0 ? (
              <button
                type="button"
                onClick={onComplete}
                className="px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#645F75] dark:text-[#B3AEC4] hover:text-[#1F1D2B] dark:hover:text-white cursor-pointer"
              >
                Skip Guide
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStepIdx((prev) => Math.max(prev - 1, 0))}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#645F75] dark:text-[#B3AEC4] hover:bg-white dark:hover:bg-[#232844] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isLastStep) {
                  onComplete();
                } else {
                  setStepIdx((prev) => Math.min(prev + 1, GUIDE_STEPS.length - 1));
                }
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] transition-colors cursor-pointer"
            >
              <span>{isLastStep ? 'Got It — Let’s Begin' : 'Next'}</span>
              {!isLastStep && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

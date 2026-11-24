import React, { useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  Clock,
  Download,
  Lock,
  Quote,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sprout,
  Unlock,
  X,
} from 'lucide-react';
import {
  AchievementBadge,
  ConsistencyMetrics,
  MeasurementUnit,
  ShareCardCategory,
  ShareCardThemeId,
  WeeklySummary,
} from '../types/dailyTide';
import {
  MOTIVATION_LIBRARY,
  STUDIO_LOGO_PATH,
  formatVolume,
} from '../data/localStore';
import { RewardLevelSnapshot } from '../rewards/rewardAccessManager';

interface ShareCardModalProps {
  initialCategory?: ShareCardCategory;
  initialQuoteText?: string | null;
  displayName: string;
  unit: MeasurementUnit;
  hydrationSummary: string;
  todayAffirmationText: string;
  badges: AchievementBadge[];
  consistency: ConsistencyMetrics;
  weeklySummary: WeeklySummary | null;
  visualThemesAccess: RewardLevelSnapshot;
  onRequestUnlockVisualThemes: () => void;
  onClose: () => void;
}

const CARD_CATEGORIES: {
  id: ShareCardCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'achievement', label: 'Achievements', icon: Award },
  { id: 'motivation', label: 'Motivation', icon: Quote },
  { id: 'weekly', label: 'Weekly Progress', icon: BarChart3 },
  { id: 'milestone', label: 'Personal Milestone', icon: Sprout },
];

const CARD_THEMES: {
  id: ShareCardThemeId;
  title: string;
  locked: boolean;
  bgClass: string;
  textClass: string;
  mutedClass: string;
  canvasColors: [string, string];
  isDark: boolean;
}[] = [
  {
    id: 'warm_ivory',
    title: 'Warm Ivory',
    locked: false,
    bgClass: 'from-[#FAF8F4] to-[#EDE5FB]',
    textClass: 'text-[#1E1340]',
    mutedClass: 'text-[#554E6E]',
    canvasColors: ['#FAF8F4', '#E6DBFA'],
    isDark: false,
  },
  {
    id: 'ocean_mist',
    title: 'Ocean Mist',
    locked: false,
    bgClass: 'from-[#E4F7F9] to-[#D6E8F8]',
    textClass: 'text-[#133A56]',
    mutedClass: 'text-[#39617D]',
    canvasColors: ['#E4F7F9', '#CFE5F7'],
    isDark: false,
  },
  {
    id: 'violet_dusk',
    title: 'Violet Dusk',
    locked: true,
    bgClass: 'from-[#6C4FE0] to-[#256B9A]',
    textClass: 'text-white',
    mutedClass: 'text-white/85',
    canvasColors: ['#6C4FE0', '#256B9A'],
    isDark: true,
  },
  {
    id: 'midnight_tide',
    title: 'Midnight Tide',
    locked: true,
    bgClass: 'from-[#1E1340] to-[#133A56]',
    textClass: 'text-white',
    mutedClass: 'text-white/80',
    canvasColors: ['#1E1340', '#133A56'],
    isDark: true,
  },
  {
    id: 'aurora_lagoon',
    title: 'Aurora Lagoon',
    locked: true,
    bgClass: 'from-[#36B5C4] to-[#6C4FE0]',
    textClass: 'text-white',
    mutedClass: 'text-white/85',
    canvasColors: ['#36B5C4', '#6C4FE0'],
    isDark: true,
  },
];

/**
 * Pure privacy-safe payload builder for local Shareable Cards.
 * Strictly NEVER includes private journal entries, appreciation vault entries, or mood data.
 */
export function buildSafeShareCardContent(params: {
  category: ShareCardCategory;
  displayName: string;
  unit: MeasurementUnit;
  hydrationSummary: string;
  motivationQuote: string;
  badges: AchievementBadge[];
  consistency: ConsistencyMetrics;
  weeklySummary: WeeklySummary | null;
  hideExactNumbers: boolean;
}): {
  eyebrow: string;
  headline: string;
  subline: string;
  highlightMetric: string;
  footerQuote: string;
} {
  const {
    category,
    displayName,
    unit,
    hydrationSummary,
    motivationQuote,
    badges,
    consistency,
    weeklySummary,
    hideExactNumbers,
  } = params;

  const safeName = displayName.trim() || 'Friend';
  const unlockedBadges = badges.filter((b) => b.unlockedAtMillis !== null);
  const featuredBadge = unlockedBadges[unlockedBadges.length - 1] ?? badges[0];

  if (category === 'motivation') {
    return {
      eyebrow: 'DAILY TIDE · MOTIVATION',
      headline: `"${motivationQuote}"`,
      subline: `Shared with calm intention by ${safeName}`,
      highlightMetric: `Garden Stage ${consistency.gardenStage.stageIndex} · ${consistency.gardenStage.name}`,
      footerQuote: 'One grounded thought can steady an entire day.',
    };
  }

  if (category === 'weekly') {
    const daysMet = weeklySummary?.hydrationGoalDaysMet ?? 0;
    const habitsCount = weeklySummary?.habitsCompletedCount ?? 0;
    const waterTotal = weeklySummary
      ? formatVolume(weeklySummary.totalWaterMl, unit)
      : hydrationSummary;
    const weeklyPts = weeklySummary?.weeklyPointsEarned ?? consistency.todayPoints;

    return {
      eyebrow: 'DAILY TIDE · WEEKLY PROGRESS',
      headline: `${safeName}'s Weekly Tide`,
      subline: 'Consistent, compassionate self-care — zero guilt, steady growth.',
      highlightMetric: hideExactNumbers
        ? `${consistency.gardenStage.name} · Steady Hydration & Habits`
        : `${daysMet}/7 hydration goals · ${habitsCount} habits · +${weeklyPts} Tide pts (${waterTotal})`,
      footerQuote:
        weeklySummary?.insightMessage ??
        'Showing up calmly across the week builds lasting momentum.',
    };
  }

  if (category === 'milestone') {
    return {
      eyebrow: 'DAILY TIDE · PERSONAL MILESTONE',
      headline: consistency.gardenStage.name,
      subline: `${safeName} reached Garden Stage ${consistency.gardenStage.stageIndex} of 5`,
      highlightMetric: hideExactNumbers
        ? `${unlockedBadges.length} blossoms planted · Calm Consistency`
        : `${consistency.totalTidePoints} Tide Points · ${consistency.totalActiveDaysAllTime} active days · ${consistency.currentPositiveStreak}-day flow`,
      footerQuote: consistency.gardenStage.subtitle,
    };
  }

  // Default: 'achievement'
  return {
    eyebrow: 'DAILY TIDE · ACHIEVEMENT UNLOCKED',
    headline: featuredBadge ? featuredBadge.title : `${safeName}'s Calm Tide`,
    subline: featuredBadge
      ? featuredBadge.description
      : 'Consistent self-care, one small wave at a time.',
    highlightMetric: hideExactNumbers
      ? `${unlockedBadges.length} milestones unlocked · ${consistency.gardenStage.name}`
      : `${unlockedBadges.length}/${badges.length} badges · ${consistency.activeDaysLast30} active days this month`,
    footerQuote: `"${motivationQuote}"`,
  };
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let linesDrawn = 0;

  for (let i = 0; i < words.length; i += 1) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      linesDrawn += 1;
      if (linesDrawn >= maxLines) {
        ctx.fillText(`${line}…`, x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  initialCategory = 'achievement',
  initialQuoteText = null,
  displayName,
  unit,
  hydrationSummary,
  todayAffirmationText,
  badges,
  consistency,
  weeklySummary,
  visualThemesAccess,
  onRequestUnlockVisualThemes,
  onClose,
}) => {
  const [category, setCategory] = useState<ShareCardCategory>(initialCategory);
  const [selectedThemeId, setSelectedThemeId] = useState<ShareCardThemeId>('warm_ivory');
  const [hideExactNumbers, setHideExactNumbers] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState<number>(() => {
    if (initialQuoteText) {
      const idx = MOTIVATION_LIBRARY.findIndex((m) => m.text === initialQuoteText);
      if (idx >= 0) return idx;
    }
    return 0;
  });
  const [usingCustomInitialQuote, setUsingCustomInitialQuote] = useState(Boolean(initialQuoteText));
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const selectedThemeCandidate = CARD_THEMES.find((t) => t.id === selectedThemeId) ?? CARD_THEMES[0];
  const activeTheme =
    selectedThemeCandidate.locked && !visualThemesAccess.isUnlocked
      ? CARD_THEMES[0]
      : selectedThemeCandidate;
  const activeQuote = usingCustomInitialQuote && initialQuoteText
    ? initialQuoteText
    : quoteIdx === 0
    ? todayAffirmationText
    : MOTIVATION_LIBRARY[quoteIdx % MOTIVATION_LIBRARY.length].text;

  const cardContent = useMemo(
    () =>
      buildSafeShareCardContent({
        category,
        displayName,
        unit,
        hydrationSummary,
        motivationQuote: activeQuote,
        badges,
        consistency,
        weeklySummary,
        hideExactNumbers,
      }),
    [
      category,
      displayName,
      unit,
      hydrationSummary,
      activeQuote,
      badges,
      consistency,
      weeklySummary,
      hideExactNumbers,
    ]
  );

  const handleSelectTheme = (theme: (typeof CARD_THEMES)[number]) => {
    const unlocked = !theme.locked || visualThemesAccess.isUnlocked;
    if (unlocked) {
      setSelectedThemeId(theme.id);
      return;
    }
    // Always open explicit Pre-Ad Optional Disclosure — never grant rewards merely on click!
    onRequestUnlockVisualThemes();
  };

  const renderCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
    grad.addColorStop(0, activeTheme.canvasColors[0]);
    grad.addColorStop(1, activeTheme.canvasColors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Organic calm tide waves
    ctx.fillStyle = activeTheme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,79,224,0.07)';
    ctx.beginPath();
    ctx.moveTo(0, 990);
    ctx.bezierCurveTo(320, 900, 720, 1090, 1080, 960);
    ctx.lineTo(1080, 1350);
    ctx.lineTo(0, 1350);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = activeTheme.isDark ? 'rgba(54,181,196,0.12)' : 'rgba(54,181,196,0.12)';
    ctx.beginPath();
    ctx.moveTo(0, 1110);
    ctx.bezierCurveTo(380, 1040, 740, 1180, 1080, 1080);
    ctx.lineTo(1080, 1350);
    ctx.lineTo(0, 1350);
    ctx.closePath();
    ctx.fill();

    const fg = activeTheme.isDark ? '#FFFFFF' : '#1E1340';
    const muted = activeTheme.isDark ? 'rgba(255,255,255,0.82)' : '#554E6E';

    ctx.fillStyle = muted;
    ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(cardContent.eyebrow, 96, 150);

    ctx.fillStyle = fg;
    ctx.font = category === 'motivation'
      ? '600 54px "Plus Jakarta Sans", sans-serif'
      : '700 66px "Plus Jakarta Sans", sans-serif';
    const afterHeadlineY = wrapCanvasText(ctx, cardContent.headline, 96, 265, 888, 76, 4);

    ctx.fillStyle = muted;
    ctx.font = '400 34px "DM Sans", sans-serif';
    const afterSubY = wrapCanvasText(ctx, cardContent.subline, 96, afterHeadlineY + 24, 888, 48, 3);

    ctx.fillStyle = fg;
    ctx.font = '600 40px "Plus Jakarta Sans", sans-serif';
    const afterMetricY = wrapCanvasText(ctx, cardContent.highlightMetric, 96, Math.max(afterSubY + 56, 620), 888, 56, 3);

    ctx.fillStyle = muted;
    ctx.font = 'italic 34px "DM Sans", sans-serif';
    wrapCanvasText(ctx, cardContent.footerQuote, 96, Math.max(afterMetricY + 40, 810), 888, 48, 3);

    ctx.fillStyle = muted;
    ctx.font = '500 28px "DM Sans", sans-serif';
    ctx.fillText('Little habits. Better days.  ·  Violet Dolphin Studio', 96, 1245);

    return canvas;
  };

  const handleDownloadPng = () => {
    const canvas = renderCanvas();
    const link = document.createElement('a');
    link.download = `daily-tide-${category}-${selectedThemeId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setExportNotice('Shareable card saved locally as PNG (zero cloud upload).');
  };

  const handleNativeShare = async () => {
    const canvas = renderCanvas();
    const shareText = `${cardContent.headline} — ${cardContent.highlightMetric} | Daily Tide by Violet Dolphin Studio`;
    try {
      if (navigator.share) {
        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/png')
        );
        if (blob) {
          const file = new File([blob], `daily-tide-${category}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Daily Tide',
              text: shareText,
              files: [file],
            });
            setExportNotice('Opened system share sheet.');
            return;
          }
        }
        await navigator.share({ title: 'Daily Tide', text: shareText });
        setExportNotice('Opened system share sheet.');
        return;
      }
      handleDownloadPng();
    } catch {
      handleDownloadPng();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Shareable Card Studio"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#1A162B] dark:text-[#F3F0EA]">
              Local Shareable Card Studio
            </h3>
            <p className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
              Generate cards 100% locally for Android native share or PNG export.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close card studio"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-[#F2EEE6] dark:hover:bg-[#242942] text-[#645F75] dark:text-[#B3AEC4] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Share Card Category Switchers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {CARD_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold border transition-colors cursor-pointer ${
                  active
                    ? 'border-[#6C4FE0] bg-[#1E1340] dark:bg-[#6C4FE0] text-white'
                    : 'border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] text-[#645F75] dark:text-[#B3AEC4]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Card Preview */}
        <div
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${activeTheme.bgClass} p-7 sm:p-8 border border-black/5`}
        >
          <p className={`text-xs font-semibold tracking-wider ${activeTheme.mutedClass}`}>
            {cardContent.eyebrow}
          </p>
          <h4
            className={`mt-3 font-display font-semibold leading-snug ${
              category === 'motivation' ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
            } ${activeTheme.textClass}`}
          >
            {cardContent.headline}
          </h4>
          <p className={`mt-2 text-sm ${activeTheme.mutedClass}`}>
            {cardContent.subline}
          </p>

          <p className={`mt-5 font-display text-base sm:text-lg font-semibold tabular-nums ${activeTheme.textClass}`}>
            {cardContent.highlightMetric}
          </p>

          <p className={`mt-3 text-xs sm:text-sm italic leading-relaxed ${activeTheme.mutedClass}`}>
            {cardContent.footerQuote}
          </p>

          <div className="mt-7 pt-4 border-t border-current/10 flex items-center justify-between gap-3">
            <span className={`text-xs font-medium ${activeTheme.mutedClass}`}>
              Little habits. Better days.
            </span>
            <div className="flex items-center gap-2">
              <img
                src={STUDIO_LOGO_PATH}
                alt="Violet Dolphin Studio"
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-md object-cover"
              />
              <span className={`text-xs font-medium ${activeTheme.mutedClass}`}>
                Violet Dolphin Studio
              </span>
            </div>
          </div>
        </div>

        {/* Quote Cycler when sharing Motivation or Achievement */}
        {(category === 'motivation' || category === 'achievement') && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-[#645F75] dark:text-[#B3AEC4]">
              Pulling from 105 local motivational messages
            </span>
            <button
              type="button"
              onClick={() => {
                setUsingCustomInitialQuote(false);
                setQuoteIdx((idx) => (idx + 7) % MOTIVATION_LIBRARY.length);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF] hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Next Offline Quote</span>
            </button>
          </div>
        )}

        {/* Theme Picker with Level 4 (48h) Timed Mock Reward Unlocks */}
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
              Card Theme (Warm Ivory &amp; Ocean Mist are always free)
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6C4FE0] dark:text-[#A994FF] tabular-nums">
              {visualThemesAccess.isUnlocked ? (
                <>
                  <Unlock className="w-3 h-3" />
                  <span>Level 4 Active · {visualThemesAccess.remainingFormatted}</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  <span>Level 4 · 48h Optional Ad</span>
                </>
              )}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {CARD_THEMES.map((theme) => {
              const unlocked = !theme.locked || visualThemesAccess.isUnlocked;
              const selected = activeTheme.id === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelectTheme(theme)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2.5 text-xs font-medium border transition-all whitespace-nowrap cursor-pointer ${
                    selected
                      ? 'border-[#6C4FE0] bg-[#EFEAFF] text-[#1E1340] dark:bg-[#2E235C] dark:text-[#F3F0EA]'
                      : 'border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] text-[#645F75] dark:text-[#B3AEC4]'
                  }`}
                >
                  {!unlocked && <Lock className="w-3 h-3" />}
                  <span>{theme.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <label className="mt-3.5 flex items-center justify-between gap-3 rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] px-4 py-3 cursor-pointer">
          <span className="text-xs sm:text-sm text-[#1A162B] dark:text-[#F3F0EA]">
            Hide exact hydration &amp; point numbers before sharing
          </span>
          <input
            type="checkbox"
            checked={hideExactNumbers}
            onChange={(e) => setHideExactNumbers(e.target.checked)}
            className="h-4 w-4 accent-[#6C4FE0]"
          />
        </label>

        {/* Privacy Protection Notice */}
        <div className="mt-3 rounded-2xl bg-[#E4F7F9]/60 dark:bg-[#163442]/60 px-4 py-2.5 flex items-center gap-2.5 text-xs text-[#133A56] dark:text-[#B2E3EA]">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#256B9A] dark:text-[#79BCE8]" />
          <span>
            Privacy first: Private journal entries, self-appreciation notes, and mood check-ins are never included in shareable cards or uploaded.
          </span>
        </div>

        {exportNotice && (
          <p className="mt-3 text-xs font-medium text-[#256B9A] dark:text-[#79BCE8]">
            {exportNotice}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#645F75] dark:text-[#B3AEC4] hover:bg-[#F2EEE6] dark:hover:bg-[#242942] cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDownloadPng}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] hover:border-[#6C4FE0] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Save PNG</span>
          </button>
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Card</span>
          </button>
        </div>
      </div>
    </div>
  );
};

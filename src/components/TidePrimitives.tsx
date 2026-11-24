import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  trackClass?: string;
  centerLabel?: string;
  subLabel?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 84,
  strokeWidth = 8,
  colorClass = 'text-[#6C4FE0] dark:text-[#A994FF]',
  trackClass = 'text-[#ECE6DC] dark:text-[#262B45]',
  centerLabel,
  subLabel,
  onClick,
  ariaLabel,
}) => {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);
  const displayPct = centerLabel ?? `${Math.round(clamped * 100)}%`;

  const ringSvg = (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={trackClass}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorClass} transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
        <span className="font-display text-sm font-semibold tabular-nums text-[#1F1D2B] dark:text-[#F3F0EA]">
          {displayPct}
        </span>
        {subLabel && (
          <span className="text-[10px] text-[#645F75] dark:text-[#B3AEC4] leading-tight">
            {subLabel}
          </span>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? displayPct}
        className="inline-flex items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-[#6C4FE0] hover:scale-[1.03] active:scale-[0.98] transition-transform cursor-pointer"
      >
        {ringSvg}
      </button>
    );
  }

  return ringSvg;
};

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  action,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-1">
    <div className="flex items-start gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="mt-0.5 min-h-[42px] min-w-[42px] flex items-center justify-center rounded-2xl border border-[#E6DFD3] dark:border-[#2C3250] bg-white dark:bg-[#1A1E33] text-[#1F1D2B] dark:text-[#F3F0EA] hover:border-[#6C4FE0] transition-colors shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#1F1D2B] dark:text-[#F3F0EA] text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[#645F75] dark:text-[#B3AEC4] max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

interface EmptySanctuaryStateProps {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptySanctuaryState: React.FC<EmptySanctuaryStateProps> = ({
  title,
  subtitle,
  actionLabel,
  onAction,
}) => (
  <div className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-10 text-center">
    <h3 className="font-display text-lg font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]">
      {title}
    </h3>
    <p className="mt-1.5 text-sm text-[#645F75] dark:text-[#B3AEC4] max-w-md mx-auto leading-relaxed">
      {subtitle}
    </p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#6C4FE0] text-white hover:bg-[#5B3FD0] transition-colors cursor-pointer"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

interface ShortcutRowProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  meta?: string;
}

export const ShortcutRow: React.FC<ShortcutRowProps> = ({
  title,
  subtitle,
  icon,
  onClick,
  meta,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-5 flex items-center justify-between gap-4 text-left hover:border-[#6C4FE0]/60 transition-colors cursor-pointer group"
  >
    <div className="flex items-center gap-4 min-w-0">
      <div className="w-11 h-11 rounded-2xl bg-[#FAF8F4] dark:bg-[#222742] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        {meta && (
          <p className="text-xs font-medium text-[#6C4FE0] dark:text-[#A994FF] mb-0.5 truncate">
            {meta}
          </p>
        )}
        <h3 className="font-display text-base font-semibold text-[#1F1D2B] dark:text-[#F3F0EA] truncate">
          {title}
        </h3>
        <p className="mt-0.5 text-sm text-[#645F75] dark:text-[#B3AEC4] line-clamp-2">
          {subtitle}
        </p>
      </div>
    </div>
    <ChevronRight className="w-5 h-5 text-[#8E89A0] group-hover:text-[#6C4FE0] group-hover:translate-x-0.5 transition-all shrink-0" />
  </button>
);

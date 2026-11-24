import React from 'react';
import { Droplets, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { MeasurementUnit, WaterVessel } from '../types/dailyTide';
import { formatVolume } from '../data/localStore';

interface HydrationWaveWidgetProps {
  consumedMl: number;
  goalMl: number;
  unit: MeasurementUnit;
  vessels: WaterVessel[];
  canUndo: boolean;
  onQuickAdd: (vessel: WaterVessel) => void;
  onUndo: () => void;
  onOpenManageVessels?: () => void;
}

export const HydrationWaveWidget: React.FC<HydrationWaveWidgetProps> = ({
  consumedMl,
  goalMl,
  unit,
  vessels,
  canUndo,
  onQuickAdd,
  onUndo,
  onOpenManageVessels,
}) => {
  const pct = Math.min(Math.round((consumedMl / Math.max(goalMl, 1)) * 100), 100);
  const fillPercent = Math.min(Math.max((consumedMl / Math.max(goalMl, 1)) * 100, 8), 100);
  const goalReached = consumedMl >= goalMl && goalMl > 0;

  return (
    <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#645F75] dark:text-[#B3AEC4]">Hydration Tide</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[#133A56] dark:text-[#79BCE8] tabular-nums">
              {formatVolume(consumedMl, unit)}
            </h2>
            <span className="text-sm text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
              of {formatVolume(goalMl, unit)}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-[#645F75] dark:text-[#B3AEC4]">
            {goalReached
              ? 'Daily goal reached — stay comfortable and refreshed.'
              : 'Every calm sip counts toward your steady daily rhythm.'}
          </p>
        </div>

        {onOpenManageVessels && (
          <button
            type="button"
            onClick={onOpenManageVessels}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#256B9A] dark:text-[#79BCE8] hover:bg-[#E4F7F9] dark:hover:bg-[#1F2D45] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Glasses & Log</span>
          </button>
        )}
      </div>

      {/* Animated Ocean Wave Vessel */}
      <div className="relative mt-5 h-32 w-full overflow-hidden rounded-2xl bg-[#E4F7F9] dark:bg-[#142D3B] border border-[#CBEAF0] dark:border-[#204558]">
        <div
          className="absolute inset-x-0 bottom-0 transition-all duration-700 ease-out"
          style={{ height: `${fillPercent}%` }}
        >
          <svg
            viewBox="0 0 400 32"
            preserveAspectRatio="none"
            className="w-[120%] h-5 -mt-4 text-[#36B5C4]/80 animate-tide-wave"
            aria-hidden="true"
          >
            <path
              d="M0,16 C65,2 135,30 200,16 C265,2 335,30 400,16 L400,32 L0,32 Z"
              fill="currentColor"
            />
          </svg>
          <div className="h-full w-full bg-gradient-to-b from-[#36B5C4] to-[#256B9A]" />
        </div>

        <div className="relative z-10 flex h-full items-end justify-between px-4 pb-3.5">
          <span
            className={`text-xs font-medium ${
              fillPercent > 35
                ? 'text-white/90'
                : 'text-[#133A56] dark:text-[#AEE8F0]'
            }`}
          >
            {goalReached ? 'Goal reached' : `${formatVolume(Math.max(goalMl - consumedMl, 0), unit)} remaining`}
          </span>
          <span
            className={`font-display text-2xl font-semibold tabular-nums ${
              fillPercent > 38
                ? 'text-white'
                : 'text-[#133A56] dark:text-[#AEE8F0]'
            }`}
          >
            {pct}%
          </span>
        </div>
      </div>

      {/* Quick-add Vessel Buttons */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {vessels.slice(0, 4).map((vessel) => (
          <button
            key={vessel.id}
            type="button"
            onClick={() => onQuickAdd(vessel)}
            className="flex flex-col items-center justify-center rounded-2xl border border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] px-3 py-3 text-center hover:border-[#36B5C4] hover:bg-[#E4F7F9]/60 dark:hover:bg-[#1C3848] active:scale-[0.98] transition-all cursor-pointer min-h-[60px]"
          >
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#133A56] dark:text-[#EAF6FA] tabular-nums whitespace-nowrap">
              <Droplets className="w-3.5 h-3.5 text-[#36B5C4]" />+{formatVolume(vessel.volumeMl, unit)}
            </span>
            <span className="mt-0.5 text-xs text-[#645F75] dark:text-[#B3AEC4] truncate max-w-full">
              {vessel.name}
            </span>
          </button>
        ))}
      </div>

      {canUndo && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onUndo}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6C4FE0] dark:text-[#A994FF] hover:underline cursor-pointer py-1 px-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo last sip</span>
          </button>
        </div>
      )}
    </section>
  );
};

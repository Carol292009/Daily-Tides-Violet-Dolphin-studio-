import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Droplets, Target, TrendingUp, Calendar } from 'lucide-react';
import { Hydration30DayPoint, formatVolume } from '../data/localStore';
import { MeasurementUnit } from '../types/dailyTide';

interface HydrationTrendChart30DProps {
  data: Hydration30DayPoint[];
  dailyGoalMl: number;
  unit: MeasurementUnit;
}

type ChartViewMode = 'combined' | 'area';

function formatAxisTick(ml: number, unit: MeasurementUnit): string {
  if (unit === 'OZ') {
    const oz = Math.round(ml / 29.5735);
    return `${oz} oz`;
  }
  if (unit === 'L') {
    if (ml === 0) return '0 L';
    const litres = Number((ml / 1000).toFixed(2));
    return `${litres} L`;
  }
  if (ml === 0) return '0';
  if (ml >= 1000) {
    const liters = ml / 1000;
    return Number.isInteger(liters) ? `${liters}L` : `${liters.toFixed(1)}L`;
  }
  return `${ml}`;
}

export const HydrationTrendChart30D: React.FC<HydrationTrendChart30DProps> = ({
  data,
  dailyGoalMl,
  unit,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [chartWidth, setChartWidth] = useState(760);
  const [viewMode, setViewMode] = useState<ChartViewMode>('combined');
  const [showMovingAverage, setShowMovingAverage] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number>(() =>
    Math.max(0, data.length - 1)
  );
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  );

  // Sync dark/light class mutations cleanly
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.classList.contains('dark'));
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Responsive ResizeObserver for D3 layout
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const next = Math.max(300, Math.floor(el.getBoundingClientRect().width));
      setChartWidth(next);
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const summary = useMemo(() => {
    const totalMl = data.reduce((sum, d) => sum + d.ml, 0);
    const activeDays = data.filter((d) => d.ml > 0);
    const avgActiveMl =
      activeDays.length > 0 ? Math.round(totalMl / activeDays.length) : 0;
    const goalMetDays = data.filter((d) => d.goalMet).length;
    const bestDay = data.reduce<Hydration30DayPoint | null>(
      (best, curr) => (!best || curr.ml > best.ml ? curr : best),
      null
    );

    // Compare last 15 days vs prior 15 days for gentle directional insight
    const firstHalfAvg =
      data.slice(0, 15).reduce((s, d) => s + d.ml, 0) / Math.max(data.slice(0, 15).length, 1);
    const secondHalfAvg =
      data.slice(15).reduce((s, d) => s + d.ml, 0) / Math.max(data.slice(15).length, 1);
    const deltaPct =
      firstHalfAvg > 0
        ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)
        : 0;

    return {
      totalMl,
      avgActiveMl,
      activeCount: activeDays.length,
      goalMetDays,
      bestDay,
      deltaPct,
    };
  }, [data]);

  const safeSelectedIndex = Math.min(Math.max(selectedIndex, 0), Math.max(data.length - 1, 0));
  const inspectedPoint = data[safeSelectedIndex] ?? null;

  // Main D3 rendering pipeline
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || data.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const height = 270;
    const margin = {
      top: 22,
      right: 18,
      bottom: 34,
      left: chartWidth < 460 ? 44 : 54,
    };
    const innerWidth = Math.max(180, chartWidth - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;

    svg
      .attr('viewBox', `0 0 ${chartWidth} ${height}`)
      .attr('width', chartWidth)
      .attr('height', height);

    const palette = {
      grid: isDark ? '#282F4D' : '#ECE6DA',
      axisText: isDark ? '#9F9AB8' : '#6F6980',
      goalLine: isDark ? '#79BCE8' : '#256B9A',
      barMet: '#36B5C4',
      barActive: isDark ? '#8B74F5' : '#6C4FE0',
      barRest: isDark ? '#262C47' : '#EAE4D8',
      avgStroke: isDark ? '#F5C469' : '#1E1340',
      areaTop: isDark ? 'rgba(54, 181, 196, 0.34)' : 'rgba(54, 181, 196, 0.28)',
      areaBottom: isDark ? 'rgba(108, 79, 224, 0.02)' : 'rgba(108, 79, 224, 0.02)',
      selectionHalo: isDark ? 'rgba(169, 148, 255, 0.16)' : 'rgba(108, 79, 224, 0.1)',
    };

    const defs = svg.append('defs');
    const areaGrad = defs
      .append('linearGradient')
      .attr('id', 'dt-hydration-area-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    areaGrad.append('stop').attr('offset', '0%').attr('stop-color', palette.areaTop);
    areaGrad.append('stop').attr('offset', '100%').attr('stop-color', palette.areaBottom);

    const root = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.dateKey))
      .range([0, innerWidth])
      .paddingInner(0.28)
      .paddingOuter(0.14);

    const maxObserved = d3.max(data, (d) => Math.max(d.ml, d.rollingAvg7Ml)) ?? 0;
    const yMax = Math.max(dailyGoalMl * 1.25, maxObserved * 1.12, 1000);

    const yScale = d3.scaleLinear().domain([0, yMax]).nice(4).range([innerHeight, 0]);

    // Horizontal gridlines
    const yTicks = yScale.ticks(4);
    root
      .append('g')
      .selectAll('line')
      .data(yTicks)
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', palette.grid)
      .attr('stroke-dasharray', (d) => (d === 0 ? 'none' : '3 4'))
      .attr('stroke-width', 1);

    // Left Y-axis labels
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickSize(0)
      .tickPadding(10)
      .tickFormat((val) => formatAxisTick(Number(val), unit));

    const yAxisG = root.append('g').call(yAxis);
    yAxisG.select('.domain').remove();
    yAxisG
      .selectAll('text')
      .attr('fill', palette.axisText)
      .style('font-size', '11px')
      .style('font-variant-numeric', 'tabular-nums');

    // Bottom X-axis (evenly spaced date labels so 30 days never crowd)
    const tickStride = chartWidth < 480 ? 7 : 5;
    const xTickValues = data
      .filter((_, idx) => idx === 0 || idx === data.length - 1 || idx % tickStride === 0)
      .map((d) => d.dateKey);

    const labelByDateKey = new Map(data.map((d) => [d.dateKey, d.shortLabel]));
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(xTickValues)
      .tickSize(0)
      .tickPadding(10)
      .tickFormat((key) => labelByDateKey.get(String(key)) ?? '');

    const xAxisG = root
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);
    xAxisG.select('.domain').attr('stroke', palette.grid);
    xAxisG
      .selectAll('text')
      .attr('fill', palette.axisText)
      .style('font-size', '11px');

    const xCenter = (d: Hydration30DayPoint) =>
      (xScale(d.dateKey) ?? 0) + xScale.bandwidth() / 2;

    // Selected day highlight column
    const activePt = data[safeSelectedIndex];
    if (activePt) {
      const colX = (xScale(activePt.dateKey) ?? 0) - 2;
      root
        .append('rect')
        .attr('x', colX)
        .attr('y', 0)
        .attr('width', xScale.bandwidth() + 4)
        .attr('height', innerHeight)
        .attr('rx', 6)
        .attr('fill', palette.selectionHalo);
    }

    // Smooth Area Backdrop (always subtle in area mode, ultra-soft in combined mode)
    const areaGen = d3
      .area<Hydration30DayPoint>()
      .x((d) => xCenter(d))
      .y0(innerHeight)
      .y1((d) => yScale(d.ml))
      .curve(d3.curveMonotoneX);

    root
      .append('path')
      .datum(data)
      .attr('fill', 'url(#dt-hydration-area-grad)')
      .attr('opacity', viewMode === 'area' ? 1 : 0.45)
      .attr('d', areaGen);

    if (viewMode === 'combined') {
      // 30 Daily Consumption Bars
      root
        .append('g')
        .selectAll('rect')
        .data(data)
        .join('rect')
        .attr('x', (d) => xScale(d.dateKey) ?? 0)
        .attr('width', xScale.bandwidth())
        .attr('y', (d) => (d.ml > 0 ? yScale(d.ml) : innerHeight - 3))
        .attr('height', (d) =>
          d.ml > 0 ? Math.max(innerHeight - yScale(d.ml), 4) : 3
        )
        .attr('rx', Math.min(xScale.bandwidth() / 2, 5))
        .attr('fill', (d) =>
          d.ml === 0 ? palette.barRest : d.goalMet ? palette.barMet : palette.barActive
        )
        .attr('opacity', (_, idx) => (idx === safeSelectedIndex ? 1 : 0.84));
    } else {
      // Smooth daily line in Area Mode
      const dailyLineGen = d3
        .line<Hydration30DayPoint>()
        .x((d) => xCenter(d))
        .y((d) => yScale(d.ml))
        .curve(d3.curveMonotoneX);

      root
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', palette.barMet)
        .attr('stroke-width', 2.4)
        .attr('d', dailyLineGen);

      root
        .append('g')
        .selectAll('circle')
        .data(data)
        .join('circle')
        .attr('cx', (d) => xCenter(d))
        .attr('cy', (d) => yScale(d.ml))
        .attr('r', (_, idx) => (idx === safeSelectedIndex ? 5 : 2.8))
        .attr('fill', (d) =>
          d.ml === 0 ? palette.barRest : d.goalMet ? palette.barMet : palette.barActive
        )
        .attr('stroke', isDark ? '#1A1E33' : '#FFFFFF')
        .attr('stroke-width', 1.5);
    }

    // Personal Daily Goal Dashed Reference Line
    const goalY = yScale(dailyGoalMl);
    root
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', goalY)
      .attr('y2', goalY)
      .attr('stroke', palette.goalLine)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5 4');

    root
      .append('text')
      .attr('x', innerWidth)
      .attr('y', Math.max(12, goalY - 6))
      .attr('text-anchor', 'end')
      .attr('fill', palette.goalLine)
      .style('font-size', '10.5px')
      .style('font-weight', '600')
      .text(`Goal · ${formatVolume(dailyGoalMl, unit)}`);

    // 7-Day Rolling Moving Average Trend Line
    if (showMovingAverage) {
      const avgLineGen = d3
        .line<Hydration30DayPoint>()
        .x((d) => xCenter(d))
        .y((d) => yScale(d.rollingAvg7Ml))
        .curve(d3.curveMonotoneX);

      root
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', palette.avgStroke)
        .attr('stroke-width', 2.2)
        .attr('stroke-linecap', 'round')
        .attr('d', avgLineGen);

      if (activePt) {
        root
          .append('circle')
          .attr('cx', xCenter(activePt))
          .attr('cy', yScale(activePt.rollingAvg7Ml))
          .attr('r', 4.2)
          .attr('fill', palette.avgStroke)
          .attr('stroke', isDark ? '#1A1E33' : '#FFFFFF')
          .attr('stroke-width', 1.5);
      }
    }

    // Invisible interactive hit columns across all 30 days for instant hover & tap inspection
    const step = innerWidth / Math.max(data.length, 1);
    root
      .append('g')
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', (_, idx) => idx * step)
      .attr('y', 0)
      .attr('width', step)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('mouseenter', (_event, d) => {
        const idx = data.findIndex((item) => item.dateKey === d.dateKey);
        if (idx >= 0) setSelectedIndex(idx);
      })
      .on('click', (_event, d) => {
        const idx = data.findIndex((item) => item.dateKey === d.dateKey);
        if (idx >= 0) setSelectedIndex(idx);
      });
  }, [data, dailyGoalMl, unit, chartWidth, viewMode, showMovingAverage, safeSelectedIndex, isDark]);

  return (
    <section
      aria-label="30-Day Hydration Trends"
      className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] p-6 sm:p-7 space-y-5"
    >
      {/* Header + Controls */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#256B9A] dark:text-[#79BCE8]">
            30-Day Hydration Trends · Powered by D3
          </p>
          <h2 className="mt-1 font-display text-xl sm:text-2xl font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]">
            Long-Term Water Consumption Rhythm
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#645F75] dark:text-[#B3AEC4]">
            Hover or tap any day to inspect daily intake against your personal goal and 7-day rolling trend — computed 100% offline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded-xl bg-[#FAF8F4] dark:bg-[#212640] p-1 border border-[#E6DFD3] dark:border-[#2E3452]">
            <button
              type="button"
              onClick={() => setViewMode('combined')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'combined'
                  ? 'bg-[#1E1340] dark:bg-[#6C4FE0] text-white'
                  : 'text-[#645F75] dark:text-[#B3AEC4] hover:text-[#1F1D2B] dark:hover:text-white'
              }`}
            >
              Daily Bars
            </button>
            <button
              type="button"
              onClick={() => setViewMode('area')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'area'
                  ? 'bg-[#1E1340] dark:bg-[#6C4FE0] text-white'
                  : 'text-[#645F75] dark:text-[#B3AEC4] hover:text-[#1F1D2B] dark:hover:text-white'
              }`}
            >
              Wave Curve
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowMovingAverage((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              showMovingAverage
                ? 'border-[#6C4FE0]/50 bg-[#EFEAFF] dark:bg-[#2A2250] text-[#1E1340] dark:text-[#F3F0EA]'
                : 'border-[#E6DFD3] dark:border-[#2E3452] bg-[#FAF8F4] dark:bg-[#212640] text-[#645F75] dark:text-[#B3AEC4]'
            }`}
          >
            7-Day Avg {showMovingAverage ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {/* 4 Long-Term Hydration KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] p-4 border border-[#EFEAE0] dark:border-[#2B314E]">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
            <Droplets className="w-3.5 h-3.5 text-[#36B5C4]" />
            <span>30-Day Total</span>
          </div>
          <p className="mt-1.5 font-display text-lg sm:text-xl font-semibold text-[#1F1D2B] dark:text-[#F3F0EA] tabular-nums">
            {formatVolume(summary.totalMl, unit)}
          </p>
          <p className="mt-0.5 text-[11px] text-[#645F75] dark:text-[#B3AEC4]">
            {summary.activeCount} logged days
          </p>
        </div>

        <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] p-4 border border-[#EFEAE0] dark:border-[#2B314E]">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
            <TrendingUp className="w-3.5 h-3.5 text-[#6C4FE0] dark:text-[#A994FF]" />
            <span>Daily Average</span>
          </div>
          <p className="mt-1.5 font-display text-lg sm:text-xl font-semibold text-[#1F1D2B] dark:text-[#F3F0EA] tabular-nums">
            {formatVolume(summary.avgActiveMl, unit)}
          </p>
          <p className="mt-0.5 text-[11px] text-[#256B9A] dark:text-[#79BCE8]">
            {summary.deltaPct > 0
              ? `+${summary.deltaPct}% vs prior 15d`
              : summary.deltaPct < 0
              ? `${summary.deltaPct}% vs prior 15d`
              : 'Steady 30-day rhythm'}
          </p>
        </div>

        <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] p-4 border border-[#EFEAE0] dark:border-[#2B314E]">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
            <Target className="w-3.5 h-3.5 text-[#36B5C4]" />
            <span>Goal Met Days</span>
          </div>
          <p className="mt-1.5 font-display text-lg sm:text-xl font-semibold text-[#1F1D2B] dark:text-[#F3F0EA] tabular-nums">
            {summary.goalMetDays} / 30
          </p>
          <p className="mt-0.5 text-[11px] text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
            Target: {formatVolume(dailyGoalMl, unit)}
          </p>
        </div>

        <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] p-4 border border-[#EFEAE0] dark:border-[#2B314E]">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#645F75] dark:text-[#B3AEC4]">
            <Calendar className="w-3.5 h-3.5 text-[#6C4FE0] dark:text-[#A994FF]" />
            <span>Peak Day</span>
          </div>
          <p className="mt-1.5 font-display text-lg sm:text-xl font-semibold text-[#1F1D2B] dark:text-[#F3F0EA] tabular-nums">
            {summary.bestDay && summary.bestDay.ml > 0
              ? formatVolume(summary.bestDay.ml, unit)
              : '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-[#645F75] dark:text-[#B3AEC4]">
            {summary.bestDay && summary.bestDay.ml > 0
              ? summary.bestDay.shortLabel
              : 'Log a sip to start'}
          </p>
        </div>
      </div>

      {/* Selected Day Interactive Inspector Bar */}
      {inspectedPoint && (
        <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#212640] border border-[#E6DFD3] dark:border-[#2C3250] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-xs font-semibold text-[#1E1340] dark:text-[#F3F0EA]">
              {inspectedPoint.fullDateLabel}
              {inspectedPoint.isToday ? ' (Today)' : ''}
            </span>
            <span className="text-sm font-display font-semibold text-[#256B9A] dark:text-[#79BCE8] tabular-nums">
              {formatVolume(inspectedPoint.ml, unit)}
            </span>
            <span className="text-xs text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
              {Math.round(inspectedPoint.goalRatio * 100)}% of personal target
            </span>
            {showMovingAverage && (
              <span className="text-xs text-[#645F75] dark:text-[#B3AEC4] tabular-nums">
                · 7-day avg: {formatVolume(inspectedPoint.rollingAvg7Ml, unit)}
              </span>
            )}
          </div>
          <span
            className={`text-xs font-semibold ${
              inspectedPoint.goalMet
                ? 'text-[#1D8794] dark:text-[#66D2DF]'
                : inspectedPoint.ml > 0
                ? 'text-[#6C4FE0] dark:text-[#A994FF]'
                : 'text-[#645F75] dark:text-[#B3AEC4]'
            }`}
          >
            {inspectedPoint.goalMet
              ? 'Personal goal reached'
              : inspectedPoint.ml > 0
              ? 'Steady progress logged'
              : 'Quiet day — no pressure'}
          </span>
        </div>
      )}

      {/* Responsive D3 SVG Canvas */}
      <div ref={containerRef} className="w-full overflow-hidden">
        <svg
          ref={svgRef}
          role="img"
          aria-label="30-day water consumption chart"
          className="w-full block select-none"
        />
      </div>

      {/* Compact Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EFEAE0] dark:border-[#262B45] text-xs text-[#645F75] dark:text-[#B3AEC4]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#36B5C4]" />
            <span>Goal Met</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#6C4FE0] dark:bg-[#8B74F5]" />
            <span>Active Day</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#1E1340] dark:bg-[#F5C469]" />
            <span>7-Day Rolling Avg</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 border-t border-dashed border-[#256B9A] dark:border-[#79BCE8]" />
            <span>Personal Target</span>
          </span>
        </div>
        <span className="text-[11px]">
          Stored privately on your device · Never shared
        </span>
      </div>
    </section>
  );
};

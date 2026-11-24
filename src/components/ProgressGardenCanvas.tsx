import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Sprout } from 'lucide-react';
import { AchievementBadge, GardenStageInfo } from '../types/dailyTide';
import { GARDEN_STAGES } from '../data/localStore';

interface ProgressGardenCanvasProps {
  gardenStage: GardenStageInfo;
  stageProgress: number;
  totalTidePoints: number;
  todayPoints: number;
  pointsToNextStage: number | null;
  unlockedBadges: AchievementBadge[];
  compact?: boolean;
  onInspectGarden?: () => void;
}

export const ProgressGardenCanvas: React.FC<ProgressGardenCanvasProps> = ({
  gardenStage,
  stageProgress,
  totalTidePoints,
  todayPoints,
  pointsToNextStage,
  unlockedBadges,
  compact = false,
  onInspectGarden,
}) => {
  const tier = gardenStage.bloomTier; // 1..5
  const rewardBloomCount = Math.min(unlockedBadges.length, 6);

  return (
    <section className="rounded-3xl bg-white dark:bg-[#1A1E33] border border-[#E6DFD3] dark:border-[#2C3250] overflow-hidden">
      {/* Header Row */}
      <div className="px-6 pt-6 pb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF] flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5" />
            <span>
              Progress Garden · Stage {gardenStage.stageIndex} of {GARDEN_STAGES.length}
            </span>
          </p>
          <h2 className="mt-1 font-display text-xl sm:text-2xl font-semibold text-[#1F1D2B] dark:text-[#F3F0EA]">
            {gardenStage.name}
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-[#645F75] dark:text-[#B3AEC4]">
            {gardenStage.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-display text-lg font-semibold text-[#1E1340] dark:text-[#F3F0EA] tabular-nums">
              {totalTidePoints} pts
            </p>
            <p className="text-xs text-[#256B9A] dark:text-[#79BCE8] tabular-nums">
              +{todayPoints} earned today
            </p>
          </div>
          {compact && onInspectGarden && (
            <button
              type="button"
              onClick={onInspectGarden}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#EFEAFF] dark:bg-[#2E235C] text-[#1E1340] dark:text-white hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
            >
              Visit Garden
            </button>
          )}
        </div>
      </div>

      {/* Offline Animated SVG Botanical Garden Canvas */}
      <div className="px-4 sm:px-6">
        <div
          className={`relative w-full rounded-2xl overflow-hidden border border-[#E6DFD3]/70 dark:border-[#2C3250] ${
            compact ? 'h-48 sm:h-52' : 'h-64 sm:h-72'
          }`}
        >
          <svg
            viewBox="0 0 800 320"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full block"
            role="img"
            aria-label={`Progress Garden at stage ${gardenStage.stageIndex}: ${gardenStage.name}`}
          >
            <defs>
              <linearGradient id="gardenSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={tier >= 4 ? '#E9E2FF' : '#EEF6FB'} />
                <stop offset="55%" stopColor="#FAF8F4" />
                <stop offset="100%" stopColor="#E1F4F6" />
              </linearGradient>
              <linearGradient id="gardenSkyDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1B1F3A" />
                <stop offset="55%" stopColor="#212848" />
                <stop offset="100%" stopColor="#173445" />
              </linearGradient>
              <linearGradient id="tideWater" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#36B5C4" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#6C4FE0" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#36B5C4" stopOpacity="0.45" />
              </linearGradient>
              <linearGradient id="meadowHill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7DC2A5" />
                <stop offset="100%" stopColor="#468C7B" />
              </linearGradient>
              <linearGradient id="frontTerrace" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5DAA8C" />
                <stop offset="100%" stopColor="#2F6E66" />
              </linearGradient>
            </defs>

            {/* Sky Background (adapts via dark-mode class opacity) */}
            <rect width="800" height="320" fill="url(#gardenSky)" className="dark:hidden" />
            <rect width="800" height="320" fill="url(#gardenSkyDark)" className="hidden dark:block" />

            {/* Warm Sun / Twilight Glow */}
            <motion.circle
              cx="655"
              cy="74"
              r={tier >= 4 ? 46 : 36}
              fill={tier >= 4 ? '#CBBDFC' : '#F8E3B4'}
              opacity="0.55"
              animate={{ scale: [1, 1.06, 1], opacity: [0.48, 0.65, 0.48] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <circle cx="655" cy="74" r="24" fill="#FFF7DF" opacity="0.9" />

            {/* Distant Calm Shoreline Hills */}
            <path
              d="M0 220 Q 190 170 400 205 T 800 190 L 800 320 L 0 320 Z"
              fill="#B9DFD8"
              opacity="0.5"
            />

            {/* Gentle Shimmering Tide Pool */}
            <motion.path
              d="M0 232 Q 200 218 400 234 T 800 228 L 800 320 L 0 320 Z"
              fill="url(#tideWater)"
              animate={{
                d: [
                  'M0 232 Q 200 218 400 234 T 800 228 L 800 320 L 0 320 Z',
                  'M0 236 Q 220 224 410 228 T 800 234 L 800 320 L 0 320 Z',
                  'M0 232 Q 200 218 400 234 T 800 228 L 800 320 L 0 320 Z',
                ],
              }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Main Botanical Garden Hills */}
            <path
              d="M0 250 Q 210 210 440 245 T 800 238 L 800 320 L 0 320 Z"
              fill="url(#meadowHill)"
            />
            <path
              d="M0 278 Q 260 248 520 272 T 800 264 L 800 320 L 0 320 Z"
              fill="url(#frontTerrace)"
            />

            {/* STAGE 1+: Tender Coastal Sprouts (Always visible) */}
            <g>
              {[120, 250, 410, 560, 685].map((x, idx) => (
                <motion.g
                  key={`sprout_${x}`}
                  style={{ originX: `${x}px`, originY: '268px' }}
                  animate={{ rotate: [-2, 2.5, -2] }}
                  transition={{
                    duration: 4.2 + idx * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <path
                    d={`M${x} 268 Q ${x - 4} 248 ${x} 234`}
                    stroke="#2B5E54"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <ellipse cx={x - 9} cy={244} rx="9" ry="4.5" transform={`rotate(-28 ${x - 9} 244)`} fill="#8FD6B7" />
                  <ellipse cx={x + 9} cy={242} rx="9" ry="4.5" transform={`rotate(26 ${x + 9} 242)`} fill="#A4E3C5" />
                </motion.g>
              ))}
            </g>

            {/* STAGE 2+: Taller Swaying Ferns & Coastal Reeds */}
            {tier >= 2 && (
              <g>
                {[175, 335, 495, 625].map((x, idx) => (
                  <motion.g
                    key={`fern_${x}`}
                    style={{ originX: `${x}px`, originY: '264px' }}
                    animate={{ rotate: [-3, 3, -3] }}
                    transition={{
                      duration: 5 + idx * 0.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <path
                      d={`M${x} 264 Q ${x + 6} 224 ${x - 2} 188`}
                      stroke="#235750"
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <ellipse cx={x - 13} cy={222} rx="13" ry="5.5" transform={`rotate(-32 ${x - 13} 222)`} fill="#6BC0A3" />
                    <ellipse cx={x + 13} cy={214} rx="13" ry="5.5" transform={`rotate(30 ${x + 13} 214)`} fill="#7FD1B4" />
                    <ellipse cx={x - 10} cy={198} rx="11" ry="4.5" transform={`rotate(-24 ${x - 10} 198)`} fill="#9EE2C8" />
                    <circle cx={x - 2} cy={184} r="6.5" fill={idx % 2 === 0 ? '#9B84F5' : '#5FD3DE'} />
                  </motion.g>
                ))}
              </g>
            )}

            {/* STAGE 3+: Soft Violet & Aqua Coastal Flowers */}
            {tier >= 3 && (
              <g>
                {[
                  { x: 145, y: 192, petal: '#8F74F2', center: '#FBE59B' },
                  { x: 300, y: 176, petal: '#4AC6D4', center: '#FFF4C7' },
                  { x: 455, y: 184, petal: '#A78BFA', center: '#FDE68A' },
                  { x: 605, y: 188, petal: '#6C4FE0', center: '#FDE68A' },
                ].map((fl, idx) => (
                  <motion.g
                    key={`flower_${fl.x}`}
                    style={{ originX: `${fl.x}px`, originY: '266px' }}
                    animate={{ rotate: [-2.4, 2.4, -2.4] }}
                    transition={{
                      duration: 4.8 + idx * 0.6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <path
                      d={`M${fl.x} 266 Q ${fl.x - 5} 226 ${fl.x} ${fl.y}`}
                      stroke="#21534C"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {[0, 72, 144, 216, 288].map((angle) => {
                      const rad = (angle * Math.PI) / 180;
                      const px = fl.x + Math.cos(rad) * 11;
                      const py = fl.y + Math.sin(rad) * 11;
                      return <circle key={angle} cx={px} cy={py} r="7.5" fill={fl.petal} opacity="0.92" />;
                    })}
                    <circle cx={fl.x} cy={fl.y} r="6" fill={fl.center} />
                  </motion.g>
                ))}
              </g>
            )}

            {/* STAGE 4+: Radiant Sanctuary Willow Arch & Floating Dew Motes */}
            {tier >= 4 && (
              <g>
                <motion.g
                  animate={{ y: [0, -8, 0], opacity: [0.45, 0.9, 0.45] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <circle cx="220" cy="128" r="3.5" fill="#A994FF" />
                  <circle cx="385" cy="112" r="4.5" fill="#5FD3DE" />
                  <circle cx="530" cy="134" r="3.5" fill="#FBE59B" />
                  <circle cx="670" cy="144" r="3" fill="#A994FF" />
                </motion.g>
                {/* Lush sanctuary tree on right */}
                <path d="M722 262 Q 716 196 728 140" stroke="#4D4463" strokeWidth="10" strokeLinecap="round" fill="none" />
                <circle cx="722" cy="132" r="46" fill="#6C4FE0" opacity="0.28" />
                <circle cx="696" cy="144" r="32" fill="#36B5C4" opacity="0.32" />
                <circle cx="744" cy="146" r="30" fill="#8F74F2" opacity="0.34" />
              </g>
            )}

            {/* STAGE 5: Violet Dolphin Oasis Crown Lotus */}
            {tier >= 5 && (
              <motion.g
                animate={{ scale: [1, 1.05, 1] }}
                style={{ originX: '400px', originY: '214px' }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ellipse cx="400" cy="236" rx="44" ry="12" fill="#46A69B" opacity="0.85" />
                <path d="M400 186 Q 418 208 400 232 Q 382 208 400 186 Z" fill="#C7B8FF" />
                <path d="M400 198 Q 430 212 414 234 Q 396 222 400 198 Z" fill="#8F74F2" />
                <path d="M400 198 Q 370 212 386 234 Q 404 222 400 198 Z" fill="#8F74F2" />
                <circle cx="400" cy="218" r="6" fill="#FFE699" />
              </motion.g>
            )}

            {/* Visual Achievement Reward Blooms (1 glowing lotus/star bloom per unlocked badge) */}
            {Array.from({ length: rewardBloomCount }, (_, i) => {
              const bx = 95 + i * 122;
              const by = i % 2 === 0 ? 286 : 278;
              return (
                <motion.g
                  key={`reward_bloom_${i}`}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3.4 + i * 0.35, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <circle cx={bx} cy={by} r="10" fill="#FFF7DF" opacity="0.3" />
                  <circle cx={bx} cy={by} r="5.5" fill={i % 2 === 0 ? '#F9D67A' : '#B7A4FF'} />
                  <circle cx={bx} cy={by} r="2.5" fill="#FFFFFF" />
                </motion.g>
              );
            })}
          </svg>

          {/* Subtle Offline Stage Overlay Badge inside Bottom Left */}
          <div className="absolute bottom-3 left-3 rounded-xl bg-white/88 dark:bg-[#141729]/88 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-[#1E1340] dark:text-[#F3F0EA] flex items-center gap-1.5 border border-black/5 dark:border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-[#6C4FE0] dark:text-[#A994FF]" />
            <span>
              {unlockedBadges.length} achievement {unlockedBadges.length === 1 ? 'blossom' : 'blossoms'} planted
            </span>
          </div>
        </div>
      </div>

      {/* Stage Progression Bar & Stage Roadmap */}
      <div className="px-6 py-5 space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-[#645F75] dark:text-[#B3AEC4]">
              {pointsToNextStage !== null
                ? `${pointsToNextStage} Tide Points until Stage ${gardenStage.stageIndex + 1}`
                : 'Highest Garden Sanctuary reached — every day keeps it blooming'}
            </span>
            <span className="font-semibold text-[#6C4FE0] dark:text-[#A994FF] tabular-nums">
              {Math.round(stageProgress * 100)}%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#EFEAE0] dark:bg-[#262B45] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#36B5C4] to-[#6C4FE0] transition-all duration-500"
              style={{ width: `${Math.max(stageProgress * 100, 6)}%` }}
            />
          </div>
        </div>

        {!compact && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {GARDEN_STAGES.map((st) => {
              const reached = totalTidePoints >= st.minPoints;
              const isCurrent = st.stageIndex === gardenStage.stageIndex;
              return (
                <div
                  key={st.stageIndex}
                  className={`rounded-2xl p-3 border text-left transition-colors ${
                    isCurrent
                      ? 'border-[#6C4FE0] bg-[#EFEAFF]/70 dark:bg-[#2E235C]/70'
                      : reached
                      ? 'border-[#36B5C4]/50 bg-[#E4F7F9]/50 dark:bg-[#163442]/45'
                      : 'border-[#E6DFD3] dark:border-[#2C3250] bg-[#FAF8F4] dark:bg-[#212640] opacity-70'
                  }`}
                >
                  <p className="text-[11px] font-semibold text-[#6C4FE0] dark:text-[#A994FF] tabular-nums">
                    Stage {st.stageIndex} · {st.minPoints}+ pts
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[#1F1D2B] dark:text-[#F3F0EA] truncate">
                    {st.name}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

'use client';

import { useState } from 'react';
import type { AchievementState } from '@/src/hooks/useAchievements';
import type { AchievementTier } from '@/src/lib/achievements/definitions';

const TIER_CONFIG: Record<AchievementTier, {
  label: string;
  border: string;
  glow: string;
  dot: string;
  badge: string;
  bar: string;
}> = {
  bronze:   { label: 'Bronze',   border: 'border-amber-800/50',   glow: '',                              dot: 'bg-amber-600',    badge: 'bg-amber-900/40 text-amber-400 border-amber-700/30',  bar: 'from-amber-700 to-amber-500'    },
  silver:   { label: 'Silver',   border: 'border-slate-500/50',   glow: '',                              dot: 'bg-slate-400',    badge: 'bg-slate-700/40 text-slate-300 border-slate-500/30',  bar: 'from-slate-500 to-slate-300'    },
  gold:     { label: 'Gold',     border: 'border-yellow-600/60',  glow: 'shadow-yellow-900/20',         dot: 'bg-yellow-400',   badge: 'bg-yellow-900/40 text-yellow-300 border-yellow-600/30', bar: 'from-yellow-600 to-yellow-400' },
  platinum: { label: 'Platinum', border: 'border-cyan-500/60',    glow: 'shadow-cyan-900/20',           dot: 'bg-cyan-400',     badge: 'bg-cyan-900/40 text-cyan-300 border-cyan-500/30',      bar: 'from-cyan-600 to-cyan-400'      },
  diamond:  { label: 'Diamond',  border: 'border-violet-500/70',  glow: 'shadow-violet-900/30',        dot: 'bg-violet-400',   badge: 'bg-violet-900/40 text-violet-300 border-violet-500/30', bar: 'from-violet-600 to-violet-400' },
};

const TIER_ORDER: AchievementTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

interface AchievementBadgeCardProps {
  achievement: AchievementState;
}

export function AchievementBadgeCard({ achievement }: AchievementBadgeCardProps) {
  const [hovered, setHovered] = useState(false);

  const isLocked = achievement.unlockedTiers.length === 0;
  const isSecret = achievement.hidden;
  const highestTier = achievement.highestTier;
  const tierConfig = highestTier ? TIER_CONFIG[highestTier] : null;
  const progress = achievement.progress;

  if (isSecret) {
    return (
      <div className="rounded-xl border border-white/[0.04] bg-[#0c0d16]/30 p-4 font-mono flex flex-col items-center justify-center gap-2 h-40">
        <span className="material-symbols-outlined text-[28px] text-white/10">lock</span>
        <p className="text-[8px] text-white/20 uppercase tracking-widest">Secret Achievement</p>
      </div>
    );
  }

  return (
    <div
      className={`
        relative rounded-xl border p-4 font-mono transition-all duration-200 flex flex-col gap-3
        ${isLocked
          ? 'border-white/[0.04] bg-[#0c0d16]/30 opacity-50 hover:opacity-70'
          : `border-white/[0.06] bg-[#0c0d16]/50 ${tierConfig?.border ?? ''} ${tierConfig?.glow ? `shadow-lg ${tierConfig.glow}` : ''} hover:border-white/[0.10]`
        }
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top line shimmer for unlocked */}
      {!isLocked && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent rounded-t-xl" />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border transition-colors ${
          isLocked
            ? 'bg-white/[0.02] border-white/[0.04]'
            : 'bg-white/[0.04] border-white/[0.06]'
        }`}>
          <span className={`material-symbols-outlined text-[18px] ${isLocked ? 'text-white/20' : 'text-cyan-400'}`}>
            {achievement.icon}
          </span>
        </div>

        {/* Tier badges */}
        <div className="flex flex-wrap gap-1 justify-end">
          {TIER_ORDER.filter((t) => achievement.tiers.some((td) => td.tier === t)).map((tier) => {
            const unlocked = achievement.unlockedTiers.includes(tier);
            const cfg = TIER_CONFIG[tier];
            return (
              <span
                key={tier}
                className={`text-[7px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider transition-all ${
                  unlocked
                    ? `${cfg.badge}`
                    : 'bg-white/[0.02] text-white/15 border-white/[0.05]'
                }`}
              >
                {cfg.label[0]}
              </span>
            );
          })}
        </div>
      </div>

      {/* Title + description */}
      <div className="flex-1">
        <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isLocked ? 'text-white/30' : 'text-white/90'}`}>
          {achievement.title}
        </h3>
        <p className={`text-[9px] leading-relaxed ${isLocked ? 'text-white/20' : 'text-white/40'}`}>
          {achievement.description}
        </p>
      </div>

      {/* Progress bar */}
      {progress && !achievement.isCompleted && (
        <div>
          <div className="flex justify-between text-[8px] text-white/25 uppercase tracking-wider mb-1">
            <span>{achievement.nextTier} tier</span>
            <span>{progress.current} / {progress.required}</span>
          </div>
          <div className="h-1 rounded-full bg-white/[0.04]">
            <div
              className={`h-1 rounded-full bg-gradient-to-r ${
                highestTier ? TIER_CONFIG[highestTier].bar : 'from-white/20 to-white/10'
              } transition-all duration-700`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Completed state */}
      {achievement.isCompleted && (
        <div className="flex items-center gap-1.5 text-[8px] text-emerald-400 uppercase tracking-wider">
          <span className="material-symbols-outlined text-[12px]">check_circle</span>
          Completed
        </div>
      )}

      {/* Locked state */}
      {isLocked && !hovered && (
        <div className="flex items-center gap-1.5 text-[8px] text-white/20 uppercase tracking-wider">
          <span className="material-symbols-outlined text-[12px]">lock</span>
          Locked
        </div>
      )}
    </div>
  );
}

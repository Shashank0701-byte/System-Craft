'use client';

import type { XPState } from '@/src/hooks/useMetrics';

const TIER_COLORS = [
  'from-slate-500 to-slate-400',    // 1 Student
  'from-sky-600 to-sky-400',        // 2 Junior
  'from-blue-600 to-blue-400',      // 3 Software
  'from-indigo-500 to-indigo-400',  // 4 Senior
  'from-violet-500 to-violet-400',  // 5 Staff
  'from-purple-500 to-purple-400',  // 6 Principal
  'from-cyan-500 to-cyan-400',      // 7 Architect
  'from-teal-400 to-emerald-400',   // 8 Distinguished
  'from-yellow-400 to-amber-400',   // 9 Legend
];

interface XPLevelBarProps {
  xp: XPState | null;
  isLoading: boolean;
}

export function XPLevelBar({ xp, isLoading }: XPLevelBarProps) {
  if (isLoading) {
    return <div className="h-16 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />;
  }

  const level = xp?.level ?? 1;
  const title = xp?.title ?? 'Student';
  const total = xp?.total ?? 0;
  const progress = xp?.progress ?? { current: 0, required: 500, percent: 0 };
  const gradient = TIER_COLORS[(level - 1) % TIER_COLORS.length];
  const isFinalLevel = progress.required === 0;

  return (
    <div className="rounded-xl border border-white/[0.04] bg-[#0c0d16]/40 px-6 py-4 font-mono">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Level badge */}
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <span className="text-sm font-black text-black">{level}</span>
          </div>
          <div>
            <p className="text-[8px] text-white/30 uppercase tracking-[0.2em]">Engineer Level</p>
            <p className="text-sm font-bold text-white uppercase tracking-wider">{title}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-white/30 uppercase tracking-wider">Total XP</p>
          <p className="text-sm font-bold text-cyan-400 font-mono">{total.toLocaleString()} XP</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className={`h-1.5 rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
            style={{ width: `${isFinalLevel ? 100 : progress.percent}%` }}
          />
        </div>
        <div className="flex justify-between text-[8px] text-white/25 uppercase tracking-wider">
          {isFinalLevel ? (
            <span className="text-yellow-400/70">Maximum rank achieved</span>
          ) : (
            <>
              <span>{progress.current.toLocaleString()} / {progress.required.toLocaleString()} XP to next level</span>
              <span>{progress.percent}%</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

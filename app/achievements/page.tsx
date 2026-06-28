'use client';

import { useState } from 'react';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { useAchievements } from '@/src/hooks/useAchievements';
import { useMetrics } from '@/src/hooks/useMetrics';
import { Header } from '@/components/dashboard/Header';
import { AchievementBadgeCard } from '@/components/achievements/AchievementBadgeCard';
import { XPLevelBar } from '@/components/achievements/XPLevelBar';
import { SkillBars } from '@/components/achievements/SkillBars';
import type { AchievementCategory } from '@/src/lib/achievements/definitions';

const CATEGORIES: { key: AchievementCategory | 'all'; label: string; icon: string }[] = [
  { key: 'all',                   label: 'All',              icon: 'apps'           },
  { key: 'learning',              label: 'Learning',         icon: 'school'         },
  { key: 'interview',             label: 'Interview',        icon: 'psychology'     },
  { key: 'infrastructure',        label: 'Infrastructure',   icon: 'storage'        },
  { key: 'distributed_systems',   label: 'Distributed',     icon: 'device_hub'     },
  { key: 'reliability',           label: 'Reliability',     icon: 'health_and_safety' },
  { key: 'scalability',           label: 'Scalability',     icon: 'open_in_full'   },
  { key: 'reference_architectures', label: 'Reference',     icon: 'map'            },
  { key: 'secret',                label: 'Secret',          icon: 'lock'           },
];

export default function AchievementsPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth();
  const { achievements, recentlyUnlocked, isLoading: achLoading, error: achievementsError, refresh: refreshAchievements } = useAchievements();
  const { xp, streaks, skills, isLoading: metricsLoading, error: metricsError, refresh: refreshMetrics } = useMetrics();
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  const isLoading = authLoading || achLoading || metricsLoading;
  const error = achievementsError ?? metricsError;

  const filtered = achievements.filter((a) => {
    if (activeCategory !== 'all' && a.category !== activeCategory) return false;
    if (showUnlockedOnly && a.unlockedTiers.length === 0) return false;
    return true;
  });

  const unlockedCount = achievements.filter((a) => a.unlockedTiers.length > 0).length;
  const totalCount = achievements.length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060810]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border border-white/[0.06] border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-white/40 text-xs font-mono tracking-widest uppercase">Initializing access…</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  if (error) {
    return (
      <div className="flex flex-col w-full bg-[#060810] min-h-screen">
        <Header />
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-[1400px] mx-auto rounded-xl border border-red-500/20 bg-red-500/10 p-4 font-mono text-xs text-red-300">
            Failed to load achievement data.
            <button
              onClick={() => {
                refreshAchievements();
                refreshMetrics();
              }}
              className="ml-3 underline cursor-pointer hover:text-red-200"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-[#060810] min-h-screen">
      <Header />
      <main className="flex-1 overflow-y-auto p-6 md:p-8 select-none">
        <div className="max-w-[1400px] mx-auto space-y-8">

          {/* ── Page header ── */}
          <div className="flex items-start justify-between font-mono">
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <span className="material-symbols-outlined text-cyan-400 text-[20px]">military_tech</span>
                Achievement Index
              </h1>
              <p className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">
                {unlockedCount} / {totalCount} badges unlocked
              </p>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono">
              <button
                onClick={() => setShowUnlockedOnly((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border transition-all uppercase tracking-wider font-bold cursor-pointer ${
                  showUnlockedOnly
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                    : 'border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white/70'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">
                  {showUnlockedOnly ? 'filter_alt' : 'filter_alt_off'}
                </span>
                Unlocked only
              </button>
            </div>
          </div>

          {/* ── XP + Level bar ── */}
          <XPLevelBar xp={xp} isLoading={metricsLoading} />

          {/* ── Top row: stats + recent unlocks + skill bars ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Stats */}
            <div className="rounded-xl border border-white/[0.04] bg-[#0c0d16]/40 p-5 font-mono space-y-4">
              <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold">Progress Overview</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Unlocked',  value: unlockedCount,    color: 'text-cyan-400'    },
                  { label: 'Remaining', value: totalCount - unlockedCount, color: 'text-white/40' },
                  { label: 'Streak',    value: `${streaks?.current ?? 0}d`, color: 'text-emerald-400' },
                  { label: 'Best Streak', value: `${streaks?.longest ?? 0}d`, color: 'text-white/60' },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-[#060810]/60 border border-white/[0.04] p-3 text-center">
                    <p className="text-[8px] text-white/25 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              {/* Overall completion bar */}
              <div>
                <div className="flex justify-between text-[8px] text-white/30 uppercase tracking-wider mb-1.5">
                  <span>Overall completion</span>
                  <span>{totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.04]">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-700"
                    style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Recent unlocks */}
            <div className="rounded-xl border border-white/[0.04] bg-[#0c0d16]/40 p-5 font-mono">
              <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold mb-4">Recently Unlocked</p>
              {recentlyUnlocked.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="material-symbols-outlined text-2xl text-white/10 mb-2">lock</span>
                  <p className="text-[9px] text-white/25 uppercase tracking-wider">No unlocks yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentlyUnlocked.slice(0, 5).map((u) => {
                    const def = achievements.find((a) => a.id === u.achievementId);
                    if (!def) return null;
                    return (
                      <div key={`${u.achievementId}-${u.tier}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                        <span className="material-symbols-outlined text-[16px] text-cyan-400">{def.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-white truncate">{def.title}</p>
                          <p className="text-[8px] text-white/30 uppercase tracking-wider">{u.tier}</p>
                        </div>
                        <span className="text-[8px] text-emerald-400 font-bold">+{u.xpAwarded} XP</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Skill bars */}
            <SkillBars skills={skills} isLoading={metricsLoading} />
          </div>

          {/* ── Category filter tabs ── */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-mono">
            {CATEGORIES.map((cat) => {
              const count = cat.key === 'all'
                ? achievements.length
                : achievements.filter((a) => a.category === cat.key).length;
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                    isActive
                      ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                      : 'border-white/[0.05] bg-white/[0.02] text-white/35 hover:text-white/65 hover:border-white/[0.08]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">{cat.icon}</span>
                  {cat.label}
                  <span className={`text-[8px] ${isActive ? 'text-cyan-400/70' : 'text-white/20'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Badge grid ── */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-40 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/[0.05] rounded-xl font-mono">
              <span className="material-symbols-outlined text-4xl text-white/10 mb-4">search_off</span>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">No achievements in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((achievement) => (
                <AchievementBadgeCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

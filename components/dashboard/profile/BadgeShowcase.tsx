"use client";

import { useMemo } from 'react';
import type { AchievementTier } from '@/src/lib/achievements/definitions';

interface BadgeProgress {
    current: number;
    required: number;
    percent: number;
}

export interface AchievementState {
    id: string;
    title: string;
    description: string;
    category: string;
    icon: string;
    hidden: boolean;
    highestTier: AchievementTier | null;
    nextTier: AchievementTier | null;
    progress: BadgeProgress | null;
    isCompleted: boolean;
    unlockedAt: string | null;
}

interface BadgeShowcaseProps {
    achievements: AchievementState[];
}

const TIER_COLORS: Record<AchievementTier, { text: string; bg: string; border: string }> = {
    bronze:   { text: 'text-amber-600',  bg: 'bg-amber-600/10',   border: 'border-amber-600/20' },
    silver:   { text: 'text-slate-300',  bg: 'bg-slate-300/10',   border: 'border-slate-300/20' },
    gold:     { text: 'text-yellow-400', bg: 'bg-yellow-400/10',  border: 'border-yellow-400/20' },
    platinum: { text: 'text-cyan-200',   bg: 'bg-cyan-200/10',    border: 'border-cyan-200/20' },
    diamond:  { text: 'text-violet-400', bg: 'bg-violet-400/10',  border: 'border-violet-400/20' },
};

export function BadgeShowcase({ achievements }: BadgeShowcaseProps) {
    // Filter out hidden locked achievements and sort: 
    // Unlocked first (by highest tier then progress), then locked.
    const visible = useMemo(() => {
        return achievements
            .filter((a) => !a.hidden || a.highestTier !== null)
            .sort((a, b) => {
                if (a.highestTier && !b.highestTier) return -1;
                if (!a.highestTier && b.highestTier) return 1;
                // If both unlocked, sort by tier level (diamond > platinum, etc.)
                // This is a simple approximation: could map tiers to values
                const tierVal = (t: string | null) => ['bronze','silver','gold','platinum','diamond'].indexOf(t || '') || 0;
                const aTier = tierVal(a.highestTier);
                const bTier = tierVal(b.highestTier);
                if (aTier !== bTier) return bTier - aTier;
                // Sort by progress if same tier
                if (a.progress && b.progress) return b.progress.percent - a.progress.percent;
                return 0;
            });
    }, [achievements]);

    return (
        <div className="w-full space-y-6">
            <div className="flex items-center gap-2 px-1">
                <span className="material-symbols-outlined text-[16px] text-white/40">military_tech</span>
                <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/80">Engineering Milestones</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visible.map((achievement) => (
                    <BadgeCard key={achievement.id} achievement={achievement} />
                ))}
            </div>
        </div>
    );
}

function BadgeCard({ achievement }: { achievement: AchievementState }) {
    const isUnlocked = achievement.highestTier !== null;
    const colors = isUnlocked ? TIER_COLORS[achievement.highestTier!] : { text: 'text-white/20', bg: 'bg-white/[0.02]', border: 'border-white/[0.04]' };

    return (
        <div className={`flex flex-col p-5 rounded-xl bg-[#0c0d16]/50 backdrop-blur-md border transition-all duration-300 ${colors.border} ${isUnlocked ? 'hover:bg-[#0c0d16]/80 hover:shadow-lg hover:-translate-y-0.5' : 'opacity-60'}`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`size-10 rounded-lg flex items-center justify-center border ${colors.bg} ${colors.border}`}>
                    <span className={`material-symbols-outlined text-[20px] ${colors.text}`}>
                        {isUnlocked ? achievement.icon : 'lock'}
                    </span>
                </div>
                {isUnlocked && (
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-widest uppercase ${colors.bg} ${colors.text} ${colors.border} border`}>
                        {achievement.highestTier}
                    </span>
                )}
            </div>

            <h4 className={`text-xs font-mono font-bold uppercase tracking-wider mb-1.5 ${isUnlocked ? 'text-white/90' : 'text-white/40'}`}>
                {isUnlocked ? achievement.title : 'Locked Milestone'}
            </h4>
            <p className="text-[10px] font-mono text-white/40 leading-relaxed min-h-[30px] mb-4">
                {achievement.description}
            </p>

            {/* Progress bar towards next tier */}
            {achievement.progress && !achievement.isCompleted ? (
                <div className="mt-auto flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[8px] font-mono tracking-widest uppercase text-white/30">
                        <span>{achievement.highestTier ? `Next: ${achievement.nextTier}` : 'Progress'}</span>
                        <span>{achievement.progress.current} / {achievement.progress.required}</span>
                    </div>
                    <div className="h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-700 ease-out ${isUnlocked ? 'bg-cyan-400/50' : 'bg-white/10'}`}
                            style={{ width: `${achievement.progress.percent}%` }}
                        />
                    </div>
                </div>
            ) : achievement.isCompleted ? (
                <div className="mt-auto pt-2 border-t border-white/[0.04]">
                    <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-emerald-400/80 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        Mastered
                    </span>
                </div>
            ) : (
                <div className="mt-auto h-1 w-full" />
            )}
        </div>
    );
}

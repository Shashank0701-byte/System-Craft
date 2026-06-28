"use client";

import { getXPProgressInLevel } from '@/src/lib/achievements/levels';

interface LevelBannerProps {
    xp: number;
    level: number;
    title: string;
}

export function LevelBanner({ xp, level, title }: LevelBannerProps) {
    const progress = getXPProgressInLevel(xp);
    
    return (
        <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl bg-[#0c0d16]/75 backdrop-blur-xl border border-white/[0.05] relative overflow-hidden gap-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(34,211,238,0.03),transparent_50%)] pointer-events-none" />
            
            <div className="flex flex-col gap-1 z-10">
                <span className="text-[10px] font-mono tracking-[0.2em] text-white/40 uppercase">Current Designation</span>
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold font-display tracking-tight text-white/90 uppercase">{title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">LVL {level}</span>
                </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:max-w-sm z-10">
                <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-white/60">
                    <span className="uppercase text-cyan-400/80">{progress.current.toLocaleString()} XP</span>
                    <span className="uppercase">{progress.percent === 100 ? 'MAXIMUM LEVEL' : `${progress.required.toLocaleString()} XP`}</span>
                </div>
                <div className="h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-indigo-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                        style={{ width: `${progress.percent}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

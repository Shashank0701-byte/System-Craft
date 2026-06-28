"use client";

import { useMemo } from 'react';

interface HeatmapProps {
    heatmap: Record<string, number>;
}

export function ActivityHeatmap({ heatmap }: HeatmapProps) {
    // Generate the last 20 weeks (140 days) plus padding to align to Sunday
    const days = useMemo(() => {
        const result = [];
        const today = new Date();
        
        // Find how many days to pad so the grid starts on Sunday
        const totalDaysToShow = 140; // 20 weeks
        
        // We want the last cell to be `today`.
        // The grid has 7 rows (Sun-Sat).
        // `today` will be in the last column at row `endDayOfWeek`.
        // So the first cell of the 20 weeks column block might not be Sunday.
        // Let's go back 140 days, then pad the front with empty slots until Sunday.
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - totalDaysToShow + 1);
        
        const startDayOfWeek = startDate.getDay();
        
        // Pad the beginning (empty cells)
        for (let i = 0; i < startDayOfWeek; i++) {
            result.push({ date: `pad-start-${i}`, count: -1 });
        }
        
        // Fill actual days
        for (let i = totalDaysToShow - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().slice(0, 10);
            result.push({
                date: dateStr,
                count: heatmap[dateStr] || 0
            });
        }
        
        return result;
    }, [heatmap]);

    const getIntensityClass = (count: number) => {
        if (count < 0) return 'bg-transparent'; // padding
        if (count === 0) return 'bg-white/[0.02] border border-white/[0.03]';
        if (count <= 2) return 'bg-cyan-900/60 border border-cyan-800/40';
        if (count <= 5) return 'bg-cyan-700 border border-cyan-600/50';
        if (count <= 8) return 'bg-cyan-500 border border-cyan-400/50';
        return 'bg-cyan-400 border border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.4)]';
    };

    return (
        <div className="flex flex-col gap-4 p-6 rounded-2xl bg-[#0c0d16]/75 backdrop-blur-xl border border-white/[0.05]">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-white/40">calendar_month</span>
                <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/80">Activity Heatmap</h3>
            </div>
            
            <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/[0.1] scrollbar-track-transparent">
                <div className="inline-flex gap-2 min-w-max">
                    {/* Day labels */}
                    <div className="grid grid-rows-7 gap-1 text-[8px] font-mono tracking-widest text-white/30 uppercase pr-2">
                        <div className="h-3 flex items-center">Sun</div>
                        <div className="h-3 flex items-center"></div>
                        <div className="h-3 flex items-center">Tue</div>
                        <div className="h-3 flex items-center"></div>
                        <div className="h-3 flex items-center">Thu</div>
                        <div className="h-3 flex items-center"></div>
                        <div className="h-3 flex items-center">Sat</div>
                    </div>
                    
                    {/* The Grid */}
                    <div className="grid grid-rows-7 grid-flow-col gap-1.5">
                        {days.map((d) => (
                            <div 
                                key={d.date} 
                                className={`w-3 h-3 rounded-[2px] transition-colors duration-300 ${getIntensityClass(d.count)}`}
                                title={d.count >= 0 ? `${d.count} activities on ${d.date}` : undefined}
                            />
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 text-[9px] font-mono tracking-widest uppercase text-white/30">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-white/[0.02] border border-white/[0.03]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-cyan-900/60 border border-cyan-800/40"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-cyan-700 border border-cyan-600/50"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-cyan-500 border border-cyan-400/50"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-cyan-400 border border-cyan-300"></div>
                </div>
                <span>More</span>
            </div>
        </div>
    );
}

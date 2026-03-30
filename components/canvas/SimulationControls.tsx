import React from 'react';

interface SimulationControlsProps {
    isRunning: boolean;
    targetRps: number;
    onToggle: (running: boolean) => void;
    onChangeRps: (rps: number) => void;
}

export function SimulationControls({
    isRunning,
    targetRps,
    onToggle,
    onChangeRps
}: SimulationControlsProps) {
    return (
        <div className="absolute top-20 right-4 z-50 bg-white dark:bg-sidebar-bg-dark border border-slate-200 dark:border-border-dark rounded-xl shadow-2xl p-4 w-72 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                    <span className={`material-symbols-outlined ${isRunning ? 'text-primary animate-pulse' : 'text-slate-400'}`}>
                        {isRunning ? 'speed' : 'play_arrow'}
                    </span>
                    Load Simulator
                </div>
                <button
                    onClick={() => onToggle(!isRunning)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${isRunning ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' : 'bg-primary hover:bg-primary/90 text-white shadow-primary/30'}`}
                >
                    {isRunning ? 'Stop Load' : 'Run Test'}
                </button>
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span>Target Throughput</span>
                    <span className="text-slate-900 dark:text-white font-bold">{targetRps.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">RPS</span></span>
                </div>
                <input 
                    type="range"
                    min="0"
                    max="250000"
                    step="5000"
                    value={targetRps}
                    onChange={(e) => onChangeRps(parseInt(e.target.value, 10))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-primary focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>0</span>
                    <span>100k</span>
                    <span>250k+</span>
                </div>
            </div>
        </div>
    );
}

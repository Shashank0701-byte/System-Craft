import React, { useState, useEffect } from 'react';

// Live scrolling history hook for sparklines
function useMetricHistory(baseValue: number, isRunning: boolean, maxVal: number, jitterPercent: number = 0.1) {
  const maxLength = 25;
  const [history, setHistory] = useState<number[]>(Array(maxLength).fill(0));

  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prev => {
        let nextVal = 0;
        if (isRunning) {
          if (baseValue === 0) {
            nextVal = Math.random() > 0.8 ? Math.random() * maxVal * 0.05 : 0;
          } else {
            const jitter = baseValue * jitterPercent * (Math.random() - 0.5) * 2;
            nextVal = Math.max(0, baseValue + jitter);
          }
        } else {
          nextVal = prev[prev.length - 1] * 0.7; // Decay to 0
          if (nextVal < 0.1) nextVal = 0;
        }
        return [...prev.slice(1), nextVal];
      });
    }, 400); // 400ms interval for that live datadog polling feel

    return () => clearInterval(interval);
  }, [baseValue, isRunning, maxVal, jitterPercent]);

  const points = history.map((val, i) => {
    const x = (i / (maxLength - 1)) * 100;
    const scaledVal = maxVal === 0 ? 0 : Math.min(val / maxVal, 1);
    const y = 24 - (scaledVal * 20); 
    return `${x},${y}`;
  }).join(' ');

  const currentValue = history[history.length - 1];

  return { points, currentValue };
}

const DashboardMetric = ({ 
  title, 
  valueFormatted, 
  unit, 
  points, 
  colorGroup, 
  active,
  alert
}: {
  title: string;
  valueFormatted: string;
  unit: string;
  points: string;
  colorGroup: 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
  active: boolean;
  alert?: boolean;
}) => {
  const colors = {
    cyan: { text: 'text-cyan-400', stroke: 'stroke-cyan-400', fill: 'from-cyan-400/20 to-transparent', border: 'border-cyan-500/20' },
    emerald: { text: 'text-emerald-400', stroke: 'stroke-emerald-400', fill: 'from-emerald-400/20 to-transparent', border: 'border-emerald-500/20' },
    amber: { text: 'text-amber-400', stroke: 'stroke-amber-400', fill: 'from-amber-400/20 to-transparent', border: 'border-amber-500/20' },
    rose: { text: 'text-rose-400', stroke: 'stroke-rose-400', fill: 'from-rose-400/20 to-transparent', border: 'border-rose-500/20' },
    violet: { text: 'text-violet-400', stroke: 'stroke-violet-400', fill: 'from-violet-400/20 to-transparent', border: 'border-violet-500/20' },
  };

  const c = colors[colorGroup];

  return (
    <div className={`relative p-2 rounded-lg border flex flex-col gap-0.5 overflow-hidden transition-all duration-300 bg-white/[0.02] ${
      alert ? 'border-rose-500/40 bg-rose-500/5' : 'border-white/[0.05]'
    }`}>
      {/* Background Gradient under sparkline */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 z-0 opacity-50 pointer-events-none">
        <div className={`w-full h-full bg-gradient-to-t ${active ? c.fill : 'from-transparent to-transparent'}`} />
      </div>

      <span className="text-[7px] text-white/50 uppercase tracking-widest font-mono relative z-10 font-bold">{title}</span>
      <div className="flex items-baseline gap-1 relative z-10">
        <span className={`text-sm font-bold font-mono tracking-tight ${alert ? 'text-rose-400' : active ? c.text : 'text-white/40'}`}>
          {valueFormatted}
        </span>
        <span className="text-[7px] text-white/40 font-mono font-medium">{unit}</span>
      </div>

      <div className="h-4 w-full mt-0.5 relative z-10 opacity-90">
        <svg className="w-full h-full drop-shadow-sm overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            className={`${active ? (alert ? 'stroke-rose-400' : c.stroke) : 'stroke-white/20'}`}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

interface SimulationControlsProps {
  isRunning: boolean;
  targetRps: number;
  globalStatus?: 'healthy' | 'degraded' | 'critical';
  bottleneckCount?: number;
  warningCount?: number;
  onToggle: (running: boolean) => void;
  onChangeRps: (rps: number) => void;
}

export function SimulationControls({
  isRunning,
  targetRps,
  globalStatus = 'healthy',
  bottleneckCount = 0,
  warningCount = 0,
  onToggle,
  onChangeRps
}: SimulationControlsProps) {

  const isHighLoad = targetRps > 150000;
  const isMediumLoad = targetRps > 70000;
  const hasEnginePressure = bottleneckCount > 0 || warningCount > 0;
  const effectiveStatus = !isRunning
    ? 'inactive'
    : globalStatus === 'critical'
    ? 'critical'
    : globalStatus === 'degraded' || hasEnginePressure
    ? 'degraded'
    : 'healthy';

  // Base metrics derived from targetRps
  const baseLatency = effectiveStatus === 'critical' ? 72 : effectiveStatus === 'degraded' ? 34 : isHighLoad ? 48 : isMediumLoad ? 19 : 8;
  const baseErrorRate = effectiveStatus === 'critical' ? 8.2 : effectiveStatus === 'degraded' ? 1.25 : isHighLoad ? 4.85 : isMediumLoad ? 0.12 : 0.0;
  const baseQueue = effectiveStatus === 'critical' ? 188 : effectiveStatus === 'degraded' ? 44 : isHighLoad ? 128 : isMediumLoad ? 14 : 0;

  // History hooks
  const tpHistory = useMetricHistory(isRunning ? targetRps : 0, isRunning, 250000, 0.05);
  const latHistory = useMetricHistory(isRunning ? baseLatency : 0, isRunning, 100, 0.15);
  const qHistory = useMetricHistory(isRunning ? baseQueue : 0, isRunning, 200, 0.2);
  const errHistory = useMetricHistory(isRunning ? baseErrorRate : 0, isRunning, 10, 0.3);

  // Overall Health
  const healthStatus = effectiveStatus === 'inactive' ? 'INACTIVE' : effectiveStatus === 'critical' ? 'CRITICAL' : effectiveStatus === 'degraded' ? 'DEGRADED' : 'HEALTHY';
  const healthColor =
    effectiveStatus === 'inactive'
      ? 'bg-white/20'
      : effectiveStatus === 'critical'
      ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)]'
      : effectiveStatus === 'degraded'
      ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
      : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]';

  return (
    <div className={`absolute top-4 right-4 z-45 bg-[#0a0b10]/95 backdrop-blur-xl border rounded-xl p-3 w-[260px] flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 select-none overflow-hidden transition-all duration-500 ${isRunning ? 'border-cyan-500/30 shadow-[0_0_50px_rgba(34,211,238,0.15)]' : 'border-white/[0.08] shadow-2xl'}`}>
      
      {/* Top highlight gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

      {/* HEADER: Datadog / Grafana style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-6 h-6 rounded-md bg-white/[0.03] border border-white/[0.05]">
            <span className={`material-symbols-outlined text-[14px] transition-colors ${isRunning ? 'text-cyan-400 animate-[spin_3s_linear_infinite]' : 'text-white/30'}`}>
              {isRunning ? 'autorenew' : 'dns'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-white/90 font-mono text-[9px] font-bold uppercase tracking-widest leading-none mb-1">
              Live Telemetry
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${healthColor}`} />
              <span className="text-[9px] font-mono tracking-wider text-white/50 uppercase">{healthStatus}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onToggle(!isRunning)}
          className={`relative px-2.5 py-1.5 font-mono text-[7px] tracking-widest uppercase font-bold rounded flex-shrink-0 transition-all cursor-pointer overflow-hidden ${
            isRunning 
              ? 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400' 
              : 'bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-[0.97]'
          }`}
        >
          {isRunning ? 'HALT' : 'INITIATE'}
          {!isRunning && (
            <div className="absolute inset-0 -translate-x-full hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          )}
        </button>
      </div>

      {/* TARGET RPS SLIDER - Datadog styled query bar */}
      <div className="bg-black/40 rounded-lg p-2.5 border border-white/[0.03] space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-[7px] font-mono tracking-widest text-white/40 uppercase">Target Load Gen</span>
          <span className="text-white font-mono font-bold text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-cyan-100">
            {targetRps.toLocaleString()} <span className="text-[7px] text-white/50">RPS</span>
          </span>
        </div>
        
        <div className="relative px-1">
          <input 
            type="range"
            min="0"
            max="250000"
            step="5000"
            value={targetRps}
            onChange={(e) => onChangeRps(parseInt(e.target.value, 10))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-cyan-400 focus:outline-none disabled:opacity-50 hover:accent-cyan-300 transition-all z-10 relative"
          />
          {/* Custom slider track fill */}
          <div 
            className="absolute top-[3px] left-1 h-1.5 bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full pointer-events-none"
            style={{ width: `calc(${(targetRps / 250000) * 100}% - 8px)` }}
          />
        </div>
        
        <div className="flex justify-between text-[8px] font-mono text-white/20 tracking-wider">
          <span>0</span>
          <span>125K</span>
          <span>250K+</span>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 gap-2">
        <DashboardMetric
          title="Throughput"
          valueFormatted={Math.round(tpHistory.currentValue).toLocaleString()}
          unit="req/s"
          points={tpHistory.points}
          colorGroup="cyan"
          active={isRunning}
        />
        <DashboardMetric
          title="Global Latency"
          valueFormatted={latHistory.currentValue.toFixed(1)}
          unit="ms"
          points={latHistory.points}
          colorGroup={isHighLoad ? "amber" : "emerald"}
          active={isRunning}
        />
        <DashboardMetric
          title="Error Rate"
          valueFormatted={errHistory.currentValue.toFixed(2)}
          unit="%"
          points={errHistory.points}
          colorGroup="rose"
          active={isRunning}
          alert={effectiveStatus === 'critical' || effectiveStatus === 'degraded'}
        />
        <DashboardMetric
          title="Queue Depth"
          valueFormatted={Math.round(qHistory.currentValue).toLocaleString()}
          unit="tasks"
          points={qHistory.points}
          colorGroup="violet"
          active={isRunning}
          alert={effectiveStatus === 'critical' || effectiveStatus === 'degraded'}
        />
      </div>

      {/* SYSTEM EVENTS */}
      <div className="border-t border-white/[0.05] pt-2.5 flex items-center justify-between text-[7px] font-mono tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="text-white/30 uppercase">Scaling Action</span>
          <span className={`px-1 py-0.5 rounded text-[6px] ${effectiveStatus === 'critical' || effectiveStatus === 'degraded' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-white/[0.05] text-white/40'}`}>
            {effectiveStatus === 'critical' || effectiveStatus === 'degraded' ? 'AUTO-SCALE UP' : 'STABLE BASELINE'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/30 uppercase">Chaos</span>
          <span className={`flex items-center gap-1 ${effectiveStatus === 'critical' ? 'text-rose-400' : effectiveStatus === 'degraded' ? 'text-amber-400' : 'text-white/40'}`}>
            {effectiveStatus !== 'healthy' && effectiveStatus !== 'inactive' && (
              <div className={`w-1.5 h-1.5 rounded-full animate-ping ${effectiveStatus === 'critical' ? 'bg-rose-400' : 'bg-amber-400'}`} />
            )}
            {effectiveStatus === 'critical' ? 'MULTI_NODE_FAILURE' : effectiveStatus === 'degraded' ? 'CPU_THROTTLE' : 'NONE'}
          </span>
        </div>
      </div>

    </div>
  );
}

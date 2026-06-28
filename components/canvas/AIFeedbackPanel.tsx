'use client';

import React from 'react';

interface AIFeedbackPanelProps {
  onClose: () => void;
}

export function AIFeedbackPanel({ onClose }: AIFeedbackPanelProps) {
  return (
    <aside className="w-[420px] h-full bg-[#060810]/95 backdrop-blur-xl border-l border-white/[0.04] flex flex-col shadow-2xl z-20 relative font-mono text-[9px] uppercase tracking-wider select-none">
      {/* Noise background */}
      <div className="noise-overlay absolute inset-0 pointer-events-none opacity-[0.02]" />

      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.03] flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center text-cyan-400">
            <span className="material-symbols-outlined text-[15px]">smart_toy</span>
          </div>
          <div>
            <h1 className="text-white text-xs font-bold font-mono tracking-widest">AI ARCHITECTURE REVIEW</h1>
            <p className="text-[7px] text-white/20 mt-0.5">SPECIFICATION: #SYS-MUM-ALPHA</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/80 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar z-10">
        {/* Score Overview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3 p-4 rounded-xl border border-white/[0.04] bg-[#0c0d16] flex items-center justify-between relative overflow-hidden">
            <div>
              <p className="text-white/30 text-[8px] font-bold tracking-widest uppercase mb-1">Architecture Score</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-mono font-bold text-white tracking-tight">85</span>
                <span className="text-[10px] text-white/20 font-bold">/ 100</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 flex items-center justify-center" style={{ transform: 'rotate(-45deg)' }}>
              <span className="material-symbols-outlined text-cyan-400 text-[18px]" style={{ transform: 'rotate(45deg)' }}>trending_up</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0c0d16] border border-white/[0.03] text-center">
            <p className="text-[7px] text-white/30 mb-1">RELIABILITY</p>
            <p className="text-emerald-400 font-mono font-bold text-xs">A- GRADE</p>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0c0d16] border border-white/[0.03] text-center">
            <p className="text-[7px] text-white/30 mb-1">EFFICIENCY</p>
            <p className="text-amber-400 font-mono font-bold text-xs">C+ GRADE</p>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0c0d16] border border-white/[0.03] text-center">
            <p className="text-[7px] text-white/30 mb-1">REDUNDANCY</p>
            <p className="text-cyan-400 font-mono font-bold text-xs">ACTIVE</p>
          </div>
        </div>

        {/* Accordions / Detailed Report sections */}
        <div className="space-y-3">
          <p className="text-[8px] font-bold text-white/20 tracking-[0.25em] mb-2 px-1">DETAILED ANALYSIS LOG</p>

          {/* Bottlenecks */}
          <details className="group open:bg-[#0c0d16] bg-[#0c0d16]/30 rounded-lg border border-red-500/20 open:border-red-500/40 transition-all duration-200" open>
            <summary className="flex cursor-pointer items-center justify-between p-3.5 select-none list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-400 text-[15px]">error</span>
                <span className="text-white/80 font-bold text-[9px]">Critical Bottlenecks</span>
              </div>
              <span className="material-symbols-outlined text-white/30 transition-transform group-open:rotate-180 text-[15px]">expand_more</span>
            </summary>
            <div className="px-3.5 pb-3.5 pt-0 text-white/40 space-y-3">
              <div className="pl-4 border-l border-red-500/20 space-y-1">
                <span className="text-red-400/80 text-[8px] font-bold">SEVERITY: HIGH</span>
                <p className="text-white/85 text-[8.5px] leading-relaxed">
                  Single Point of Failure (SPOF) detected at Gateway node.
                </p>
                <p className="text-[7.5px] text-white/20 leading-relaxed mt-0.5">
                  REDUNDANCY IS 0. ANY CONTAINER OUTAGE WILL INTERRUPT 100% OF CONNECTED WEB TRAFFIC.
                </p>
              </div>
              <div className="pl-4 border-l border-amber-500/20 space-y-1">
                <span className="text-amber-400/80 text-[8px] font-bold">SEVERITY: MEDIUM</span>
                <p className="text-white/85 text-[8.5px] leading-relaxed">
                  Latency mismatch between Server and Cache.
                </p>
                <p className="text-[7.5px] text-white/20 leading-relaxed mt-0.5">
                  REDIRECTIONS CAUSE REGIONAL DISCREPANCIES EXCEEDING 15MS ROUND-TRIP TIME.
                </p>
              </div>
            </div>
          </details>

          {/* Scalability */}
          <details className="group open:bg-[#0c0d16] bg-[#0c0d16]/30 rounded-lg border border-white/[0.04] transition-all duration-200">
            <summary className="flex cursor-pointer items-center justify-between p-3.5 select-none list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-[15px]">scale</span>
                <span className="text-white/80 font-bold text-[9px]">Scalability Metrics</span>
              </div>
              <span className="material-symbols-outlined text-white/30 transition-transform group-open:rotate-180 text-[15px]">expand_more</span>
            </summary>
            <div className="px-3.5 pb-3.5 pt-0 text-white/40 space-y-2">
              <div className="pl-4 border-l border-white/[0.06] space-y-1">
                <p className="text-white/85 text-[8.5px] leading-relaxed">
                  Database cluster lacks provisioned read replica pools.
                </p>
                <div className="grid grid-cols-2 gap-1 text-[7.5px] bg-[#080a12] p-2 rounded border border-white/[0.03] mt-2 max-w-xs">
                  <span className="text-white/20">EST. LIMIT</span>
                  <span className="text-white/60 text-right">~5K TPS</span>
                  <span className="text-white/20">SCALE TRIGGER</span>
                  <span className="text-red-400/70 text-right">&gt;10K TPS</span>
                </div>
              </div>
            </div>
          </details>

          {/* Trade-offs */}
          <details className="group open:bg-[#0c0d16] bg-[#0c0d16]/30 rounded-lg border border-white/[0.04] transition-all duration-200">
            <summary className="flex cursor-pointer items-center justify-between p-3.5 select-none list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400 text-[15px]">balance</span>
                <span className="text-white/80 font-bold text-[9px]">Consistency Trade-offs</span>
              </div>
              <span className="material-symbols-outlined text-white/30 transition-transform group-open:rotate-180 text-[15px]">expand_more</span>
            </summary>
            <div className="px-3.5 pb-3.5 pt-0 text-white/40">
              <div className="pl-4 border-l border-white/[0.06]">
                <p className="text-white/80 text-[8.5px] leading-relaxed">
                  Strong Consistency on relational cluster guarantees transaction safety but introduces a ~120ms round-trip latency overhead compared to eventual replicas.
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* Suggestion Block */}
        <div className="pt-2">
          <div className="flex gap-3 bg-[#0c0d16] border border-white/[0.04] p-3.5 rounded-xl items-start">
            <div className="text-white flex items-center justify-center rounded bg-white/[0.02] border border-white/[0.04] shrink-0 w-8 h-8">
              <span className="material-symbols-outlined text-cyan-400 text-[18px]">auto_fix_high</span>
            </div>
            <div className="flex-1 flex flex-col">
              <p className="text-white font-bold mb-1">OPTIMIZATION RECOMMENDATION</p>
              <p className="text-white/40 text-[8px] leading-relaxed mb-3">AI proposes injecting a load balancer node pool and provisioning primary read replicas for relational structures.</p>
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[7.5px] font-mono text-cyan-400 bg-cyan-400/5 px-2 py-0.5 rounded border border-cyan-400/10">+ HA LOAD POOL</span>
                <span className="text-[7.5px] font-mono text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-400/10">- LATENCY</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-white/[0.03] bg-[#0c0d16] shrink-0 z-10">
        <button className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-[10px] font-bold text-black hover:bg-cyan-50 hover:shadow-[0_4px_12px_rgba(34,211,238,0.15)] active:scale-[0.98] transition-all cursor-pointer select-none">
          <span className="material-symbols-outlined text-[15px]">bolt</span>
          <span>Apply Optimizations</span>
        </button>
        <p className="text-center text-[7.5px] text-white/20 mt-3">
          SYSTEMCRAFT ENGINE v2.4.1 · <span className="hover:text-white cursor-pointer underline">RAW ANALYSIS LOG</span>
        </p>
      </div>
    </aside>
  );
}

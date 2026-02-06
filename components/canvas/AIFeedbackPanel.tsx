'use client';

import React from 'react';

interface AIFeedbackPanelProps {
  onClose: () => void;
}

export function AIFeedbackPanel({ onClose }: AIFeedbackPanelProps) {
  return (
    <aside className="w-[480px] h-full bg-[#1a1626]/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl z-20 relative font-display">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          </div>
          <div>
            <h1 className="text-white text-lg font-bold leading-tight tracking-tight">AI Review</h1>
            <p className="text-xs text-gray-400 font-mono">ID: #SYS-2948-ALPHA</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 p-4 rounded-xl border border-white/5 bg-[#231f30]/50 flex items-center justify-between relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Architecture Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">85</span>
                <span className="text-sm text-gray-500 font-medium">/ 100</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary flex items-center justify-center" style={{ transform: 'rotate(-45deg)' }}>
              <span className="material-symbols-outlined text-primary" style={{ transform: 'rotate(45deg)' }}>trending_up</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#231f30]/30 border border-white/5 text-center">
            <p className="text-xs text-gray-400 mb-1">Reliability</p>
            <p className="text-emerald-400 font-mono font-bold">A-</p>
          </div>
          <div className="p-3 rounded-lg bg-[#231f30]/30 border border-white/5 text-center">
            <p className="text-xs text-gray-400 mb-1">Cost Efficiency</p>
            <p className="text-yellow-400 font-mono font-bold">C+</p>
          </div>
        </div>

        {/* Analysis Accordions */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Deep Analysis</h3>

          {/* Bottlenecks (Critical) */}
          <details className="group open:bg-[#231f30]/40 bg-[#231f30]/20 rounded-lg border border-red-500/20 open:border-red-500/40 transition-all duration-200" open>
            <summary className="flex cursor-pointer items-center justify-between p-4 select-none list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500 bg-red-500/10 p-1 rounded">error</span>
                <span className="text-white font-medium text-sm">Bottlenecks</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 transition-transform group-open:rotate-180">expand_more</span>
            </summary>
            <div className="px-4 pb-4 pt-0">
              {/* Issue Item */}
              <div className="pl-10 relative">
                <div className="absolute left-4 top-2 bottom-0 w-px bg-red-500/20"></div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-red-300 bg-red-500/10 px-1.5 py-0.5 rounded">High Severity</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-2">
                    Single Point of Failure (SPOF) detected at <button className="text-primary hover:text-primary/80 font-mono text-xs bg-primary/10 px-1 rounded border border-primary/20 transition-colors cursor-pointer">API_Gateway_Primary</button>.
                  </p>
                  <p className="text-xs text-gray-500">Node redundancy is 0. Any outage here will disconnect 100% of client traffic.</p>
                </div>
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-orange-300 bg-orange-500/10 px-1.5 py-0.5 rounded">Medium Severity</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Latency spike predicted between <span className="font-mono text-xs text-gray-400">Service_A</span> and <span className="font-mono text-xs text-gray-400">Cache_Layer</span> due to region mismatch.
                  </p>
                </div>
              </div>
            </div>
          </details>

          {/* Scalability */}
          <details className="group open:bg-[#231f30]/40 bg-[#231f30]/20 rounded-lg border border-white/5 transition-all duration-200">
            <summary className="flex cursor-pointer items-center justify-between p-4 select-none list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-yellow-500 bg-yellow-500/10 p-1 rounded">scale</span>
                <span className="text-white font-medium text-sm">Scalability Analysis</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 transition-transform group-open:rotate-180">expand_more</span>
            </summary>
            <div className="px-4 pb-4 pt-0">
              <div className="pl-10 relative mt-2">
                <div className="absolute left-4 top-2 bottom-0 w-px bg-white/10"></div>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  <span className="font-mono text-xs text-primary">Relational_DB_Cluster</span> is vertically scaled but lacks read replicas.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-black/20 p-2 rounded border border-white/5">
                  <div className="text-gray-500">Current Est</div>
                  <div className="text-white text-right">~5k TPS</div>
                  <div className="text-gray-500">Risk Threshold</div>
                  <div className="text-red-400 text-right">&gt;10k TPS</div>
                </div>
              </div>
            </div>
          </details>

          {/* Trade-offs */}
          <details className="group open:bg-[#231f30]/40 bg-[#231f30]/20 rounded-lg border border-white/5 transition-all duration-200">
            <summary className="flex cursor-pointer items-center justify-between p-4 select-none list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-400 bg-blue-500/10 p-1 rounded">balance</span>
                <span className="text-white font-medium text-sm">Trade-offs</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 transition-transform group-open:rotate-180">expand_more</span>
            </summary>
            <div className="px-4 pb-4 pt-0">
              <div className="pl-10 relative mt-2">
                <p className="text-gray-300 text-sm leading-relaxed">
                  Using Strong Consistency on <span className="font-mono text-xs text-gray-400">Inventory_DB</span> ensures data accuracy but adds ~200ms latency per write compared to Eventual Consistency models.
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* Suggestion Block */}
        <div className="pt-4 pb-2">
          <div className="flex gap-4 bg-[#231f30]/50 border border-white/5 p-4 rounded-xl items-start">
            <div className="text-white flex items-center justify-center rounded-lg bg-[#2b2839] shrink-0 w-10 h-10 border border-white/5">
              <span className="material-symbols-outlined text-emerald-400 text-xl">auto_fix_high</span>
            </div>
            <div className="flex flex-1 flex-col">
              <p className="text-white text-sm font-medium leading-normal mb-1">Optimization Strategy</p>
              <p className="text-gray-400 text-xs leading-relaxed mb-3">AI suggests introducing a Load Balancer before the API Gateway and enabling Read Replicas for the DB layer.</p>
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-1">
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">+ High Availability</span>
                <span className="text-[10px] font-mono text-blue-300 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">- Latency</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Action Area */}
      <div className="p-6 border-t border-white/10 bg-[#1a1626] shrink-0">
        <button className="w-full group relative flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(71,37,244,0.3)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(71,37,244,0.5)] active:translate-y-0.5 cursor-pointer">
          <span className="material-symbols-outlined text-lg group-hover:animate-pulse">bolt</span>
          Apply Optimizations
        </button>
        <p className="text-center text-[10px] text-gray-500 mt-3 font-mono">
          SystemCraft AI v2.4.1 • <span className="hover:text-gray-300 cursor-pointer underline">View Full Report</span>
        </p>
      </div>
    </aside>
  );
}

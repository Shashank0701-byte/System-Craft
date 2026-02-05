import React from 'react';

export function PropertiesPanel() {
  return (
    <aside className="w-80 flex flex-col border-l border-slate-200 dark:border-border-dark bg-white dark:bg-sidebar-bg-dark z-20 shadow-xl flex-shrink-0">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-border-dark flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: '20px' }}>database</span>
            <h3 className="font-bold text-slate-900 dark:text-white">PostgreSQL Primary</h3>
          </div>
          <p className="text-xs text-slate-500">Relational Database Service</p>
        </div>
        <div className="flex gap-1">
          <button className="size-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-[#2b2839] text-slate-400 transition-colors cursor-pointer">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
          </button>
          <button className="size-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-[#2b2839] text-slate-400 transition-colors cursor-pointer">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>more_horiz</span>
          </button>
        </div>
      </div>

      {/* Properties Form */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Section: Capacity */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Capacity Planning</label>

          <div className="bg-slate-50 dark:bg-[#121118] p-3 rounded-lg border border-slate-200 dark:border-[#2b2839]">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nodes</span>
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <input
              className="w-full h-1.5 bg-slate-200 dark:bg-[#2b2839] rounded-lg appearance-none cursor-pointer accent-primary"
              max="10"
              min="1"
              type="range"
              defaultValue="3"
            />
            <div className="flex justify-between mt-1 text-[10px] text-slate-400">
              <span>1</span>
              <span>10</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#121118] p-3 rounded-lg border border-slate-200 dark:border-[#2b2839]">
            <label className="flex items-center justify-between cursor-pointer mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Storage Size</span>
              <span className="text-xs text-slate-500">500 GB</span>
            </label>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-[#2b2839] rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-2/3"></div>
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-200 dark:bg-border-dark"></div>

        {/* Section: Configuration */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configuration</label>

          {/* Toggle: Read Replicas */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-900 dark:text-white">Read Replicas</span>
              <span className="text-xs text-slate-500">Distribute read traffic</span>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#1a1d21] cursor-pointer">
              <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span>
            </button>
          </div>

          {/* Dropdown: Sharding */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-900 dark:text-white">Sharding Strategy</label>
            <div className="relative">
              <select className="w-full appearance-none bg-slate-50 dark:bg-[#121118] border border-slate-200 dark:border-[#2b2839] text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
                <option>Consistent Hashing</option>
                <option>Range Based</option>
                <option>Directory Based</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none" style={{ fontSize: '20px' }}>expand_more</span>
            </div>
          </div>

          {/* Dropdown: Consistency */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-900 dark:text-white">Consistency Model</label>
            <div className="relative">
              <select className="w-full appearance-none bg-slate-50 dark:bg-[#121118] border border-slate-200 dark:border-[#2b2839] text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
                <option>Strong Consistency</option>
                <option>Eventual Consistency</option>
                <option>Causal Consistency</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none" style={{ fontSize: '20px' }}>expand_more</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-200 dark:bg-border-dark"></div>

        {/* Advanced Alert */}
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-3 items-start">
          <span className="material-symbols-outlined text-yellow-500 shrink-0" style={{ fontSize: '20px' }}>warning</span>
          <div className="space-y-1">
            <p className="text-xs font-bold text-yellow-600 dark:text-yellow-500">High Latency Risk</p>
            <p className="text-[11px] text-yellow-700 dark:text-yellow-600/80 leading-relaxed">
              Synchronous replication across regions may introduce significant latency to write operations.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="p-4 border-t border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-[#121118]">
        <button className="w-full py-2 bg-slate-200 dark:bg-[#2b2839] hover:bg-slate-300 dark:hover:bg-[#3f3b54] text-slate-700 dark:text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">
          Duplicate Component
        </button>
      </div>
    </aside>
  );
}

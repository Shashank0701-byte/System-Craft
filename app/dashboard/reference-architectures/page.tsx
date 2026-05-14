'use client';

import Link from 'next/link';
import { Header } from '@/components/dashboard/Header';
import { REFERENCE_ARCHITECTURES } from '@/src/lib/referenceArchitectures';

const DIFFICULTY_COLORS = {
  easy: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  hard: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

export default function ReferenceArchitecturesPage() {
  return (
    <>
      <Header />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Hero */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[22px]">account_tree</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reference Architectures</h1>
                <p className="text-sm text-slate-500 dark:text-text-muted-dark">
                  Study real-world system designs from top tech companies
                </p>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {REFERENCE_ARCHITECTURES.map((arch) => {
              const colors = DIFFICULTY_COLORS[arch.difficulty];
              return (
                <Link
                  key={arch.id}
                  href={`/dashboard/reference-architectures/${arch.id}`}
                  className="group relative flex flex-col rounded-2xl border border-slate-200 dark:border-border-dark bg-white dark:bg-dashboard-surface hover:border-primary/40 dark:hover:border-primary/40 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-primary/5"
                >
                  {/* Preview area */}
                  <div className="relative h-40 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-background-dark dark:to-dashboard-surface border-b border-slate-200 dark:border-border-dark overflow-hidden">
                    {/* Mini canvas preview dots */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        {/* Show a simplified mini-graph of the first few nodes */}
                        {arch.nodes.slice(0, 5).map((node, i) => {
                          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                          const rx = 55;
                          const ry = 35;
                          const cx = 80 + rx * Math.cos(angle);
                          const cy = 45 + ry * Math.sin(angle);
                          return (
                            <div
                              key={node.id}
                              className="absolute w-7 h-7 rounded-lg bg-white dark:bg-dashboard-card border border-slate-200 dark:border-border-dark flex items-center justify-center shadow-sm group-hover:border-primary/30 transition-colors"
                              style={{ left: `${cx}px`, top: `${cy}px` }}
                            >
                              <span className="material-symbols-outlined text-[14px] text-slate-500 dark:text-text-muted-dark">{node.icon}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Company badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-dashboard-card/80 backdrop-blur-sm border border-slate-200/50 dark:border-border-dark/50">
                      <span className="material-symbols-outlined text-[14px] text-primary">{arch.icon}</span>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{arch.company}</span>
                    </div>
                    {/* Difficulty badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.border} border`}>
                        {arch.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-primary transition-colors">
                      {arch.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-text-muted-dark leading-relaxed line-clamp-2 mb-3">
                      {arch.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {arch.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-dashboard-card text-slate-500 dark:text-text-muted-dark border border-slate-200 dark:border-border-dark"
                        >
                          {tag}
                        </span>
                      ))}
                      {arch.tags.length > 3 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-400 dark:text-text-muted-dark">
                          +{arch.tags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-border-dark">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 dark:text-text-muted-dark flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">hub</span>
                          {arch.nodeCount} nodes
                        </span>
                        <span className="text-xs text-slate-400 dark:text-text-muted-dark flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">timeline</span>
                          {arch.connectionCount} links
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-text-muted-dark group-hover:text-primary transition-colors">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

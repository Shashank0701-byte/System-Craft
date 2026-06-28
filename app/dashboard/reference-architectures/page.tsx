'use client';

import Link from 'next/link';
import { Header } from '@/components/dashboard/Header';
import { REFERENCE_ARCHITECTURES } from '@/src/lib/referenceArchitectures';

const DIFFICULTY_COLORS = {
  easy: { bg: 'bg-[#0c0d16]', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  medium: { bg: 'bg-[#0c0d16]', text: 'text-amber-400', border: 'border-amber-500/30' },
  hard: { bg: 'bg-[#0c0d16]', text: 'text-rose-400', border: 'border-rose-500/30' },
};

export default function ReferenceArchitecturesPage() {
  return (
    <div className="flex flex-col w-full bg-[#060810] overflow-hidden h-screen max-h-screen">
      <Header />
      <div className="flex-1 overflow-y-auto p-6 md:p-8 select-none relative">
        <div className="noise-overlay absolute inset-0 pointer-events-none opacity-40 -z-10" />
        <div className="max-w-[1400px] mx-auto relative z-10">
          {/* Hero */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded border border-white/[0.06] bg-cyan-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-cyan-400 text-[22px]">account_tree</span>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold font-mono tracking-wider text-white uppercase">Reference Architectures</h1>
                <p className="text-white/40 text-xs md:text-sm font-mono tracking-wide mt-1">
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
                  className="group relative flex flex-col rounded-xl border border-white/[0.04] bg-[#0c0d16]/50 hover:bg-[#0c0d16] hover:border-white/[0.12] transition-all duration-300 overflow-hidden hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] cursor-pointer"
                >
                  {/* Preview area */}
                  <div className="relative h-40 bg-[#060810]/50 border-b border-white/[0.04] overflow-hidden">
                    {/* Mini canvas preview dots */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-10" />
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
                              className="absolute w-7 h-7 rounded border border-white/[0.06] bg-[#0c0d16] flex items-center justify-center shadow-sm group-hover:border-cyan-500/30 transition-colors"
                              style={{ left: `${cx}px`, top: `${cy}px` }}
                            >
                              <span className="material-symbols-outlined text-[14px] text-white/50">{node.icon}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Company badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded bg-[#0c0d16]/80 backdrop-blur-sm border border-white/[0.06]">
                      <span className="material-symbols-outlined text-[14px] text-cyan-400">{arch.icon}</span>
                      <span className="text-[9px] font-mono font-bold tracking-widest text-white/80 uppercase">{arch.company}</span>
                    </div>
                    {/* Difficulty badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-widest ${colors.bg} ${colors.text} ${colors.border} border`}>
                        {arch.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/90 mb-2 group-hover:text-cyan-400 transition-colors">
                      {arch.title}
                    </h3>
                    <p className="text-[10px] font-mono text-white/40 leading-relaxed line-clamp-2 mb-4">
                      {arch.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {arch.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest bg-white/[0.02] text-white/40 border border-white/[0.04]"
                        >
                          {tag}
                        </span>
                      ))}
                      {arch.tags.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest text-white/30">
                          +{arch.tags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-dashed border-white/[0.03]">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-mono tracking-widest uppercase text-white/30 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">hub</span>
                          {arch.nodeCount} nodes
                        </span>
                        <span className="text-[9px] font-mono tracking-widest uppercase text-white/30 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">timeline</span>
                          {arch.connectionCount} links
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[14px] text-white/20 group-hover:text-cyan-400 transition-colors group-hover:translate-x-1 transform duration-300">
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
    </div>
  );
}

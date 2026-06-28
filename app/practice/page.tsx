'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { SidebarProvider } from '@/components/dashboard/SidebarContext';
import { getSolvedIds } from '@/src/lib/practice/storage';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';

import { useSidebar } from '@/components/dashboard/SidebarContext';

interface TemplateSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targetRps: number;
}

export default function PracticeDirectory() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch('/api/templates', { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to load templates: ${res.status} ${res.statusText}`);
        const data = await res.json();
        if (!controller.signal.aborted) {
          setTemplates(data.templates || []);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error(err);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    load();

    setSolvedIds(getSolvedIds());

    return () => controller.abort();
  }, [authLoading, isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060810]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border border-white/[0.06] border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-white/40 text-xs font-mono tracking-widest uppercase">Initializing access…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <PracticeDirectoryContent
        templates={templates}
        solvedIds={solvedIds}
        loading={loading}
      />
    </SidebarProvider>
  );
}

function PracticeDirectoryContent({
  templates,
  solvedIds,
  loading
}: {
  templates: TemplateSummary[];
  solvedIds: string[];
  loading: boolean;
}) {
  const { toggle } = useSidebar();

  return (
    <div className="flex flex-1 w-full h-screen overflow-hidden bg-[#060810] select-none">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile top header with Sidebar toggle */}
        <header className="md:hidden flex h-14 shrink-0 items-center border-b border-white/[0.04] bg-[#0c0d16] px-6 z-10 select-none">
          <button
            onClick={toggle}
            className="p-2 -ml-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.02] transition-colors cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <span className="material-symbols-outlined text-[20px] block">menu</span>
          </button>
          <span className="ml-3 text-[11px] font-mono font-bold tracking-wider text-white uppercase">Practice Sandbox</span>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-[1400px] mx-auto space-y-8 relative">
            {/* Noise background */}
            <div className="noise-overlay absolute inset-0 pointer-events-none opacity-40" />

            {/* Hero banner */}
            <div className="rounded-xl overflow-hidden relative h-48 border border-white/[0.04]">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(90deg, rgba(6, 8, 16, 0.95) 0%, rgba(6, 8, 16, 0.4) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAtRCSQVb85JQmudFxAKJIoRZ1HrjnneYx8sbPH3GzvF2r4op963-jOIHluHug-c-ucKm3gdfrRO3KFJxjObGWteeHHVlw_SG72JMnknbSKzens7TpkiSyF-YNRVGlXgXS0comNoGjDvb2g2LsjQFu7FNkAe9Lf3UfTGou4rPnE_KgoJk3tHtQIrNDa-NTtPKnDGwEKd7gE2AcFKXPyYq8a6kTfy9yvOOs3fxUcvozOaNh9fSR-qXKoMBwYws0EhV3BdHqvQnhc6wxA")' }}></div>
              <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-10 z-10">
                <h2 className="text-xl md:text-2xl font-bold font-mono tracking-wider text-white uppercase mb-2">Targeted System Design Practice</h2>
                <p className="text-white/40 max-w-xl text-xs md:text-sm font-mono tracking-wide">
                  Fix broken architectures under load. Focus on specific patterns like caching,
                  horizontal scaling, and load balancing without the overhead of a full interview.
                </p>
                {solvedIds.length > 0 && (
                  <p className="text-emerald-400 text-[10px] font-mono tracking-widest uppercase mt-4">
                    ✅ {solvedIds.length} / {templates.length || '...'} exercises completed
                  </p>
                )}
              </div>
            </div>

            <h3 className="text-sm font-bold font-mono tracking-wider text-white/95 uppercase">Available Exercises</h3>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="h-64 rounded-xl bg-white/[0.01] border border-white/[0.04] animate-pulse"></div>
                 ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* AI Exercise Card */}
                <div className="group relative overflow-hidden rounded-xl border border-dashed border-white/[0.06] hover:border-cyan-500/25 bg-[#0c0d16]/10 hover:bg-white/[0.01] p-6 flex flex-col justify-center items-center text-center min-h-[220px] transition-all duration-300">
                   <div className="size-10 rounded-lg border border-white/[0.05] bg-white/[0.02] flex items-center justify-center group-hover:border-cyan-500/25 group-hover:bg-cyan-500/[0.02] transition-all duration-300 mb-4">
                      <span className="material-symbols-outlined text-white/30 group-hover:text-cyan-400 transition-colors text-[20px]">smart_toy</span>
                   </div>
                   <h3 className="text-xs font-bold font-mono text-white/80 uppercase tracking-wider mb-2 group-hover:text-white transition-colors">Generate Custom Exercise</h3>
                   <p className="text-[10px] font-mono text-white/25 leading-normal mb-4">Uses AI to generate a brand new unique bottleneck scenario.</p>
                   <span className="inline-flex items-center gap-1.5 rounded bg-cyan-500/10 px-2 py-0.5 text-[8px] font-mono uppercase tracking-widest text-cyan-400 border border-cyan-500/20">
                     Coming Soon
                   </span>
                </div>

                {/* Curated Templates */}
                {templates.map(template => {
                  const templateSolved = solvedIds.includes(template.id);
                  return (
                    <Link href={`/practice/${template.id}`} key={template.id} className={`group flex flex-col justify-between rounded-xl bg-[#0c0d16]/30 border border-white/[0.04] hover:border-white/[0.12] hover:bg-[#0c0d16]/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 overflow-hidden cursor-pointer min-h-[220px] select-none relative ${
                      templateSolved 
                        ? 'border-emerald-500/20 hover:border-emerald-500/40' 
                        : ''
                    }`}>
                      {/* Solved checkmark overlay */}
                      {templateSolved && (
                        <div className="absolute top-4 right-4 z-10">
                          <span className="material-symbols-outlined text-emerald-400 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </div>
                      )}
                      <div className="p-6 relative z-10 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-widest border ${
                             template.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                             template.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                             'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {template.difficulty}
                          </span>
                          <span className="text-[8px] font-mono tracking-widest uppercase text-white/20">{template.category}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white/90 font-mono tracking-wider uppercase mb-2 group-hover:text-cyan-400 transition-colors">{template.title}</h3>
                        <p className="text-[10px] font-mono text-white/30 line-clamp-3 leading-relaxed">
                          {template.description}
                        </p>
                      </div>
                      <div className="px-6 py-4 border-t border-dashed border-white/[0.03] bg-[#0c0d16]/40 flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-cyan-400">
                         <span>{templateSolved ? 'Review Solution' : 'Start Drill'}</span>
                         <span className="material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-1">arrow_forward</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { SidebarProvider } from '@/components/dashboard/SidebarContext';
import { getSolvedIds } from '@/src/lib/practice/storage';

interface TemplateSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targetRps: number;
}

export default function PracticeDirectory() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);

  useEffect(() => {
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
  }, []);

  return (
    <SidebarProvider>
      <div className="flex flex-1 w-full h-screen overflow-hidden bg-background-light dark:bg-dashboard-bg">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="max-w-5xl mx-auto space-y-8">

              {/* Hero banner */}
              <div className="rounded-xl overflow-hidden relative h-48">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(90deg, rgba(19, 16, 34, 0.9) 0%, rgba(19, 16, 34, 0.6) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAtRCSQVb85JQmudFxAKJIoRZ1HrjnneYx8sbPH3GzvF2r4op963-jOIHluHug-c-ucKm3gdfrRO3KFJxjObGWteeHHVlw_SG72JMnknbSKzens7TpkiSyF-YNRVGlXgXS0comNoGjDvb2g2LsjQFu7FNkAe9Lf3UfTGou4rPnE_KgoJk3tHtQIrNDa-NTtPKnDGwEKd7gE2AcFKXPyYq8a6kTfy9yvOOs3fxUcvozOaNh9fSR-qXKoMBwYws0EhV3BdHqvQnhc6wxA")' }}></div>
                <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Targeted System Design Practice</h2>
                  <p className="text-slate-300 max-w-xl text-sm md:text-base">
                    Fix broken architectures under load. Focus on specific patterns like caching,
                    horizontal scaling, and load balancing without the overhead of a full interview.
                  </p>
                  {solvedIds.length > 0 && (
                    <p className="text-emerald-400 text-sm mt-3 font-medium">
                      ✅ {solvedIds.length} / {templates.length || '...'} exercises completed
                    </p>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Available Exercises</h3>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="h-64 rounded-2xl bg-slate-200 dark:bg-sidebar-bg animate-pulse"></div>
                   ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* AI Exercise Card */}
                  <div className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 flex flex-col justify-center items-center text-center min-h-[220px]">
                     <div className="bg-primary/20 text-primary p-4 rounded-full mb-4">
                        <span className="material-symbols-outlined text-3xl">smart_toy</span>
                     </div>
                     <h3 className="text-lg font-bold text-white mb-2">Generate Custom Exercise</h3>
                     <p className="text-sm text-text-muted-dark mb-4">Uses AI to generate a brand new unique bottleneck scenario.</p>
                     <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                       Coming Soon
                     </span>
                  </div>

                  {/* Curated Templates */}
                  {templates.map(template => {
                    const templateSolved = solvedIds.includes(template.id);
                    return (
                      <Link href={`/practice/${template.id}`} key={template.id} className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-sidebar-bg p-6 hover:shadow-xl transition-all min-h-[220px] ${
                        templateSolved 
                          ? 'border-emerald-500/30 hover:border-emerald-500/50' 
                          : 'border-border-dark hover:border-slate-600'
                      }`}>
                        {/* Solved checkmark overlay */}
                        {templateSolved && (
                          <div className="absolute top-4 right-4">
                            <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          </div>
                        )}
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                               template.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-600/20' :
                               template.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400 ring-yellow-600/20' :
                               'bg-red-500/10 text-red-400 ring-red-600/20'
                            }`}>
                              {template.difficulty.toUpperCase()}
                            </span>
                            <span className="text-xs font-medium text-slate-500">{template.category}</span>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{template.title}</h3>
                          <p className="text-sm text-text-muted-dark line-clamp-3">
                            {template.description}
                          </p>
                        </div>
                        <div className="mt-6 flex items-center justify-between text-sm font-medium text-primary">
                           <span>{templateSolved ? 'Review Solution' : 'Start Drill'}</span>
                           <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
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
    </SidebarProvider>
  );
}

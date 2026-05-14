'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/dashboard/Header';
import { DesignCanvas } from '@/components/canvas/DesignCanvas';
import { REFERENCE_ARCHITECTURES } from '@/src/lib/referenceArchitectures';

const DIFFICULTY_COLORS = {
  easy: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  hard: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ReferenceArchitectureDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const arch = useMemo(
    () => REFERENCE_ARCHITECTURES.find((a) => a.id === id),
    [id]
  );

  if (!arch) {
    return (
      <>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
            <h2 className="text-xl font-bold text-white mb-2">Not Found</h2>
            <p className="text-slate-400 mb-6">This reference architecture doesn&apos;t exist.</p>
            <Link
              href="/dashboard/reference-architectures"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
            >
              Back to Gallery
            </Link>
          </div>
        </div>
      </>
    );
  }

  const colors = DIFFICULTY_COLORS[arch.difficulty];

  return (
    <>
      <Header />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-slate-200 dark:border-border-dark bg-white dark:bg-sidebar-bg-dark flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard/reference-architectures"
              className="flex items-center gap-1 text-sm text-slate-400 dark:text-text-muted-dark hover:text-primary transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Gallery
            </Link>
            <span className="text-slate-300 dark:text-border-dark flex-shrink-0">/</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0">{arch.icon}</span>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">{arch.title}</h1>
              <span className="text-xs text-slate-400 dark:text-text-muted-dark flex-shrink-0">by {arch.company}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.border} border`}>
              {arch.difficulty}
            </span>
            <span className="text-xs text-slate-400 dark:text-text-muted-dark flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">hub</span>
              {arch.nodeCount} nodes
            </span>
            <span className="text-xs text-slate-400 dark:text-text-muted-dark flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">timeline</span>
              {arch.connectionCount} links
            </span>
          </div>
        </div>

        {/* Canvas + Annotations panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Read-only canvas */}
          <div className="flex-1 flex flex-col relative">
            <DesignCanvas
              initialNodes={arch.nodes}
              initialConnections={arch.connections}
              readOnly={true}
            />
            {/* Read-only indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-dashboard-card/90 backdrop-blur-sm border border-border-dark shadow-lg">
                <span className="material-symbols-outlined text-primary text-[16px]">visibility</span>
                <span className="text-xs text-slate-300 font-medium">Read-Only Reference</span>
              </div>
            </div>
          </div>

          {/* Annotations Panel */}
          <div className="w-[340px] flex-shrink-0 border-l border-slate-200 dark:border-border-dark bg-white dark:bg-sidebar-bg-dark overflow-y-auto">
            <div className="p-5">
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-text-muted-dark uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">description</span>
                  Overview
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {arch.description}
                </p>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-text-muted-dark uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">sell</span>
                  Key Concepts
                </h3>
                <div className="flex flex-wrap gap-2">
                  {arch.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Annotations */}
              <div>
                <h3 className="text-xs font-bold text-text-muted-dark uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                  Design Annotations
                </h3>
                <div className="space-y-3">
                  {arch.annotations.map((annotation, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-dashboard-card p-4"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                          {annotation.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-text-muted-dark leading-relaxed pl-7">
                        {annotation.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

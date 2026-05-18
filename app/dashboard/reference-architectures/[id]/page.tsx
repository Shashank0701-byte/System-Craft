'use client';

import { use, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/components/dashboard/Header';
import { DesignCanvas } from '@/components/canvas/DesignCanvas';
import { REFERENCE_ARCHITECTURES } from '@/src/lib/referenceArchitectures';

const DIFFICULTY_COLORS = {
  easy: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  hard: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

type PanelView = 'annotations' | 'analysis';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ReferenceArchitectureDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const arch = useMemo(
    () => REFERENCE_ARCHITECTURES.find((a) => a.id === id),
    [id]
  );

  const [panelView, setPanelView] = useState<PanelView>('annotations');
  const [analysisContent, setAnalysisContent] = useState('');
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerateAnalysis = useCallback(async () => {
    if (!arch || isAnalysing) return;

    setPanelView('analysis');
    setIsAnalysing(true);
    setAnalysisError(null);
    setAnalysisContent('');

    // Abort previous request if any
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/reference-architectures/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: arch.title,
          company: arch.company,
          description: arch.description,
          tags: arch.tags,
          nodes: arch.nodes,
          connections: arch.connections,
          annotations: arch.annotations,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setAnalysisContent(accumulated);
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      console.error('Analysis error:', error);
      setAnalysisError((error as Error).message || 'Failed to generate analysis');
    } finally {
      setIsAnalysing(false);
    }
  }, [arch, isAnalysing]);

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
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
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
            {/* Deep Analysis Button */}
            <button
              onClick={handleGenerateAnalysis}
              disabled={isAnalysing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                panelView === 'analysis'
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
              } ${isAnalysing ? 'opacity-70 cursor-wait' : ''}`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isAnalysing ? 'progress_activity' : 'psychology'}
              </span>
              {isAnalysing ? 'Analysing...' : 'Deep Analysis'}
            </button>
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

        {/* Canvas + Side panel */}
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

          {/* Right Panel */}
          <div className="w-[420px] flex-shrink-0 border-l border-slate-200 dark:border-border-dark bg-white dark:bg-sidebar-bg-dark flex flex-col overflow-hidden">
            {/* Panel tabs */}
            <div className="flex border-b border-slate-200 dark:border-border-dark flex-shrink-0">
              <button
                onClick={() => setPanelView('annotations')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                  panelView === 'annotations'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-slate-400 dark:text-text-muted-dark hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                Annotations
              </button>
              <button
                onClick={() => {
                  setPanelView('analysis');
                  if (!analysisContent && !isAnalysing) handleGenerateAnalysis();
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                  panelView === 'analysis'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-slate-400 dark:text-text-muted-dark hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">psychology</span>
                AI Analysis
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto p-5">
              {panelView === 'annotations' ? (
                <AnnotationsPanel arch={arch} />
              ) : (
                <AnalysisPanel
                  content={analysisContent}
                  isLoading={isAnalysing}
                  error={analysisError}
                  onRetry={handleGenerateAnalysis}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Annotations Panel ────────────────────────────────────────────── */

function AnnotationsPanel({ arch }: { arch: (typeof REFERENCE_ARCHITECTURES)[number] }) {
  return (
    <>
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
    </>
  );
}

/* ── AI Analysis Panel ────────────────────────────────────────────── */

function AnalysisPanel({
  content,
  isLoading,
  error,
  onRetry,
}: {
  content: string;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  // Empty state — not yet triggered
  if (!content && !isLoading && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-primary text-[28px]">psychology</span>
        </div>
        <h3 className="text-sm font-bold text-white mb-1">AI Deep Analysis</h3>
        <p className="text-xs text-text-muted-dark leading-relaxed max-w-[240px] mb-4">
          Generate a comprehensive breakdown of this architecture&apos;s data flow, trade-offs, and failure modes.
        </p>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors cursor-pointer shadow-lg shadow-primary/25"
        >
          <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
          Generate Analysis
        </button>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <span className="material-symbols-outlined text-red-400 text-4xl mb-3">error</span>
        <h3 className="text-sm font-bold text-white mb-1">Analysis Failed</h3>
        <p className="text-xs text-text-muted-dark mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Streaming indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <span className="material-symbols-outlined text-primary text-[14px] animate-spin">progress_activity</span>
          <span className="text-[11px] text-primary font-medium">Generating analysis...</span>
        </div>
      )}

      {/* Rendered markdown content */}
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />

      {/* Blinking cursor while streaming */}
      {isLoading && (
        <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse rounded-sm ml-0.5" />
      )}
    </div>
  );
}

/* ── Minimal Markdown Renderer ────────────────────────────────────── */

function renderMarkdown(md: string): string {
  // Styles
  const h3Style = 'font-size:12px;font-weight:700;color:#e2e8f0;text-transform:uppercase;letter-spacing:0.05em;margin:14px 0 6px;padding-bottom:5px;border-bottom:1px solid rgba(255,255,255,0.08)';
  const pStyle = 'font-size:12px;line-height:1.6;color:#94a3b8;margin:3px 0';
  const ulStyle = 'margin:4px 0;padding-left:4px;list-style:none';
  const liStyle = 'font-size:12px;line-height:1.5;color:#94a3b8;margin:2px 0;padding-left:14px;position:relative';
  const strongStyle = 'color:#e2e8f0;font-weight:600';
  const codeStyle = 'background:rgba(71,37,244,0.1);color:#818cf8;padding:1px 5px;border-radius:4px;font-size:11px';

  return md
    // Headers
    .replace(/^### (.+)$/gm, `<h3 style="${h3Style}">$1</h3>`)
    .replace(/^## (.+)$/gm, `<h3 style="${h3Style}">$1</h3>`)
    .replace(/^# (.+)$/gm, `<h3 style="${h3Style}">$1</h3>`)
    // Bold (before italic to avoid conflicts)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="${strongStyle}">$1</strong>`)
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, `<code style="${codeStyle}">$1</code>`)
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, `<li style="${liStyle}"><span style="position:absolute;left:0;top:7px;width:4px;height:4px;border-radius:50%;background:#4725f4"></span>$1</li>`)
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, `<li style="${liStyle}"><span style="position:absolute;left:0;top:7px;width:4px;height:4px;border-radius:50%;background:#4725f4"></span>$1</li>`)
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, `<ul style="${ulStyle}">$1</ul>`)
    // Paragraphs (lines that aren't already wrapped in tags)
    .replace(/^(?!<[huol])((?!<).+)$/gm, `<p style="${pStyle}">$1</p>`)
    // Clean up extra line breaks
    .replace(/\n\n/g, '')
    .replace(/\n/g, '');
}


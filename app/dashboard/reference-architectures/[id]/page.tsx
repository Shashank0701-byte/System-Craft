'use client';

import { use, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/components/dashboard/Header';
import { DesignCanvas } from '@/components/canvas/DesignCanvas';
import { REFERENCE_ARCHITECTURES } from '@/src/lib/referenceArchitectures';
import { KnowledgeCheck, QuizQuestion } from '@/components/dashboard/KnowledgeCheck';
import { authFetch } from '@/src/lib/firebase/authClient';

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
  
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const handleQuizPass = useCallback(async () => {
    try {
      const response = await authFetch('/api/user/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'reference_architecture_completed' }),
      });
      if (!response.ok) {
        throw new Error(`Failed to track completion (${response.status})`);
      }
      setIsQuizCompleted(true);
    } catch (err) {
      console.error('Failed to track completion:', err);
    }
  }, []);

  const triggerQuizGeneration = useCallback(async (analysisText: string) => {
    if (!arch) return;
    setQuizError(null);
    try {
      const response = await fetch('/api/reference-architectures/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: arch.title, analysis: analysisText }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.questions) {
          setQuizQuestions(data.questions);
        }
      } else {
        console.error('Failed to generate knowledge check');
        setQuizError('Failed to generate knowledge check');
      }
    } catch (err) {
      console.error(err);
      setQuizError('Failed to generate knowledge check');
    }
  }, [arch]);

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
      
      triggerQuizGeneration(accumulated);
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      console.error('Analysis error:', error);
      setAnalysisError((error as Error).message || 'Failed to generate analysis');
    } finally {
      setIsAnalysing(false);
    }
  }, [arch, isAnalysing, triggerQuizGeneration]);

  if (!arch) {
    return (
      <div className="flex flex-col flex-1 w-full bg-[#060810] overflow-hidden">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-rose-400 mb-4">error</span>
            <h2 className="text-xl font-mono font-bold tracking-widest text-white mb-2 uppercase">Not Found</h2>
            <p className="text-slate-400 mb-6 font-mono text-xs uppercase tracking-wider">This reference architecture doesn&apos;t exist.</p>
            <Link
              href="/dashboard/reference-architectures"
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded font-mono text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Back to Gallery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const colors = DIFFICULTY_COLORS[arch.difficulty];

  return (
    <div className="flex flex-col w-full bg-[#060810] overflow-hidden h-screen max-h-screen">
      <Header />
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 select-none">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-white/[0.04] bg-[#0c0d16] flex-shrink-0 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard/reference-architectures"
              className="flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase text-white/40 hover:text-cyan-400 transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              Gallery
            </Link>
            <span className="text-white/20 flex-shrink-0">/</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-cyan-400 text-[18px] flex-shrink-0">{arch.icon}</span>
              <h1 className="text-sm font-mono font-bold tracking-wider text-white truncate uppercase">{arch.title}</h1>
              <span className="text-[10px] font-mono tracking-widest uppercase text-white/40 flex-shrink-0">by {arch.company}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 font-mono">
            {/* Deep Analysis Button */}
            <button
              onClick={handleGenerateAnalysis}
              disabled={isAnalysing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer ${
                panelView === 'analysis'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25'
                  : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20'
              } ${isAnalysing ? 'opacity-70 cursor-wait' : ''}`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {isAnalysing ? 'progress_activity' : 'psychology'}
              </span>
              {isAnalysing ? 'Analysing...' : 'Deep Analysis'}
            </button>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${colors.bg} ${colors.text} ${colors.border} border`}>
              {arch.difficulty}
            </span>
            <span className="text-[10px] tracking-widest uppercase text-white/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">hub</span>
              {arch.nodeCount} nodes
            </span>
            <span className="text-[10px] tracking-widest uppercase text-white/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">timeline</span>
              {arch.connectionCount} links
            </span>
          </div>
        </div>

        {/* Canvas + Side panel */}
        <div className="flex flex-1 overflow-hidden min-h-0 relative">
          {/* Read-only canvas */}
          <div className="flex-1 flex flex-col min-h-0 relative bg-[#060810]">
            <div className="noise-overlay absolute inset-0 pointer-events-none opacity-40 z-0" />
            <DesignCanvas
              initialNodes={arch.nodes}
              initialConnections={arch.connections}
              readOnly={true}
            />
            {/* Read-only indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#0c0d16]/90 backdrop-blur-md border border-white/[0.04] shadow-xl">
                <span className="material-symbols-outlined text-cyan-400 text-[14px]">visibility</span>
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-white/70">Read-Only Reference</span>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-[420px] flex-shrink-0 border-l border-white/[0.04] bg-[#0c0d16] flex flex-col overflow-hidden min-h-0 relative z-10">
            {/* Panel tabs */}
            <div className="flex border-b border-white/[0.04] flex-shrink-0">
              <button
                onClick={() => setPanelView('annotations')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-[10px] font-mono font-bold tracking-widest uppercase transition-colors cursor-pointer ${
                  panelView === 'annotations'
                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                    : 'text-white/40 hover:text-white/80'
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
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-[10px] font-mono font-bold tracking-widest uppercase transition-colors cursor-pointer ${
                  panelView === 'analysis'
                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">psychology</span>
                AI Analysis
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/[0.1] scrollbar-track-transparent">
              {panelView === 'annotations' ? (
                <AnnotationsPanel arch={arch} />
              ) : (
                <AnalysisPanel
                  content={analysisContent}
                  isLoading={isAnalysing}
                  error={analysisError}
                  onRetry={handleGenerateAnalysis}
                  quizQuestions={quizQuestions}
                  showQuiz={showQuiz}
                  setShowQuiz={setShowQuiz}
                  onQuizPass={handleQuizPass}
                  isQuizCompleted={isQuizCompleted}
                  quizError={quizError}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Annotations Panel ────────────────────────────────────────────── */

function AnnotationsPanel({ arch }: { arch: (typeof REFERENCE_ARCHITECTURES)[number] }) {
  return (
    <>
      {/* Description */}
      <div className="mb-8">
        <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">description</span>
          Overview
        </h3>
        <p className="text-[11px] font-mono text-white/70 leading-relaxed">
          {arch.description}
        </p>
      </div>

      {/* Tags */}
      <div className="mb-8">
        <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">sell</span>
          Key Concepts
        </h3>
        <div className="flex flex-wrap gap-2">
          {arch.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 rounded text-[9px] font-mono uppercase tracking-widest font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Annotations */}
      <div>
        <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">lightbulb</span>
          Design Annotations
        </h3>
        <div className="space-y-4">
          {arch.annotations.map((annotation, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 hover:border-white/[0.08] transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="w-5 h-5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold flex items-center justify-center flex-shrink-0 mt-0.5 border border-cyan-500/20">
                  {i + 1}
                </span>
                <h4 className="text-[11px] font-mono font-bold text-white/90 leading-tight uppercase tracking-wide">
                  {annotation.title}
                </h4>
              </div>
              <p className="text-[11px] font-mono text-white/50 leading-relaxed pl-8">
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
  quizQuestions,
  showQuiz,
  setShowQuiz,
  onQuizPass,
  isQuizCompleted,
  quizError
}: {
  content: string;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  quizQuestions: QuizQuestion[] | null;
  showQuiz: boolean;
  setShowQuiz: (v: boolean) => void;
  onQuizPass: () => void;
  isQuizCompleted: boolean;
  quizError: string | null;
}) {
  // Empty state — not yet triggered
  if (!content && !isLoading && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div className="size-12 rounded border border-white/[0.06] bg-cyan-500/10 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-cyan-400 text-[24px]">psychology</span>
        </div>
        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest mb-2">AI Deep Analysis</h3>
        <p className="text-[10px] font-mono text-white/40 leading-relaxed max-w-[240px] mb-6">
          Generate a comprehensive breakdown of this architecture&apos;s data flow, trade-offs, and failure modes.
        </p>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 rounded bg-cyan-500 text-black text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-cyan-400 transition-colors cursor-pointer shadow-lg shadow-cyan-500/25"
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
        <span className="material-symbols-outlined text-rose-400 text-3xl mb-3">error</span>
        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest mb-2">Analysis Failed</h3>
        <p className="text-[10px] font-mono text-white/40 mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 rounded border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Retry
        </button>
      </div>
    );
  }

  if (showQuiz && quizQuestions) {
    return (
      <div className="font-mono pt-4">
        <button
          onClick={() => setShowQuiz(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-white/50 text-[10px] uppercase tracking-widest font-bold mb-6 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          Back to Analysis
        </button>
        <KnowledgeCheck questions={quizQuestions} onPass={onQuizPass} />
      </div>
    );
  }

  return (
    <div className="font-mono relative pb-20">
      {/* Streaming indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded bg-cyan-500/5 border border-cyan-500/20">
          <span className="material-symbols-outlined text-cyan-400 text-[14px] animate-spin">progress_activity</span>
          <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Generating analysis...</span>
        </div>
      )}

      {/* Rendered markdown content — sanitized to prevent XSS from model output */}
      <div className="markdown-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderMarkdown(escapeHtml(content))) }} />

      {/* Blinking cursor while streaming */}
      {isLoading && (
        <span className="inline-block w-1.5 h-3.5 bg-cyan-400 animate-pulse rounded-sm ml-0.5" />
      )}
      
      {/* Knowledge Check Action */}
      {!isLoading && content && (
        <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col items-center justify-center text-center">
          {isQuizCompleted ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase">Verified Studied</span>
            </div>
          ) : quizQuestions ? (
            <>
              <h4 className="text-[11px] font-bold text-white uppercase tracking-widest mb-2">Ready to verify?</h4>
              <p className="text-[10px] text-white/40 mb-4 max-w-[260px]">
                Pass a short 5-question knowledge check to mark this architecture as studied.
              </p>
              <button
                onClick={() => setShowQuiz(true)}
                className="px-6 py-2.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-500/20 transition-colors"
              >
                Take Knowledge Check
              </button>
            </>
          ) : quizError ? (
            <div className="flex flex-col items-center gap-3 text-rose-400">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span className="text-[10px] font-mono uppercase tracking-widest">{quizError}</span>
              <button
                onClick={() => setShowQuiz(false)}
                className="px-4 py-2 rounded border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors"
              >
                Back to Analysis
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white/40">
              <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
              <span className="text-[10px] font-mono uppercase tracking-widest">Preparing knowledge check...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ── Minimal Markdown Renderer ────────────────────────────────────── */

function renderMarkdown(md: string): string {
  // Styles
  const h3Style = 'font-size:11px;font-weight:700;color:rgba(255,255,255,0.9);text-transform:uppercase;letter-spacing:0.1em;margin:24px 0 12px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.06)';
  const pStyle = 'font-size:11px;line-height:1.7;color:rgba(255,255,255,0.6);margin:8px 0';
  const ulStyle = 'margin:12px 0;padding-left:4px;list-style:none';
  const liStyle = 'font-size:11px;line-height:1.6;color:rgba(255,255,255,0.6);margin:6px 0;padding-left:16px;position:relative';
  const strongStyle = 'color:rgba(255,255,255,0.9);font-weight:700';
  const codeStyle = 'background:rgba(255,255,255,0.05);color:#22d3ee;padding:2px 6px;border-radius:4px;font-size:10px;border:1px solid rgba(255,255,255,0.1)';

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
    .replace(/^[-*] (.+)$/gm, `<li style="${liStyle}"><span style="position:absolute;left:0;top:7px;width:4px;height:4px;border-radius:50%;background:#22d3ee"></span>$1</li>`)
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, `<li style="${liStyle}"><span style="position:absolute;left:0;top:7px;width:4px;height:4px;border-radius:50%;background:#22d3ee"></span>$1</li>`)
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, `<ul style="${ulStyle}">$1</ul>`)
    // Paragraphs (lines that aren't already wrapped in tags)
    .replace(/^(?!<[huol])((?!<).+)$/gm, `<p style="${pStyle}">$1</p>`)
    // Clean up extra line breaks
    .replace(/\n\n/g, '')
    .replace(/\n/g, '');
}

/* ── HTML Sanitizer (allowlist-based) ─────────────────────────────── */

const ALLOWED_TAGS = new Set(['h3', 'p', 'ul', 'li', 'strong', 'em', 'code', 'span', 'br']);

function sanitizeHtml(html: string): string {
  return html
    // Remove <script> blocks entirely
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    // Remove event handler attributes (onclick, onerror, onload, etc.)
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+on\w+\s*=\s*\S+/gi, '')
    // Remove javascript: protocol URLs
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')
    // Remove any tags not in the allowlist
    .replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
      return ALLOWED_TAGS.has(tag.toLowerCase()) ? match : '';
    });
}

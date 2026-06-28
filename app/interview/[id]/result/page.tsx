'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { authFetch } from '@/src/lib/firebase/authClient';
import { IInterviewQuestion, IEvaluation, IRuleResult, IConstraintChange } from '@/src/lib/db/models/InterviewSession';
import { DesignCanvas, CanvasNode, Connection } from '@/components/canvas/DesignCanvas';

interface InterviewSessionData {
    id: string;
    question: IInterviewQuestion;
    difficulty: 'easy' | 'medium' | 'hard';
    status: string;
    evaluation: IEvaluation;
    canvasSnapshot: {
        nodes: CanvasNode[];
        connections: Connection[];
    };
    aiMessages?: {
        role: 'interviewer' | 'candidate';
        content: string;
        timestamp: string;
    }[];
    constraintChanges?: IConstraintChange[];
    startedAt: string;
    timeLimit: number;
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function InterviewResultPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth();
    const [session, setSession] = useState<InterviewSessionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const isEvaluatingRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        let pollTimer: NodeJS.Timeout;
        let pollAttempts = 0;
        const MAX_POLLS = 40; // 40 * 3000ms = 2 mins timeout limit

        const fetchResult = async () => {
            if (!user?.uid || !id) return;
            try {
                if (!isEvaluatingRef.current) setIsLoading(true);
                const response = await authFetch(`/api/interview/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to load results');
                }
                const data = await response.json();

                if (cancelled) return;

                if (data.session.status === 'evaluated') {
                    // Evaluation complete — show results
                    isEvaluatingRef.current = false;
                    setIsEvaluating(false);
                    setSession(data.session);
                    setIsLoading(false);
                    return; // stop polling
                }

                if (['submitted', 'evaluating'].includes(data.session.status)) {
                    pollAttempts++;
                    if (pollAttempts >= MAX_POLLS) {
                        isEvaluatingRef.current = false;
                        setIsEvaluating(false);
                        setIsLoading(false);
                        setError('Evaluation is taking longer than expected. Please go back and try re-evaluating.');
                        return;
                    }

                    // Still evaluating — show spinner and poll again
                    isEvaluatingRef.current = true;
                    setIsEvaluating(true);
                    setIsLoading(false);
                    pollTimer = setTimeout(fetchResult, 3000);
                    return;
                }

                // in_progress — shouldn't be on this page
                if (data.session.status === 'in_progress') {
                    router.replace(`/interview/${id}`);
                    return;
                }
            } catch (err) {
                if (cancelled) return;
                console.error('Error fetching results:', err);
                setError(err instanceof Error ? err.message : 'Failed to load results');
                setIsLoading(false);
                isEvaluatingRef.current = false;
                setIsEvaluating(false);
            }
        };

        if (isAuthenticated && user) {
            fetchResult();
        }

        return () => {
            cancelled = true;
            if (pollTimer) clearTimeout(pollTimer);
        };
    }, [isAuthenticated, user, id, router]);

    // Evaluating state — show a dedicated loading screen
    if (isEvaluating) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-dark">
                <div className="flex flex-col items-center gap-6 max-w-md text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-primary text-[24px]">
                            psychology
                        </span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">Evaluating Your Design</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Our AI is analyzing your architecture for structural integrity, trade-off quality, and scalability patterns.
                            This typically takes 15-30 seconds.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Processing...
                    </div>
                </div>
            </div>
        );
    }

    if (authLoading || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 font-medium">Loading results...</p>
                </div>
            </div>
        );
    }

    if (error || !session || !session.evaluation) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background-dark text-white p-6">
                <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
                <h2 className="text-2xl font-bold mb-2">Failed to Load Results</h2>
                <p className="text-slate-400 mb-8 text-center max-w-md">
                    {error || 'Evaluation data is missing for this session.'}
                </p>
            <Link href="/interview" className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded font-mono text-xs font-bold uppercase tracking-widest transition-all">
                Back to Interviews
            </Link>
            </div>
        );
    }

    const { evaluation, question } = session;
    const { structural, reasoning, finalScore } = evaluation;
    const constraintChanges = session.constraintChanges || [];

    return (
        <div className="min-h-screen bg-background-dark text-white p-6 md:p-10 font-display selection:bg-primary/30">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/interview" className="flex items-center gap-1 text-white/40 hover:text-cyan-400 text-[10px] font-mono uppercase tracking-widest transition-colors">
                            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                            Back
                        </Link>
                        <span className="text-white/10">•</span>
                        <span className="text-white/30 text-[10px] font-mono uppercase tracking-widest">Interview Result</span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold font-mono tracking-wider text-white uppercase">{question.prompt.split('.')[0]}</h1>
                    <p className="text-white/40 mt-1.5 max-w-2xl text-[10px] font-mono tracking-wide leading-relaxed truncate">
                        {question.prompt}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        disabled
                        aria-disabled="true"
                        className="flex items-center gap-2 px-4 py-2 border border-white/[0.04] bg-[#0c0d16]/30 text-white/30 opacity-50 cursor-not-allowed rounded-lg font-mono text-[10px] uppercase tracking-wider"
                    >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        Export PDF (Soon)
                    </button>
                    <Link
                        href={`/interview`}
                        className="flex items-center gap-2 px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded font-mono text-[10px] uppercase tracking-widest font-bold transition-all shadow-md shadow-cyan-500/10"
                    >
                        Try Another
                    </Link>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score Summary Overview */}
                <div className="lg:col-span-3 bg-[#0c0d16]/60 backdrop-blur-md border border-white/[0.06] rounded-3xl p-8 flex flex-col md:flex-row items-center gap-10 overflow-hidden relative group shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full -mr-20 -mt-20 group-hover:bg-cyan-500/10 transition-all duration-700" />
 
                    <div className="relative shrink-0 flex flex-col items-center">
                        <div className="relative size-40 flex items-center justify-center">
                            {/* Circular progress with SVG */}
                            <svg className="size-40 -rotate-90">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    fill="transparent"
                                    stroke="rgba(255,255,255,0.03)"
                                    strokeWidth="10"
                                />
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    fill="transparent"
                                    stroke="url(#scoreGradient)"
                                    strokeWidth="10"
                                    strokeDasharray={440}
                                    strokeDashoffset={440 - (440 * finalScore) / 100}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                />
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#22d3ee" />
                                        <stop offset="100%" stopColor="#0891b2" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-5xl font-extrabold font-mono text-white tracking-tighter">{finalScore}</span>
                                <span className="text-[8px] font-bold font-mono text-white/30 uppercase tracking-[0.2em] mt-1.5">OUT OF 100</span>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => {
                                const rating = finalScore / 20;
                                const isFull = star <= Math.floor(rating);
                                const isHalf = !isFull && star <= Math.ceil(rating) && (finalScore % 20) >= 10;
                                return (
                                    <span key={star} className={`material-symbols-outlined text-[20px] ${isFull || isHalf ? 'text-amber-400' : 'text-slate-700'}`}>
                                        {isFull ? 'star' : (isHalf ? 'star_half' : 'star')}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                    
                    <div className="flex-1 space-y-6 relative">
                        <div>
                            <h2 className="text-base font-bold font-mono uppercase tracking-wider text-white mb-2">Architectural Assessment</h2>
                            <p className="text-white/60 text-xs font-mono tracking-wide leading-relaxed">
                                Your design was evaluated against both deterministic structural rules and qualitative AI-driven reasoning.
                                A score of <span className="text-cyan-400 font-bold font-mono">{finalScore}</span> indicates a
                                {finalScore >= 80 ? ' robust, production-ready' : (finalScore >= 60 ? ' solid foundation with minor' : ' basic attempt with significant')} architectural
                                {finalScore >= 80 ? ' strategy.' : ' gaps.'}
                            </p>
                        </div>
 
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-[#060810]/50 border border-white/[0.04] flex items-center justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                                <div>
                                    <p className="text-[8px] font-bold font-mono text-white/40 uppercase tracking-[0.2em] mb-1.5">Structural Rules</p>
                                    <div className="flex items-end gap-1.5 text-xl font-bold font-mono text-white/90">
                                        {structural.score}
                                        <span className="text-[10px] text-white/30 font-bold mb-1">/ 100</span>
                                    </div>
                                </div>
                                <div className="size-10 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-400">
                                    <span className="material-symbols-outlined text-[20px]">architecture</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-[#060810]/50 border border-white/[0.04] flex items-center justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                                <div>
                                    <p className="text-[8px] font-bold font-mono text-white/40 uppercase tracking-[0.2em] mb-1.5">AI Reasoning</p>
                                    <div className="flex items-end gap-1.5 text-xl font-bold font-mono text-white/90">
                                        {reasoning.score}
                                        <span className="text-[10px] text-white/30 font-bold mb-1">/ 100</span>
                                    </div>
                                </div>
                                <div className="size-10 rounded-lg bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center text-cyan-400">
                                    <span className="material-symbols-outlined text-[20px]">psychology</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Left Column: Structural Analysis */}
                <div className="lg:col-span-2 space-y-8">
                    {constraintChanges.length > 0 && (
                        <section className="bg-[#0c0d16]/60 backdrop-blur-md border border-white/[0.06] rounded-3xl p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-amber-400 text-[18px]">bolt</span>
                                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">Live Constraint Changes</h3>
                            </div>
                            <div className="space-y-3">
                                {constraintChanges.map((change) => (
                                    <div key={change.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                                        <div className="flex items-center justify-between gap-3 mb-1.5 font-mono">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-white">{change.title}</h4>
                                            <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest ${change.severity === 'high'
                                                ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                                                }`}>
                                                {change.severity}
                                            </span>
                                        </div>
                                        <p className="text-xs font-mono tracking-wide text-white/60">{change.description}</p>
                                        <p className="mt-2 text-[9px] font-mono text-white/30">
                                            Introduced {change.introducedAtMinute} minutes into the interview
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[22px]">checklist_rtl</span>
                                Verification Rules
                            </h3>
                            <span className="text-xs font-bold text-slate-500 bg-slate-800/50 px-2 py-1 rounded-md">
                                {structural.passedRules.length} PASSED / {structural.details.length} TOTAL
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {structural.details.map((detail: IRuleResult, i: number) => (
                                <div
                                    key={i}
                                    className={`p-4 rounded-2xl border transition-all hover:translate-x-1 ${detail.status === 'pass'
                                        ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30'
                                        : (detail.severity === 'critical'
                                            ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                                            : 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40')
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className={`material-symbols-outlined text-[22px] mt-0.5 ${detail.status === 'pass' ? 'text-emerald-500' : (detail.severity === 'critical' ? 'text-red-500' : 'text-amber-500')
                                            }`}>
                                            {detail.status === 'pass' ? 'check_circle' : (detail.severity === 'critical' ? 'cancel' : 'warning')}
                                        </span>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h4 className="font-bold text-sm text-white">{detail.rule}</h4>
                                                {detail.status !== 'pass' && (
                                                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500 text-white leading-none">
                                                        {detail.severity}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-sm ${detail.status === 'pass' ? 'text-slate-400' : 'text-slate-300'}`}>
                                                {detail.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column: AI Insights */}
                <div className="lg:col-span-1">
                    <section className="bg-[#0c0d16]/60 backdrop-blur-md border border-white/[0.06] rounded-3xl p-6 h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                        <div className="flex items-center gap-2 mb-6 border-b border-white/[0.04] pb-4 font-mono">
                            <span className="material-symbols-outlined text-cyan-400 text-[20px]">auto_awesome</span>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-white">AI Insights</h3>
                        </div>
 
                        <div className="space-y-8 font-mono">
                            {constraintChanges.length > 0 && (
                                <div>
                                    <h4 className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[14px]">bolt</span>
                                        Adaptability
                                    </h4>
                                    <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl text-[10px] tracking-wide leading-relaxed text-white/70">
                                        {reasoning.adaptationSummary || 'The interview included live requirement changes, but no adaptation summary was generated.'}
                                    </div>
                                    {(reasoning.addressedConstraintChanges?.length || reasoning.missedConstraintChanges?.length) ? (
                                        <div className="mt-3 grid grid-cols-1 gap-3">
                                            {reasoning.addressedConstraintChanges && reasoning.addressedConstraintChanges.length > 0 && (
                                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400 mb-2">Addressed</p>
                                                    <ul className="space-y-2">
                                                        {reasoning.addressedConstraintChanges.map((item, i) => (
                                                            <li key={`${item}-${i}`} className="text-[10px] tracking-wide text-white/70 flex items-start gap-2">
                                                                <span className="mt-1.5 size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {reasoning.missedConstraintChanges && reasoning.missedConstraintChanges.length > 0 && (
                                                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-red-400 mb-2">Missed</p>
                                                    <ul className="space-y-2">
                                                        {reasoning.missedConstraintChanges.map((item, i) => (
                                                            <li key={`${item}-${i}`} className="text-[10px] tracking-wide text-white/70 flex items-start gap-2">
                                                                <span className="mt-1.5 size-1.5 rounded-full bg-red-500 shrink-0" />
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            )}
 
                            {/* Strengths */}
                            <div>
                                <h4 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                                    Key Strengths
                                </h4>
                                {reasoning.strengths.length > 0 ? (
                                    <ul className="space-y-3">
                                        {reasoning.strengths.map((s: string, i: number) => (
                                            <li key={i} className="text-[10px] tracking-wide text-white/70 flex items-start gap-2">
                                                <span className="mt-1.5 size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-[10px] text-white/30 italic px-4">No strengths identified.</p>
                                )}
                            </div>
 
                            {/* Weaknesses */}
                            <div>
                                <h4 className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">heart_broken</span>
                                    Gaps & Weaknesses
                                </h4>
                                {reasoning.weaknesses.length > 0 ? (
                                    <ul className="space-y-3">
                                        {reasoning.weaknesses.map((w: string, i: number) => (
                                            <li key={i} className="text-[10px] tracking-wide text-white/70 flex items-start gap-2">
                                                <span className="mt-1.5 size-1.5 rounded-full bg-red-500 shrink-0" />
                                                {w}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-[10px] text-white/30 italic px-4">No significant weaknesses found.</p>
                                )}
                            </div>
 
                            {/* Suggestions */}
                            <div className="pt-4 border-t border-white/[0.04]">
                                <h4 className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                                    Actionable Steps
                                </h4>
                                <div className="space-y-2">
                                    {reasoning.suggestions.map((s: string, i: number) => (
                                        <div key={i} className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-[10px] tracking-wide text-white/70 leading-relaxed italic">
                                            <q>{s}</q>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* AI Conversation History (if any) */}
            {session.aiMessages && session.aiMessages.length > 0 && (
                <div className="max-w-6xl mx-auto mt-8">
                    <section className="bg-[#0c0d16]/60 backdrop-blur-md border border-white/[0.06] rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                        <div className="flex items-center gap-2 mb-6 font-mono">
                            <span className="material-symbols-outlined text-cyan-400 text-[20px]">forum</span>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Interview Transcript</h3>
                        </div>
                        <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-4 font-mono">
                            {session.aiMessages.map((msg, i) => {
                                const isAI = msg.role === 'interviewer';
                                return (
                                    <div key={i} className={`flex gap-3 max-w-[80%] ${isAI ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}>
                                        {isAI && (
                                            <div className="w-8 h-8 rounded-full bg-cyan-500/5 flex-shrink-0 flex items-center justify-center mt-1 border border-cyan-500/20">
                                                <span className="material-symbols-outlined text-[14px] text-cyan-400">robot_2</span>
                                            </div>
                                        )}
                                        <div className={`p-4 rounded-xl text-[10px] tracking-wide leading-relaxed relative ${isAI
                                                ? 'bg-[#060810]/50 border border-white/[0.04] text-white/70 rounded-tl-sm shadow-md'
                                                : 'bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 rounded-tr-sm'
                                            }`}>
                                            {msg.content}
                                            <span className="block mt-2 text-[8px] text-white/30 font-medium">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            )}

            {/* Wide Column: Design Preview */}
            <div className="max-w-6xl mx-auto mt-8">
                <section>
                    <div className="flex items-center justify-between mb-4 px-2 font-mono">
                        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-white">
                            <span className="material-symbols-outlined text-teal-400 text-[18px]">hub</span>
                            Submitted Architecture
                        </h3>
                        <span className="text-[9px] font-bold tracking-widest text-white/40 bg-white/[0.02] border border-white/[0.04] px-2 py-0.5 rounded">
                            READ-ONLY SNAPSHOT
                        </span>
                    </div>
                    <div className="flex h-[600px] bg-[#0c0d16]/60 backdrop-blur-md border border-white/[0.06] rounded-3xl overflow-hidden relative shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                        <DesignCanvas
                            initialNodes={session.canvasSnapshot?.nodes || []}
                            initialConnections={session.canvasSnapshot?.connections || []}
                            readOnly={true}
                        />
                        <div className="absolute bottom-6 left-6 bg-[#060810]/90 backdrop-blur-md border border-white/[0.04] px-4 py-2 rounded-xl pointer-events-none font-mono">
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">Architecture Snapshot</p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <div className="max-w-6xl mx-auto mt-16 pt-10 border-t border-white/[0.04] text-center font-mono">
                <p className="text-white/40 text-xs mb-4">Want to improve your score? Analyze the weaknesses and try the same challenge again.</p>
                <div className="flex items-center justify-center gap-4 text-xs">
                    <Link href={`/interview`} className="text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider">Start New Interview</Link>
                    <span className="text-white/10">•</span>
                    <Link href="/dashboard" className="text-white/40 hover:text-white font-medium uppercase tracking-wider">Return to Dashboard</Link>
                </div>
            </div>
        </div>
    );
}
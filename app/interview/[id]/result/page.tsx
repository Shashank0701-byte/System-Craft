'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { authFetch } from '@/src/lib/firebase/authClient';
import { IInterviewQuestion, IEvaluation } from '@/src/lib/db/models/InterviewSession';
import { DesignCanvas } from '@/components/canvas/DesignCanvas';

interface InterviewSessionData {
    id: string;
    question: IInterviewQuestion;
    difficulty: 'easy' | 'medium' | 'hard';
    status: string;
    evaluation: IEvaluation;
    canvasSnapshot: {
        nodes: any[];
        connections: any[];
    };
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

    useEffect(() => {
        const fetchResult = async () => {
            if (!user?.uid || !id) return;
            try {
                setIsLoading(true);
                const response = await authFetch(`/api/interview/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to load results');
                }
                const data = await response.json();

                if (data.session.status !== 'evaluated') {
                    // If not evaluated yet, maybe it was just submitted?
                    // For now, redirect back to interview if not evaluated
                    if (data.session.status === 'in_progress' || data.session.status === 'submitted') {
                        router.replace(`/interview/${id}`);
                        return;
                    }
                }

                setSession(data.session);
            } catch (err) {
                console.error('Error fetching results:', err);
                setError(err instanceof Error ? err.message : 'Failed to load results');
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated && user) {
            fetchResult();
        }
    }, [isAuthenticated, user, id, router]);

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
                <Link href="/interview" className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-xl font-bold transition-all">
                    Back to Interviews
                </Link>
            </div>
        );
    }

    const { evaluation, question } = session;
    const { structural, reasoning, finalScore } = evaluation;

    return (
        <div className="min-h-screen bg-background-dark text-white p-6 md:p-10 font-display selection:bg-primary/30">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/interview" className="flex items-center gap-1 text-primary hover:underline text-sm font-medium">
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            Back
                        </Link>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 text-sm">Interview Result</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">{question.prompt.split('.')[0]}</h1>
                    <p className="text-slate-400 mt-1 max-w-2xl text-sm leading-relaxed truncate">
                        {question.prompt}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-sidebar-bg-dark border border-border-dark hover:border-slate-500 rounded-xl text-sm font-bold transition-all">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        Export PDF
                    </button>
                    <Link
                        href={`/interview`}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20"
                    >
                        Try Another
                    </Link>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score Summary Overview */}
                <div className="lg:col-span-3 bg-sidebar-bg-dark border border-border-dark rounded-3xl p-8 flex flex-col md:flex-row items-center gap-10 overflow-hidden relative group">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-20 -mt-20 group-hover:bg-primary/20 transition-all duration-700" />

                    <div className="relative shrink-0 flex flex-col items-center">
                        <div className="relative size-40 flex items-center justify-center">
                            {/* Circular progress with SVG */}
                            <svg className="size-40 -rotate-90">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    fill="transparent"
                                    stroke="rgba(255,255,255,0.05)"
                                    strokeWidth="12"
                                />
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    fill="transparent"
                                    stroke="url(#scoreGradient)"
                                    strokeWidth="12"
                                    strokeDasharray={440}
                                    strokeDashoffset={440 - (440 * finalScore) / 100}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                />
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#4725f4" />
                                        <stop offset="100%" stopColor="#9f85ff" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-5xl font-black text-white">{finalScore}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">out of 100</span>
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
                            <h2 className="text-xl font-bold mb-2">Architectural Assessment</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Your design was evaluated against both deterministic structural rules and qualitative AI-driven reasoning.
                                A score of <span className="text-white font-bold">{finalScore}</span> indicates a
                                {finalScore >= 80 ? ' robust, production-ready' : (finalScore >= 60 ? ' solid foundation with minor' : ' basic attempt with significant')} architectural
                                {finalScore >= 80 ? ' strategy.' : ' gaps.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-dashboard-bg border border-border-dark flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Structural Rules</p>
                                    <div className="flex items-end gap-2 text-2xl font-black text-white">
                                        {structural.score}
                                        <span className="text-xs text-slate-500 font-bold mb-1.5">/ 100</span>
                                    </div>
                                </div>
                                <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <span className="material-symbols-outlined text-[24px]">architecture</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-dashboard-bg border border-border-dark flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">AI Reasoning</p>
                                    <div className="flex items-end gap-2 text-2xl font-black text-white">
                                        {reasoning.score}
                                        <span className="text-xs text-slate-500 font-bold mb-1.5">/ 100</span>
                                    </div>
                                </div>
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-[24px]">psychology</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Left Column: Structural Analysis */}
                <div className="lg:col-span-2 space-y-8">
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
                            {structural.details.map((detail: any, i: number) => (
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
                                                {!detail.status && (
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

                {/* Right Column: AI Feedback */}
                <div className="lg:col-span-1 space-y-8">
                    <section className="bg-gradient-to-br from-sidebar-bg-dark to-dashboard-bg border border-border-dark rounded-3xl p-6 h-full">
                        <div className="flex items-center gap-2 mb-6 border-b border-border-dark pb-4">
                            <span className="material-symbols-outlined text-primary text-[24px]">auto_awesome</span>
                            <h3 className="text-lg font-bold">AI Insights</h3>
                        </div>

                        <div className="space-y-8">
                            {/* Strengths */}
                            <div>
                                <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                                    Key Strengths
                                </h4>
                                {reasoning.strengths.length > 0 ? (
                                    <ul className="space-y-3">
                                        {reasoning.strengths.map((s: string, i: number) => (
                                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2.5">
                                                <span className="mt-1.5 size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 italic px-4">No strengths identified.</p>
                                )}
                            </div>

                            {/* Weaknesses */}
                            <div>
                                <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">heart_broken</span>
                                    Gaps & Weaknesses
                                </h4>
                                {reasoning.weaknesses.length > 0 ? (
                                    <ul className="space-y-3">
                                        {reasoning.weaknesses.map((w: string, i: number) => (
                                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2.5">
                                                <span className="mt-1.5 size-1.5 rounded-full bg-red-500 shrink-0" />
                                                {w}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 italic px-4">No significant weaknesses found.</p>
                                )}
                            </div>

                            {/* Suggestions */}
                            <div className="pt-4 border-t border-border-dark/30">
                                <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                                    Actionable Steps
                                </h4>
                                <div className="space-y-2">
                                    {reasoning.suggestions.map((s: string, i: number) => (
                                        <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm text-slate-300 leading-relaxed italic">
                                            "{s}"
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Wide Column: Design Preview */}
            <div className="max-w-6xl mx-auto mt-8">
                <section>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-teal-400 text-[22px]">hub</span>
                            Submitted Architecture
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                            READ-ONLY SNAPSHOT
                        </span>
                    </div>
                    <div className="h-[600px] bg-sidebar-bg-dark border border-border-dark rounded-3xl overflow-hidden relative shadow-2xl shadow-black/50">
                        <DesignCanvas
                            initialNodes={session.canvasSnapshot.nodes}
                            initialConnections={session.canvasSnapshot.connections}
                            readOnly={true}
                        />
                        <div className="absolute bottom-6 left-6 bg-background-dark/80 backdrop-blur-md border border-white/5 px-4 py-2 rounded-xl pointer-events-none">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Architecture Snapshot</p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <div className="max-w-6xl mx-auto mt-16 pt-10 border-t border-border-dark text-center">
                <p className="text-slate-500 text-sm mb-4">Want to improve your score? Analyze the weaknesses and try the same challenge again.</p>
                <div className="flex items-center justify-center gap-4">
                    <Link href={`/interview`} className="text-primary hover:underline font-bold text-sm">Start New Interview</Link>
                    <span className="text-slate-700">•</span>
                    <Link href="/dashboard" className="text-slate-400 hover:text-white font-medium text-sm">Return to Dashboard</Link>
                </div>
            </div>
        </div>
    );
}

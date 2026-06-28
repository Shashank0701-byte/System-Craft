'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { authFetch } from '@/src/lib/firebase/authClient';
import { Header } from '@/components/dashboard/Header';
import { SidebarProvider } from '@/components/dashboard/SidebarContext';
import { Sidebar } from '@/components/dashboard/Sidebar';

interface InterviewSession {
    id: string;
    difficulty: 'easy' | 'medium' | 'hard';
    status: 'in_progress' | 'submitted' | 'evaluating' | 'evaluated';
    questionPrompt: string;
    timeLimit: number;
    startedAt: string;
    submittedAt?: string;
    finalScore?: number | null;
    createdAt: string;
}

interface UsageInfo {
    used: number;
    limit: number;
}

const DIFFICULTY_CONFIG = {
    easy: {
        label: 'Easy',
        time: '30 min',
        color: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
        textColor: 'text-emerald-400',
        bgColor: 'bg-[#0c0d16]',
        borderColor: 'border-emerald-500/30',
        icon: 'trending_flat',
        description: 'Basic CRUD, single database, client-server',
    },
    medium: {
        label: 'Medium',
        time: '45 min',
        color: 'from-amber-500/20 via-amber-500/5 to-transparent',
        textColor: 'text-amber-400',
        bgColor: 'bg-[#0c0d16]',
        borderColor: 'border-amber-500/30',
        icon: 'trending_up',
        description: 'Caching, load balancing, replication',
    },
    hard: {
        label: 'Hard',
        time: '60 min',
        color: 'from-rose-500/20 via-rose-500/5 to-transparent',
        textColor: 'text-rose-400',
        bgColor: 'bg-[#0c0d16]',
        borderColor: 'border-rose-500/30',
        icon: 'rocket_launch',
        description: 'Multi-region, sharding, consensus protocols',
    },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    in_progress: { label: 'In Progress', color: 'text-cyan-400', icon: 'play_circle' },
    submitted: { label: 'Submitted', color: 'text-emerald-400', icon: 'check_circle' },
    evaluating: { label: 'Evaluating...', color: 'text-amber-400', icon: 'hourglass_top' },
    evaluated: { label: 'Evaluated', color: 'text-cyan-400', icon: 'grading' },
};

export default function InterviewPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth();
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [usage, setUsage] = useState<UsageInfo | null>(null);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [isStarting, setIsStarting] = useState<string | null>(null); // difficulty being started
    const [error, setError] = useState<string | null>(null);
    const [reEvaluatingId, setReEvaluatingId] = useState<string | null>(null);
    const lastFetchedUid = useRef<string | null>(null);

    const fetchSessions = useCallback(async () => {
        if (!user?.uid) return;
        try {
            setIsLoadingSessions(true);
            setError(null);
            const response = await authFetch('/api/interview?limit=20');
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to fetch sessions');
            }
            const data = await response.json();
            setSessions(data.sessions || []);
            setUsage(data.usage || null);
        } catch (err) {
            console.error('Error fetching sessions:', err);
            setError(err instanceof Error ? err.message : 'Failed to load sessions');
        } finally {
            setIsLoadingSessions(false);
        }
    }, [user?.uid]);

    useEffect(() => {
        if (isAuthenticated && user && lastFetchedUid.current !== user.uid) {
            lastFetchedUid.current = user.uid;
            fetchSessions();
        }
    }, [isAuthenticated, user, fetchSessions]);

    const handleStartInterview = async (difficulty: 'easy' | 'medium' | 'hard') => {
        if (!user?.uid || isStarting) return;

        try {
            setIsStarting(difficulty);
            setError(null);
            const response = await authFetch('/api/interview', {
                method: 'POST',
                body: JSON.stringify({ difficulty }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || data.message || 'Failed to start interview');
            }

            const data = await response.json();

            if (!data?.session?.id) {
                throw new Error('Interview created but no session ID was returned.');
            }

            router.push(`/interview/${data.session.id}`);
        } catch (err) {
            console.error('Error starting interview:', err);
            setError(err instanceof Error ? err.message : 'Failed to start interview');
            setIsStarting(null);
        }
    };

    const handleReEvaluate = async (e: React.MouseEvent, sessionId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (reEvaluatingId) return;

        try {
            setReEvaluatingId(sessionId);
            // Update the card to show evaluating state immediately
            setSessions(prev => prev.map(s =>
                s.id === sessionId ? { ...s, status: 'evaluating' as const } : s
            ));

            const response = await authFetch(`/api/interview/${sessionId}/evaluate`, {
                method: 'POST'
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Re-evaluation failed');
            }

            const data = await response.json();
            // Update session with new evaluation result
            setSessions(prev => prev.map(s =>
                s.id === sessionId
                    ? { ...s, status: 'evaluated' as const, finalScore: data.session?.finalScore ?? s.finalScore }
                    : s
            ));
        } catch (err) {
            console.error('Re-evaluate failed:', err);
            // Revert status to what it was before (refetch to be safe)
            fetchSessions();
            setError(err instanceof Error ? err.message : 'Re-evaluation failed');
        } finally {
            setReEvaluatingId(null);
        }
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Unknown';
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        if (diffMs < 0) return 'Just now';
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

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
            <div className="flex h-screen overflow-hidden bg-[#060810] select-none">
                <Sidebar />
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    <Header />
                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        <div className="max-w-[1200px] mx-auto relative z-10">
                            {/* Noise background */}
                            <div className="noise-overlay absolute inset-0 pointer-events-none opacity-40 -z-10" />

                            {/* Back Navigation */}
                            <div className="mb-8">
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-white/40 hover:text-cyan-400 transition-colors group"
                                >
                                    <span className="material-symbols-outlined text-[14px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                                    Back to Dashboard
                                </Link>
                            </div>

                            {/* Hero Section */}
                            <div className="mb-12">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="size-8 rounded border border-white/[0.06] bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                        <span className="material-symbols-outlined text-[18px]">play_circle</span>
                                    </div>
                                    <h1 className="text-xl md:text-2xl font-bold font-mono tracking-wider text-white uppercase">Interview Mode</h1>
                                </div>
                                <p className="text-white/40 text-xs md:text-sm font-mono tracking-wide max-w-2xl mt-4">
                                    Practice system design under real interview conditions. Get an AI-generated question,
                                    design your solution on the canvas, and receive detailed evaluation.
                                </p>

                                {/* Usage Badge */}
                                {usage && (
                                    <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#0c0d16] border border-white/[0.04]">
                                        <span className="material-symbols-outlined text-cyan-400 text-[14px]">local_fire_department</span>
                                        <span className="text-[10px] font-mono tracking-widest uppercase text-white/60">
                                            <span className="font-bold text-white">{usage.used}</span>
                                            <span> / {usage.limit} this week</span>
                                        </span>
                                        {usage.used >= usage.limit && (
                                            <span className="text-[9px] text-rose-400 font-bold ml-2 font-mono uppercase tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">Limit reached</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Difficulty Cards */}
                            <div className="mb-12">
                                <h2 className="text-xs font-bold font-mono tracking-widest uppercase text-white/80 mb-4">Start a New Interview</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {(Object.entries(DIFFICULTY_CONFIG) as [keyof typeof DIFFICULTY_CONFIG, typeof DIFFICULTY_CONFIG[keyof typeof DIFFICULTY_CONFIG]][]).map(([key, config]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleStartInterview(key)}
                                            disabled={!!isStarting || (usage !== null && usage.used >= usage.limit)}
                                            className={`group relative overflow-hidden rounded-xl border border-white/[0.04] bg-[#0c0d16]/50 p-6 text-left transition-all duration-300 hover:bg-[#0c0d16] hover:border-white/[0.12] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] cursor-pointer`}
                                        >
                                            {/* Gradient accent bar */}
                                            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${config.color} opacity-50 group-hover:opacity-100 transition-opacity`} />

                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`flex items-center gap-2 ${config.textColor}`}>
                                                    <span className="material-symbols-outlined text-[20px]">{config.icon}</span>
                                                    <span className="text-xs font-mono font-bold uppercase tracking-widest">{config.label}</span>
                                                </div>
                                                <span className={`text-[9px] font-mono tracking-widest uppercase ${config.textColor} bg-white/[0.02] border border-white/[0.04] rounded px-2 py-0.5`}>
                                                    {config.time}
                                                </span>
                                            </div>

                                            <p className="text-[10px] font-mono text-white/40 mb-6 leading-relaxed">
                                                {config.description}
                                            </p>

                                            <div className={`flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase font-bold transition-colors ${isStarting === key ? config.textColor : 'text-white/30 group-hover:text-white'}`}>
                                                {isStarting === key ? (
                                                    <>
                                                        <div className="size-3 border border-current border-t-transparent rounded-full animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                                        Initiate
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-between">
                                    <span>{error}</span>
                                    <button
                                        onClick={() => { setError(null); fetchSessions(); }}
                                        className="ml-2 underline hover:no-underline text-sm cursor-pointer"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}

                            {/* Past Sessions */}
                            <div>
                                <h2 className="text-xs font-bold font-mono tracking-widest uppercase text-white/80 mb-4">Past Sessions</h2>

                                {isLoadingSessions ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="h-32 rounded-xl bg-white/[0.01] border border-white/[0.04] animate-pulse" />
                                        ))}
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <div className="text-center py-16 rounded-xl bg-[#0c0d16]/30 border border-dashed border-white/[0.05]">
                                        <span className="material-symbols-outlined text-4xl text-white/10 mb-3 block select-none">school</span>
                                        <h3 className="text-[10px] font-mono font-bold tracking-widest uppercase text-white/40 mb-1">No sessions yet</h3>
                                        <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                                            Start your first interview to practice system design
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {sessions.map((session) => {
                                            const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG.in_progress;
                                            const diffConfig = DIFFICULTY_CONFIG[session.difficulty];

                                            return (
                                                <Link
                                                    key={session.id}
                                                    href={`/interview/${session.id}`}
                                                    className="group flex flex-col rounded-xl bg-[#0c0d16]/40 border border-white/[0.04] hover:border-white/[0.12] hover:bg-[#0c0d16] p-5 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-widest ${diffConfig.textColor} bg-white/[0.02] border border-white/[0.04]`}>
                                                                {diffConfig.label}
                                                            </span>
                                                            <span className={`flex items-center gap-1 text-[9px] font-mono tracking-widest uppercase ${statusConfig.color}`}>
                                                                <span className="material-symbols-outlined text-[12px]">{statusConfig.icon}</span>
                                                                {statusConfig.label}
                                                            </span>
                                                        </div>
                                                        <span className="text-[8px] font-mono tracking-widest uppercase text-white/20">
                                                            {formatRelativeTime(session.createdAt)}
                                                        </span>
                                                    </div>

                                                    <p className="text-[11px] font-mono text-white/80 leading-relaxed mb-4 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                                                        {session.questionPrompt}
                                                    </p>

                                                    <div className="mt-auto flex items-center justify-between border-t border-dashed border-white/[0.03] pt-4">
                                                        <span className="text-[9px] font-mono tracking-widest uppercase text-white/30 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[12px]">timer</span>
                                                            {session.timeLimit} min
                                                        </span>

                                                        {session.finalScore != null && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[8px] font-mono tracking-widest uppercase text-white/30">Score:</span>
                                                                <span className={`text-[10px] font-mono font-bold tracking-widest ${session.finalScore >= 80 ? 'text-emerald-400' :
                                                                    session.finalScore >= 60 ? 'text-amber-400' :
                                                                        'text-rose-400'
                                                                    }`}>
                                                                    {session.finalScore}%
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Re-evaluate logic */}
                                                        {['submitted', 'evaluating', 'evaluated'].includes(session.status) && (
                                                            <button
                                                                onClick={(e) => handleReEvaluate(e, session.id)}
                                                                disabled={reEvaluatingId === session.id || session.status === 'evaluating'}
                                                                className={`flex items-center gap-1 px-2 py-1 rounded text-[8px] font-mono uppercase tracking-widest font-bold border transition-all ${
                                                                    reEvaluatingId === session.id || session.status === 'evaluating'
                                                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 cursor-wait'
                                                                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20 cursor-pointer'
                                                                }`}
                                                                title="Re-evaluate this design"
                                                            >
                                                                {reEvaluatingId === session.id || session.status === 'evaluating' ? (
                                                                    <>
                                                                        <div className="size-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                                                                        Eval...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="material-symbols-outlined text-[10px]">refresh</span>
                                                                        Re-eval
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}

                                                        <span className="material-symbols-outlined text-[14px] text-white/20 group-hover:text-cyan-400 transition-colors group-hover:translate-x-1 transform duration-300">
                                                            arrow_forward
                                                        </span>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarProvider>
    );
}

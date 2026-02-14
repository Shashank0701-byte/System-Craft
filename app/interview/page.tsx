'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { authFetch } from '@/src/lib/firebase/authClient';
import { Header } from '@/components/dashboard/Header';

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
        color: 'from-emerald-600 to-emerald-400',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        icon: 'trending_flat',
        description: 'Basic CRUD, single database, client-server',
    },
    medium: {
        label: 'Medium',
        time: '45 min',
        color: 'from-amber-600 to-amber-400',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        icon: 'trending_up',
        description: 'Caching, load balancing, replication',
    },
    hard: {
        label: 'Hard',
        time: '60 min',
        color: 'from-red-600 to-red-400',
        textColor: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        icon: 'rocket_launch',
        description: 'Multi-region, sharding, consensus protocols',
    },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    in_progress: { label: 'In Progress', color: 'text-blue-400', icon: 'play_circle' },
    submitted: { label: 'Submitted', color: 'text-emerald-400', icon: 'check_circle' },
    evaluating: { label: 'Evaluating...', color: 'text-amber-400', icon: 'hourglass_top' },
    evaluated: { label: 'Evaluated', color: 'text-primary', icon: 'grading' },
};

export default function InterviewPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth();
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [usage, setUsage] = useState<UsageInfo | null>(null);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [isStarting, setIsStarting] = useState<string | null>(null); // difficulty being started
    const [error, setError] = useState<string | null>(null);
    const hasFetched = useRef(false);

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
        if (isAuthenticated && user && !hasFetched.current) {
            hasFetched.current = true;
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
            <div className="min-h-screen flex items-center justify-center bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <>
            <Header />
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-[1200px] mx-auto">

                    {/* Hero Section */}
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-primary text-[28px]">play_circle</span>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">Interview Mode</h1>
                        </div>
                        <p className="text-slate-400 text-sm md:text-base max-w-2xl">
                            Practice system design under real interview conditions. Get an AI-generated question,
                            design your solution on the canvas, and receive detailed evaluation.
                        </p>

                        {/* Usage Badge */}
                        {usage && (
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dashboard-card border border-border-dark">
                                <span className="material-symbols-outlined text-primary text-[16px]">local_fire_department</span>
                                <span className="text-sm text-slate-300">
                                    <span className="font-bold text-white">{usage.used}</span>
                                    <span className="text-text-muted-dark"> / {usage.limit} this week</span>
                                </span>
                                {usage.used >= usage.limit && (
                                    <span className="text-xs text-amber-400 font-medium ml-2">Limit reached</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Difficulty Cards */}
                    <div className="mb-10">
                        <h2 className="text-lg font-bold text-white mb-4">Start a New Interview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(Object.entries(DIFFICULTY_CONFIG) as [keyof typeof DIFFICULTY_CONFIG, typeof DIFFICULTY_CONFIG[keyof typeof DIFFICULTY_CONFIG]][]).map(([key, config]) => (
                                <button
                                    key={key}
                                    onClick={() => handleStartInterview(key)}
                                    disabled={!!isStarting || (usage !== null && usage.used >= usage.limit)}
                                    className={`group relative overflow-hidden rounded-xl border ${config.borderColor} ${config.bgColor} p-6 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer`}
                                >
                                    {/* Gradient accent bar */}
                                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.color}`} />

                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`flex items-center gap-2 ${config.textColor}`}>
                                            <span className="material-symbols-outlined text-[24px]">{config.icon}</span>
                                            <span className="text-lg font-bold">{config.label}</span>
                                        </div>
                                        <span className="text-xs text-text-muted-dark bg-dashboard-card rounded-full px-2.5 py-1 font-mono">
                                            {config.time}
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-400 mb-4">
                                        {config.description}
                                    </p>

                                    <div className="flex items-center gap-2 text-sm font-medium text-white opacity-70 group-hover:opacity-100 transition-opacity">
                                        {isStarting === key ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Generating question...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                                Start Interview
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
                                onClick={() => { setError(null); hasFetched.current = false; fetchSessions(); }}
                                className="ml-2 underline hover:no-underline text-sm cursor-pointer"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Past Sessions */}
                    <div>
                        <h2 className="text-lg font-bold text-white mb-4">Past Sessions</h2>

                        {isLoadingSessions ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-32 rounded-xl bg-dashboard-card animate-pulse" />
                                ))}
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-16 rounded-xl bg-dashboard-card/50 border border-border-dark">
                                <span className="material-symbols-outlined text-5xl text-text-muted-dark mb-3 block">school</span>
                                <h3 className="text-base font-medium text-slate-400 mb-1">No sessions yet</h3>
                                <p className="text-sm text-text-muted-dark">
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
                                            className="group flex flex-col rounded-xl bg-dashboard-card border border-border-dark hover:border-primary/30 p-5 transition-all duration-200 hover:shadow-xl"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${diffConfig.bgColor} ${diffConfig.textColor} ${diffConfig.borderColor} border`}>
                                                        {diffConfig.label}
                                                    </span>
                                                    <span className={`flex items-center gap-1 text-xs ${statusConfig.color}`}>
                                                        <span className="material-symbols-outlined text-[14px]">{statusConfig.icon}</span>
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-text-muted-dark">
                                                    {formatRelativeTime(session.createdAt)}
                                                </span>
                                            </div>

                                            <p className="text-sm text-white font-medium mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                                {session.questionPrompt}
                                            </p>

                                            <div className="mt-auto flex items-center justify-between">
                                                <span className="text-xs text-text-muted-dark flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">timer</span>
                                                    {session.timeLimit} min
                                                </span>

                                                {session.finalScore != null && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs text-text-muted-dark">Score:</span>
                                                        <span className={`text-sm font-bold ${session.finalScore >= 80 ? 'text-emerald-400' :
                                                            session.finalScore >= 60 ? 'text-amber-400' :
                                                                'text-red-400'
                                                            }`}>
                                                            {session.finalScore}%
                                                        </span>
                                                    </div>
                                                )}

                                                <span className="material-symbols-outlined text-[18px] text-text-muted-dark group-hover:text-primary transition-colors">
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
        </>
    );
}

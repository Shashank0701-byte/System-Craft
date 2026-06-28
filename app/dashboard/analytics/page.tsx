'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { authFetch } from '@/src/lib/firebase/authClient';
import { Header } from '@/components/dashboard/Header';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

interface AnalyticsResponse {
    totalInterviews: number;
    averageScore: number;
    bestScore: number;
    scoreTrend: { date: string; score: number; difficulty: string }[];
    ruleHeatmap: { rule: string; results: ('pass' | 'fail' | 'skip')[] }[];
    weaknessFrequency: { weakness: string; count: number }[];
    summaryStats: {
        improvementPercent: number;
        mostCommonDifficulty: string;
        avgTimeToSubmitMinutes: number;
    };
}

export default function AnalyticsPage() {
    const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth();
    const [data, setData] = useState<AnalyticsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCounter, setRetryCounter] = useState(0);

    useEffect(() => {
        if (!isAuthenticated || !user?.uid) return;

        const controller = new AbortController();

        const fetchAnalytics = async () => {
            try {
                setIsLoading(true);
                const response = await authFetch('/api/user/analytics', {
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error('Failed to load analytics');
                const result = await response.json();
                if (!controller.signal.aborted) {
                    setData(result);
                }
            } catch (err: unknown) {
                if (err instanceof Error && err.name === 'AbortError') return;
                console.error(err);
                if (!controller.signal.aborted) {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        fetchAnalytics();

        return () => {
            controller.abort();
        };
    }, [isAuthenticated, user, retryCounter]);

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark text-slate-400">
                <p>Failed to load analytics data.</p>
                <button
                    onClick={() => setRetryCounter(c => c + 1)}
                    className="mt-4 text-primary hover:underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    // Colors mapping
    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case 'easy': return '#34d399'; // emerald-400
            case 'medium': return '#fbbf24'; // amber-400
            case 'hard': return '#f87171'; // rose-400
            default: return '#64748b'; // slate-500
        }
    };

    return (
        <div className="flex flex-col w-full bg-[#060810] overflow-hidden h-screen max-h-screen">
            <Header />
            <main className="flex-1 overflow-y-auto p-6 md:p-8 select-none">
                <div className="max-w-[1400px] mx-auto space-y-6">
                    {/* Page Header */}
                    <div className="font-mono">
                        <h1 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                            <span className="material-symbols-outlined text-cyan-400 text-[20px]">bar_chart</span>
                            Your Progress Analytics
                        </h1>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">
                            Track your system design performance across interviews
                        </p>
                    </div>

                    {data.totalInterviews === 0 ? (
                        <div className="bg-[#0c0d16]/60 backdrop-blur-md rounded-3xl border border-white/[0.06] p-8 md:p-16 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] font-mono">
                            <div className="size-12 mx-auto bg-cyan-500/5 border border-cyan-500/15 rounded flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-lg text-cyan-400">analytics</span>
                            </div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">No Data Yet</h3>
                            <p className="text-white/40 text-xs max-w-sm mx-auto mb-6 leading-relaxed">
                                Complete at least one system design interview to unlock detailed performance analytics.
                            </p>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 text-black text-xs font-bold uppercase tracking-widest rounded hover:bg-cyan-400 transition-all shadow-md shadow-cyan-500/10"
                            >
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Start Interview
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Stats Cards Row */}
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                <StatCard
                                    title="Total Evaluated"
                                    value={data.totalInterviews.toString()}
                                    icon="assignment_turned_in"
                                />
                                <StatCard
                                    title="Average Score"
                                    value={data.averageScore.toString()}
                                    trend={`${data.summaryStats.improvementPercent > 0 ? '+' : ''}${data.summaryStats.improvementPercent}%`}
                                    trendPositive={data.summaryStats.improvementPercent >= 0}
                                    icon="speed"
                                />
                                <StatCard
                                    title="Best Score"
                                    value={data.bestScore.toString()}
                                    icon="emoji_events"
                                />
                                <StatCard
                                    title="Common Difficulty"
                                    value={data.summaryStats.mostCommonDifficulty.charAt(0).toUpperCase() + data.summaryStats.mostCommonDifficulty.slice(1)}
                                    icon="tune"
                                />
                                <StatCard
                                    title="Avg Time"
                                    value={`${data.summaryStats.avgTimeToSubmitMinutes}m`}
                                    icon="timer"
                                />
                            </div>

                             {/* Main Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Score Trend Line Chart */}
                                <div className="bg-[#0c0d16]/60 backdrop-blur-md border border-white/[0.06] p-6 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white mb-4">Score Trend</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data.scoreTrend}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} />
                                                <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.3)" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} width={25} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0c0d16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#ffffff', fontSize: 10, fontFamily: 'monospace' }}
                                                    labelStyle={{ color: 'rgba(255,255,255,0.4)' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke="#22d3ee"
                                                    strokeWidth={2}
                                                    dot={(props) => {
                                                        const { cx, cy, payload } = props;
                                                        return (
                                                            <circle cx={cx} cy={cy} r={3.5} fill={getDifficultyColor(payload.difficulty)} stroke="#060810" strokeWidth={1} />
                                                        );
                                                    }}
                                                    activeDot={{ r: 5, fill: "#22d3ee" }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
 
                                {/* Weakness Bar Chart */}
                                <div className="bg-[#0c0d16]/60 backdrop-blur-md border border-white/[0.06] p-6 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white mb-4">Areas to Focus</h3>
                                    <div className="h-64">
                                        {data.weaknessFrequency.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={data.weaknessFrequency} layout="vertical" margin={{ left: -10 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
                                                    <XAxis type="number" hide />
                                                    <YAxis
                                                        dataKey="weakness"
                                                        type="category"
                                                        width={140}
                                                        stroke="rgba(255,255,255,0.4)"
                                                        fontSize={9}
                                                        fontFamily="monospace"
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickFormatter={(val) => val.length > 20 ? val.substring(0, 20) + '...' : val}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                                        contentStyle={{ backgroundColor: '#0c0d16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#ffffff', fontSize: 10, fontFamily: 'monospace' }}
                                                    />
                                                    <Bar dataKey="count" fill="#22d3ee" radius={[0, 3, 3, 0]} barSize={14} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-white/30 font-mono text-xs uppercase tracking-wider">
                                                No specific weaknesses found yet. Great job!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                             {/* Structural Rule Heatmap */}
                            <div className="bg-[#0c0d16]/60 backdrop-blur-md border border-white/[0.06] p-6 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] overflow-hidden font-mono">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Structural Rule Consistency</h3>
                                <p className="text-[10px] text-white/30 mb-4 uppercase tracking-wider">Latest 10 Evaluated Sessions</p>
                                <div className="overflow-x-auto min-h-[140px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    <table className="w-full text-left text-xs whitespace-nowrap">
                                        <tbody>
                                            {data.ruleHeatmap.map((row, i) => (
                                                <tr key={i} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01]">
                                                    <td className="py-2.5 pr-6 font-bold text-white/60 w-64 truncate uppercase tracking-wider" title={row.rule}>
                                                        {row.rule}
                                                    </td>
                                                    <td className="py-2.5">
                                                        <div className="flex gap-1.5 flex-nowrap">
                                                                {row.results.map((res, j) => (
                                                                <div
                                                                    key={j}
                                                                    className={`w-6 h-6 rounded flex items-center justify-center ${res === 'pass' ? 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-400' :
                                                                        res === 'fail' ? 'bg-red-500/5 border border-red-500/10 text-red-400' :
                                                                            'bg-[#060810]/50 border border-white/[0.04] text-white/20'
                                                                        }`}
                                                                    title={`Session ${j + 1}: ${res.toUpperCase()}`}
                                                                >
                                                                    <span className="material-symbols-outlined text-[12px]">
                                                                        {res === 'pass' ? 'check' : res === 'fail' ? 'close' : 'remove'}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// Helper Card Component
function StatCard({ title, value, icon, trend, trendPositive }: { title: string, value: string, icon: string, trend?: string, trendPositive?: boolean }) {
    return (
        <div className="bg-[#0c0d16]/60 backdrop-blur-md border border-white/[0.06] p-4 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] flex items-start gap-3.5 font-mono">
            <div className="size-8 rounded bg-cyan-500/5 border border-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
            </div>
            <div>
                <p className="text-[8px] text-white/30 font-bold uppercase tracking-[0.2em] mb-1.5">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h4 className="text-base font-bold text-white leading-none">{value}</h4>
                    {trend && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${trendPositive ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10' : 'text-red-400 bg-red-500/5 border border-red-500/10'}`}>
                            {trend}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

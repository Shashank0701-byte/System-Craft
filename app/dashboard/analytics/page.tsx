'use client';

import { useEffect, useState } from 'react';
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

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const fetchAnalytics = async () => {
            try {
                setIsLoading(true);
                const response = await authFetch('/api/user/analytics');
                if (!response.ok) throw new Error('Failed to load analytics');
                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [isAuthenticated, user]);

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-dark">
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
            <div className="min-h-screen flex flex-col items-center justify-center bg-background-dark text-slate-400">
                <p>Failed to load analytics data.</p>
                <button
                    onClick={() => window.location.reload()}
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
            case 'easy': return '#22c55e'; // emerald-500
            case 'medium': return '#f59e0b'; // amber-500
            case 'hard': return '#ef4444'; // red-500
            default: return '#64748b'; // slate-500
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
            <Header />
            <main className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-[1400px] mx-auto space-y-8">
                    {/* Page Header */}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[28px]">bar_chart</span>
                            Your Progress Analytics
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-text-muted-dark mt-1">
                            Track your system design performance across interviews
                        </p>
                    </div>

                    {data.totalInterviews === 0 ? (
                        <div className="bg-white dark:bg-dashboard-card rounded-2xl border border-slate-200 dark:border-border-dark p-8 md:p-16 text-center shadow-sm">
                            <div className="size-16 mx-auto bg-slate-100 dark:bg-sidebar-bg-dark rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-slate-500">analytics</span>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Data Yet</h3>
                            <p className="text-slate-500 dark:text-text-muted-dark max-w-sm mx-auto mb-6">
                                Complete at least one system design interview to unlock detailed performance analytics.
                            </p>
                            <a
                                href="/dashboard"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                Start Interview
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Stats Cards Row */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                            </div>

                            {/* Main Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Score Trend Line Chart */}
                                <div className="bg-white dark:bg-dashboard-card border border-slate-200 dark:border-border-dark p-6 rounded-2xl shadow-sm">
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Score Trend</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data.scoreTrend}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={30} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                                                    labelStyle={{ color: '#94a3b8' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke="#6366f1"
                                                    strokeWidth={3}
                                                    dot={(props) => {
                                                        const { cx, cy, payload } = props;
                                                        return (
                                                            <circle cx={cx} cy={cy} r={4} fill={getDifficultyColor(payload.difficulty)} stroke="#1e293b" strokeWidth={1} />
                                                        );
                                                    }}
                                                    activeDot={{ r: 6, fill: "#6366f1" }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Weakness Bar Chart */}
                                <div className="bg-white dark:bg-dashboard-card border border-slate-200 dark:border-border-dark p-6 rounded-2xl shadow-sm">
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Areas to Focus</h3>
                                    <div className="h-64">
                                        {data.weaknessFrequency.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={data.weaknessFrequency} layout="vertical" margin={{ left: -10 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.3} />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="weakness" type="category" width={110} stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                                                    <Tooltip
                                                        cursor={{ fill: '#334155', opacity: 0.2 }}
                                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                                                    />
                                                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                                                No specific weaknesses found yet. Great job!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Structural Rule Heatmap */}
                            <div className="bg-white dark:bg-dashboard-card border border-slate-200 dark:border-border-dark p-6 rounded-2xl shadow-sm overflow-hidden">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Structural Rule Consistency</h3>
                                <p className="text-xs text-slate-500 mb-4 uppercase tracking-wider">Latest 10 Evaluated Sessions</p>
                                <div className="overflow-x-auto min-h-[140px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <tbody>
                                            {data.ruleHeatmap.map((row, i) => (
                                                <tr key={i} className="border-b border-slate-200 dark:border-slate-800 last:border-0">
                                                    <td className="py-3 pr-6 font-medium text-slate-700 dark:text-slate-300 w-64 truncate" title={row.rule}>
                                                        {row.rule}
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="flex gap-1.5 flex-nowrap">
                                                            {row.results.map((res, j) => (
                                                                <div
                                                                    key={j}
                                                                    className={`w-6 h-6 rounded flex items-center justify-center ${res === 'pass' ? 'bg-emerald-500/20 text-emerald-500' :
                                                                            res === 'fail' ? 'bg-red-500/20 text-red-500' :
                                                                                'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                                                        }`}
                                                                    title={`Session ${j + 1}: ${res.toUpperCase()}`}
                                                                >
                                                                    <span className="material-symbols-outlined text-[14px]">
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
        <div className="bg-white dark:bg-dashboard-card border border-slate-200 dark:border-border-dark p-5 rounded-2xl shadow-sm flex items-start gap-4">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h4>
                    {trend && (
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${trendPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                            {trend}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

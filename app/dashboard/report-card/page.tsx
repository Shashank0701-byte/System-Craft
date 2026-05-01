'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { authFetch } from '@/src/lib/firebase/authClient';
import { Header } from '@/components/dashboard/Header';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts';

interface ReportCardData {
    displayName: string;
    totalInterviews: number;
    averageScore: number;
    bestScore: number;
    improvementPercent: number;
    scoreTrend: { score: number; difficulty: string }[];
    radarData: { dimension: string; score: number }[];
    difficultyCounts: Record<string, number>;
    topStrength: string | null;
    topWeakness: string | null;
    level: { label: string; color: string };
}

const DIFFICULTY_COLOR: Record<string, string> = {
    easy: '#22c55e',
    medium: '#f59e0b',
    hard: '#ef4444',
};

export default function ReportCardPage() {
    const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth();
    const [data, setData] = useState<ReportCardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [insufficientData, setInsufficientData] = useState(false);
    const [copied, setCopied] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isAuthenticated || !user?.uid) return;
        const controller = new AbortController();

        authFetch('/api/user/report-card', { signal: controller.signal })
            .then(async res => {
                const json = await res.json();
                if (!res.ok) {
                    if (json.code === 'INSUFFICIENT_DATA') setInsufficientData(true);
                    else setError(json.error || 'Failed to load');
                    return;
                }
                setData(json);
            })
            .catch(err => {
                if (err.name !== 'AbortError') setError('Failed to load report card');
            })
            .finally(() => setIsLoading(false));

        return () => controller.abort();
    }, [isAuthenticated, user?.uid]);

    const handleShare = () => {
        const text = `I scored ${data?.averageScore}/100 on system design interviews (${data?.level.label} level) on SystemCraft! 🚀\n\nPractice system design interviews with real AI feedback → systemcraft.app`;

        // Check if clipboard API is available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch(() => {
                    setCopied(false);
                    // Fallback to legacy method
                    fallbackCopyToClipboard(text);
                });
        } else {
            // Use fallback for browsers without clipboard API
            fallbackCopyToClipboard(text);
        }
    };

    const fallbackCopyToClipboard = (text: string) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            setCopied(false);
        } finally {
            document.body.removeChild(textarea);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-dark">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    if (insufficientData) {
        return (
            <div className="min-h-screen flex flex-col bg-background-dark">
                <Header />
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center max-w-sm">
                        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-primary text-3xl">workspace_premium</span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Almost there</h2>
                        <p className="text-slate-400 mb-6">Complete at least 3 evaluated interviews to unlock your Report Card.</p>
                        <Link href="/interview" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">play_circle</span>
                            Start Interview
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-dark text-slate-400">
                <p>{error || 'Something went wrong'}</p>
            </div>
        );
    }

    const maxScore = Math.max(...data.scoreTrend.map(s => s.score), 1);

    return (
        <div className="min-h-screen flex flex-col bg-background-dark">
            <Header />
            <main className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Page header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[28px]">workspace_premium</span>
                                Your Report Card
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">Based on {data.totalInterviews} evaluated interviews</p>
                        </div>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary text-sm font-semibold transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'share'}</span>
                            {copied ? 'Copied!' : 'Share'}
                        </button>
                    </div>

                    {/* Main card */}
                    <div
                        ref={cardRef}
                        className="rounded-2xl border border-white/10 bg-[#131022] overflow-hidden shadow-[0_0_60px_-10px_rgba(71,37,244,0.3)]"
                    >
                        {/* Card header */}
                        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-[24px]">person</span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-0.5">System Design Profile</p>
                                    <h2 className="text-lg font-bold text-white">{data.displayName}</h2>
                                </div>
                            </div>
                            <div
                                className="px-4 py-2 rounded-full text-sm font-black uppercase tracking-wider border"
                                style={{ color: data.level.color, borderColor: `${data.level.color}40`, background: `${data.level.color}15` }}
                            >
                                {data.level.label}
                            </div>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left — stats + sparkline */}
                            <div className="space-y-6">
                                {/* Score stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: 'Avg Score', value: data.averageScore, suffix: '/100' },
                                        { label: 'Best Score', value: data.bestScore, suffix: '/100' },
                                        { label: 'Interviews', value: data.totalInterviews, suffix: '' },
                                    ].map(s => (
                                        <div key={s.label} className="rounded-xl bg-white/5 border border-white/5 p-4 text-center">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">{s.label}</p>
                                            <p className="text-2xl font-black text-white">{s.value}<span className="text-xs text-slate-500 font-normal">{s.suffix}</span></p>
                                        </div>
                                    ))}
                                </div>

                                {/* Improvement */}
                                <div className="rounded-xl bg-white/5 border border-white/5 p-4 flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${data.improvementPercent >= 0 ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                                        <span className={`material-symbols-outlined text-[20px] ${data.improvementPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {data.improvementPercent >= 0 ? 'trending_up' : 'trending_down'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Score Improvement</p>
                                        <p className={`text-lg font-bold ${data.improvementPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {data.improvementPercent >= 0 ? '+' : ''}{data.improvementPercent}% since first interview
                                        </p>
                                    </div>
                                </div>

                                {/* Sparkline */}
                                <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3">Score Trend</p>
                                    <div className="flex items-end gap-1 h-16">
                                        {data.scoreTrend.map((s, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 rounded-sm transition-all"
                                                style={{
                                                    height: `${(s.score / maxScore) * 100}%`,
                                                    background: DIFFICULTY_COLOR[s.difficulty] || '#6366f1',
                                                    opacity: 0.8,
                                                }}
                                                title={`${s.score}/100 (${s.difficulty})`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        {Object.entries(DIFFICULTY_COLOR).map(([d, c]) => (
                                            <span key={d} className="flex items-center gap-1 text-[10px] text-slate-500">
                                                <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Difficulty breakdown */}
                                <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3">Difficulty Mix</p>
                                    <div className="flex gap-3">
                                        {['easy', 'medium', 'hard'].map(d => (
                                            <div key={d} className="flex-1 text-center">
                                                <p className="text-xl font-black" style={{ color: DIFFICULTY_COLOR[d] }}>
                                                    {data.difficultyCounts[d] || 0}
                                                </p>
                                                <p className="text-[10px] text-slate-500 capitalize">{d}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right — radar + insights */}
                            <div className="space-y-6">
                                {/* Radar chart */}
                                <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Skill Radar</p>
                                    <div className="h-56">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={data.radarData}>
                                                <PolarGrid stroke="#2b2839" />
                                                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                                <Radar
                                                    name="Score"
                                                    dataKey="score"
                                                    stroke="#4725f4"
                                                    fill="#4725f4"
                                                    fillOpacity={0.25}
                                                    strokeWidth={2}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e1b2e', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: 12 }}
                                                    formatter={(v) => [`${v ?? 0}/100`, 'Score']}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Strength */}
                                {data.topStrength && (
                                    <div className="rounded-xl bg-emerald-500/[8%] border border-emerald-500/20 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-emerald-400 text-[18px]">thumb_up</span>
                                            <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Top Strength</p>
                                        </div>
                                        <p className="text-sm text-slate-300 leading-relaxed">{data.topStrength}</p>
                                    </div>
                                )}

                                {/* Weakness */}
                                {data.topWeakness && (
                                    <div className="rounded-xl bg-red-500/[8%] border border-red-500/20 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-red-400 text-[18px]">flag</span>
                                            <p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">Focus Area</p>
                                        </div>
                                        <p className="text-sm text-slate-300 leading-relaxed">{data.topWeakness}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card footer */}
                        <div className="px-8 py-4 border-t border-white/5 flex items-center justify-between bg-white/[2%]">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[16px]">hub</span>
                                <span className="text-xs text-slate-500 font-medium">SystemCraft · systemcraft.app</span>
                            </div>
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest">System Design Simulator</p>
                        </div>
                    </div>

                    {/* Share CTA */}
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-white font-semibold mb-1">Share your progress</h3>
                            <p className="text-slate-400 text-sm">Copy a LinkedIn-ready post with your stats and a link to SystemCraft.</p>
                        </div>
                        <button
                            onClick={handleShare}
                            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">{copied ? 'check' : 'share'}</span>
                            {copied ? 'Copied to clipboard!' : 'Copy LinkedIn Post'}
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
}

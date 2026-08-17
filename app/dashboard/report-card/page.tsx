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
    easy: '#34d399',
    medium: '#fbbf24',
    hard: '#f87171',
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
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false);
            });

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
        } catch {
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
            <div className="flex flex-col w-full bg-[#060810] overflow-hidden h-screen max-h-screen">
                <Header />
                <main className="flex-1 flex items-center justify-center p-6 select-none font-mono">
                    <div className="bg-[#0c0d16]/60 backdrop-blur-md rounded-3xl border border-white/[0.06] p-8 max-w-sm text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                        <div className="size-12 mx-auto bg-cyan-500/5 border border-cyan-500/15 rounded flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-cyan-400 text-lg">workspace_premium</span>
                        </div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Almost there</h2>
                        <p className="text-white/40 text-xs mb-6 leading-relaxed uppercase tracking-wider">Complete at least 3 evaluated interviews to unlock your Report Card.</p>
                        <Link href="/interview" className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold uppercase tracking-widest rounded transition-all shadow-md shadow-cyan-500/10">
                            <span className="material-symbols-outlined text-[16px]">play_circle</span>
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
        <div className="flex flex-col w-full bg-[#060810] overflow-hidden h-screen max-h-screen">
            <Header />
            <main className="flex-1 overflow-y-auto p-6 md:p-8 select-none">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Page header */}
                    <div className="flex items-center justify-between font-mono">
                        <div>
                            <h1 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                                <span className="material-symbols-outlined text-cyan-400 text-[20px]">workspace_premium</span>
                                Your Report Card
                            </h1>
                            <p className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">Based on {data.totalInterviews} evaluated interviews</p>
                        </div>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 rounded border border-white/[0.06] bg-[#0c0d16]/50 hover:bg-[#0c0d16] text-white/60 hover:text-white text-[10px] uppercase tracking-wider font-bold transition-all"
                        >
                            <span className="material-symbols-outlined text-[14px]">{copied ? 'check' : 'share'}</span>
                            {copied ? 'Copied!' : 'Share'}
                        </button>
                    </div>

                    {/* Main card */}
                    <div
                        ref={cardRef}
                        className="rounded-3xl border border-white/[0.06] bg-[#0c0d16]/60 backdrop-blur-md overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
                    >
                        {/* Card header */}
                        <div className="px-8 py-6 border-b border-white/[0.04] flex items-center justify-between bg-gradient-to-r from-cyan-500/5 to-transparent font-mono">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-cyan-500/5 border border-cyan-500/15 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-cyan-400 text-[18px]">person</span>
                                </div>
                                <div>
                                    <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold mb-0.5">System Design Profile</p>
                                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">{data.displayName}</h2>
                                </div>
                            </div>
                            <div
                                className="px-3 py-1 rounded text-[10px] font-bold font-mono uppercase tracking-widest border"
                                style={{ color: data.level.color, borderColor: `${data.level.color}30`, background: `${data.level.color}08` }}
                            >
                                {data.level.label}
                            </div>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left — stats + sparkline */}
                            <div className="space-y-6 font-mono">
                                {/* Score stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: 'Avg Score', value: data.averageScore, suffix: '/100' },
                                        { label: 'Best Score', value: data.bestScore, suffix: '/100' },
                                        { label: 'Interviews', value: data.totalInterviews, suffix: '' },
                                    ].map(s => (
                                        <div key={s.label} className="rounded-xl bg-[#060810]/50 border border-white/[0.04] p-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                                            <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold mb-1.5">{s.label}</p>
                                            <p className="text-xl font-bold text-white font-mono">{s.value}<span className="text-[10px] text-white/30 font-normal">{s.suffix}</span></p>
                                        </div>
                                    ))}
                                </div>

                                {/* Improvement */}
                                <div className="rounded-xl bg-[#060810]/50 border border-white/[0.04] p-4 flex items-center gap-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                                    <div className={`w-8 h-8 rounded flex items-center justify-center ${data.improvementPercent >= 0 ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-red-500/5 border border-red-500/10'}`}>
                                        <span className={`material-symbols-outlined text-[16px] ${data.improvementPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {data.improvementPercent >= 0 ? 'trending_up' : 'trending_down'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold">Score Improvement</p>
                                        <p className={`text-sm font-bold ${data.improvementPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {data.improvementPercent >= 0 ? '+' : ''}{data.improvementPercent}% since first interview
                                        </p>
                                    </div>
                                </div>
                                {/* Sparkline */}
                                <div className="rounded-xl bg-[#060810]/50 border border-white/[0.04] p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                                    <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold mb-3">Score Trend</p>
                                    <div className="flex items-end gap-1 h-16">
                                        {data.scoreTrend.map((s, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 rounded transition-all"
                                                style={{
                                                    height: `${(s.score / maxScore) * 100}%`,
                                                    background: DIFFICULTY_COLOR[s.difficulty] || '#22d3ee',
                                                    opacity: 0.8,
                                                }}
                                                title={`${s.score}/100 (${s.difficulty})`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-2 font-mono">
                                        {Object.entries(DIFFICULTY_COLOR).map(([d, c]) => (
                                            <span key={d} className="flex items-center gap-1 text-[8px] text-white/30 uppercase tracking-wider">
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                </div>
 
                                {/* Difficulty breakdown */}
                                <div className="rounded-xl bg-[#060810]/50 border border-white/[0.04] p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                                    <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold mb-3">Difficulty Mix</p>
                                    <div className="flex gap-3">
                                        {['easy', 'medium', 'hard'].map(d => (
                                            <div key={d} className="flex-1 text-center">
                                                <p className="text-lg font-bold font-mono" style={{ color: DIFFICULTY_COLOR[d] }}>
                                                    {data.difficultyCounts[d] || 0}
                                                </p>
                                                <p className="text-[8px] text-white/30 uppercase tracking-wider capitalize mt-0.5">{d}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Right — radar + insights */}
                            <div className="space-y-6">
                                {/* Radar chart */}
                                <div className="rounded-xl bg-[#060810]/50 border border-white/[0.04] p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                                    <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold mb-2">Skill Radar</p>
                                    <div className="h-56">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={data.radarData}>
                                                <PolarGrid stroke="rgba(255,255,255,0.03)" />
                                                <PolarAngleAxis dataKey="dimension" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'monospace' }} />
                                                <Radar
                                                    name="Score"
                                                    dataKey="score"
                                                    stroke="#22d3ee"
                                                    fill="#22d3ee"
                                                    fillOpacity={0.1}
                                                    strokeWidth={1.5}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0c0d16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#ffffff', fontSize: 10, fontFamily: 'monospace' }}
                                                    formatter={(v) => [`${v ?? 0}/100`, 'Score']}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
 
                                {/* Strength */}
                                {data.topStrength && (
                                    <div className="rounded-xl bg-emerald-500/[0.02] border border-emerald-500/10 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-emerald-400 text-[15px]">thumb_up</span>
                                            <p className="text-[8px] text-emerald-400 uppercase tracking-[0.2em] font-bold">Top Strength</p>
                                        </div>
                                        <p className="text-xs text-white/60 leading-relaxed font-mono">{data.topStrength}</p>
                                    </div>
                                )}
 
                                {/* Weakness */}
                                {data.topWeakness && (
                                    <div className="rounded-xl bg-red-500/[0.02] border border-red-500/10 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-red-400 text-[15px]">flag</span>
                                            <p className="text-[8px] text-red-400 uppercase tracking-[0.2em] font-bold">Focus Area</p>
                                        </div>
                                        <p className="text-xs text-white/60 leading-relaxed font-mono">{data.topWeakness}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card footer */}
                        <div className="px-8 py-4 border-t border-white/[0.04] flex items-center justify-between bg-white/[0.01] font-mono">
                            <div className="flex items-center gap-2 text-white/30">
                                <span className="material-symbols-outlined text-cyan-400/80 text-[14px]">hub</span>
                                <span className="text-[9px] uppercase tracking-wider">SystemCraft · systemcraft.app</span>
                            </div>
                            <p className="text-[8px] text-white/20 uppercase tracking-[0.2em]">System Design Simulator</p>
                        </div>
                    </div>

                    {/* Share CTA */}
                    <div className="rounded-3xl border border-cyan-500/10 bg-cyan-500/[0.01] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono shadow-[inset_0_1px_1px_rgba(34,211,238,0.01)]">
                        <div>
                            <h3 className="text-white text-xs font-bold uppercase tracking-wider mb-1">Share your progress</h3>
                            <p className="text-white/40 text-[10px] uppercase tracking-wider">Copy a LinkedIn-ready post with your stats and a link to SystemCraft.</p>
                        </div>
                        <button
                            onClick={handleShare}
                            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-[10px] uppercase tracking-widest font-bold transition-all shadow-md shadow-cyan-500/10"
                        >
                            <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'share'}</span>
                            {copied ? 'Copied to clipboard!' : 'Copy LinkedIn Post'}
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
}

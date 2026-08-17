'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toJpeg } from 'html-to-image';
import { InterviewTimer } from './InterviewTimer';
import { ChaosTimer } from './ChaosTimer';
import { IConstraintChange } from '@/src/lib/db/models/InterviewSession';

interface InterviewHeaderProps {
    difficulty: 'easy' | 'medium' | 'hard';
    constraintChangeCount?: number;
    latestConstraint?: IConstraintChange;
    /** Save status */
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    /** Timer state */
    timer: {
        formatted: string;
        progress: number;
        urgency: 'normal' | 'warning' | 'critical';
        isExpired: boolean;
    };
    /** Session status */
    status: string;
    /** Submit handler */
    onSubmit: () => void;
    /** Whether submit is in progress */
    isSubmitting?: boolean;
    /** Session ID for linking to results */
    sessionId?: string;
    onChaosTimeout?: (type: 'warning' | 'penalty', id: string) => void;
}

const DIFFICULTY_LABELS: Record<string, { color: string; label: string }> = {
    easy: { color: 'text-emerald-400', label: 'Easy' },
    medium: { color: 'text-amber-400', label: 'Medium' },
    hard: { color: 'text-red-400', label: 'Hard' },
};

export function InterviewHeader({
    difficulty,
    constraintChangeCount = 0,
    latestConstraint,
    saveStatus,
    timer,
    status,
    onSubmit,
    isSubmitting = false,
    sessionId,
    onChaosTimeout,
}: InterviewHeaderProps) {
    const diffConfig = DIFFICULTY_LABELS[difficulty] || DIFFICULTY_LABELS.medium;
    const isInProgress = status === 'in_progress';
    const [isExporting, setIsExporting] = useState(false);

    const handleExportImage = async () => {
        const canvasElement = document.getElementById('design-canvas-container');
        if (!canvasElement) return;
        
        try {
            setIsExporting(true);
            const originalError = console.error;
            console.error = (...args) => {
                if (args[0]?.name === 'SecurityError' || (typeof args[0] === 'string' && args[0].includes('cssRules'))) return;
                originalError.apply(console, args);
            };

            canvasElement.classList.add('exporting-canvas');

            const dataUrl = await toJpeg(canvasElement, { 
                quality: 0.9,
                cacheBust: true, 
                backgroundColor: '#060810',
                pixelRatio: window.devicePixelRatio ? window.devicePixelRatio * 2 : 2,
                filter: (node) => {
                    if (node instanceof HTMLElement) {
                        if (node.classList.contains('absolute') && node.classList.contains('z-50')) return false;
                    }
                    return true;
                }
            });

            canvasElement.classList.remove('exporting-canvas');

            const link = document.createElement('a');
            link.download = `interview-design-${new Date().toISOString().split('T')[0]}.jpg`;
            link.href = dataUrl;
            link.click();
            
            console.error = originalError;
        } catch (err) {
            console.error('Failed to export image', err);
        } finally {
            setIsExporting(false);
        }
    };

    const renderSaveStatus = () => {
        switch (saveStatus) {
            case 'saving':
                return (
                    <span className="text-xs text-yellow-500 flex items-center gap-1">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                        Auto-saving...
                    </span>
                );
            case 'saved':
                return (
                    <span className="text-xs text-green-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Saved
                    </span>
                );
            case 'error':
                return (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        Save failed
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <header className="relative h-14 flex items-center justify-between px-4 border-b border-border-dark bg-sidebar-bg-dark shrink-0 z-20">
            <div className="flex items-center gap-4">
                <Link href="/interview" className="flex items-center gap-2 text-white group">
                    <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>hub</span>
                    </div>
                    <span className="text-sm font-bold tracking-tight hidden md:block">SystemCraft</span>
                </Link>

                <div className="h-5 w-px bg-border-dark hidden md:block" />

                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">play_circle</span>
                    <span className="text-sm font-medium text-white">Interview Mode</span>
                    <span className={`text-xs font-bold ${diffConfig.color}`}>
                        • {diffConfig.label}
                    </span>
                    {isInProgress && constraintChangeCount === 0 && timer.progress < 0.25 && (
                        <span className="hidden xl:inline text-[10px] font-mono text-white/30">
                            Chaos arms ~25%
                        </span>
                    )}
                    {isInProgress && constraintChangeCount === 0 && timer.progress >= 0.25 && (
                        <span className="hidden xl:inline text-[10px] font-mono text-white/30">
                            Chaos live
                        </span>
                    )}
                </div>

                {constraintChangeCount > 0 && (
                    <div
                        className="hidden lg:flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1"
                        title={latestConstraint?.title || 'Interview requirements updated'}
                    >
                        <span className="material-symbols-outlined text-[14px] text-amber-400">bolt</span>
                        <span className="text-[11px] font-bold uppercase tracking-wide text-amber-300">
                            Updated Requirements
                        </span>
                        <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-black text-amber-200">
                            {constraintChangeCount}
                        </span>
                    </div>
                )}

                {renderSaveStatus()}
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
                {latestConstraint && latestConstraint.status !== 'addressed' && (
                    <ChaosTimer constraint={latestConstraint} onTimeout={onChaosTimeout || (() => {})} />
                )}
                <InterviewTimer {...timer} />
            </div>

            <div className="flex items-center gap-3">
                {isInProgress && (
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting}
                        className="flex h-9 items-center gap-2 rounded-lg px-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {isSubmitting ? 'hourglass_top' : 'send'}
                        </span>
                        {isSubmitting ? 'Submitting...' : 'Submit Design'}
                    </button>
                )}

                {status === 'submitted' && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <span className="material-symbols-outlined text-yellow-500 text-[18px] animate-spin">sync</span>
                        <span className="text-sm font-medium text-yellow-500">Evaluating...</span>
                    </div>
                )}

                {status === 'evaluated' && (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <span className="material-symbols-outlined text-emerald-400 text-[18px]">workspace_premium</span>
                            <span className="text-sm font-medium text-emerald-400">Evaluated</span>
                        </div>
                        {sessionId && (
                            <Link
                                href={`/interview/${sessionId}/result`}
                                className="flex h-9 items-center gap-2 rounded-lg px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-all shadow-lg shadow-primary/20"
                            >
                                View Results
                            </Link>
                        )}
                    </div>
                )}

                <button
                    onClick={handleExportImage}
                    disabled={isExporting}
                    className="flex items-center justify-center size-9 rounded-lg hover:bg-dashboard-card text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                    title="Export Canvas Image"
                >
                    {isExporting ? (
                        <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>image</span>
                    )}
                </button>

                <Link
                    href="/interview"
                    className="flex items-center justify-center size-9 rounded-lg hover:bg-dashboard-card text-slate-400 hover:text-white transition-colors"
                    title="Exit Interview"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                </Link>
            </div>
        </header>
    );
}

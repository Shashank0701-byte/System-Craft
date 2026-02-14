'use client';

import Link from 'next/link';
import { InterviewTimer } from './InterviewTimer';

interface InterviewHeaderProps {
    difficulty: 'easy' | 'medium' | 'hard';
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
}

const DIFFICULTY_LABELS: Record<string, { color: string; label: string }> = {
    easy: { color: 'text-emerald-400', label: 'Easy' },
    medium: { color: 'text-amber-400', label: 'Medium' },
    hard: { color: 'text-red-400', label: 'Hard' },
};

export function InterviewHeader({
    difficulty,
    saveStatus,
    timer,
    status,
    onSubmit,
    isSubmitting = false,
}: InterviewHeaderProps) {
    const diffConfig = DIFFICULTY_LABELS[difficulty] || DIFFICULTY_LABELS.medium;
    const isInProgress = status === 'in_progress';

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
            {/* Left: Logo & Interview badge */}
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
                </div>

                {renderSaveStatus()}
            </div>

            {/* Center: Timer */}
            <div className="absolute left-1/2 -translate-x-1/2">
                <InterviewTimer {...timer} />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                {isInProgress && (
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting || timer.isExpired}
                        className="flex h-9 items-center gap-2 rounded-lg px-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {isSubmitting ? 'hourglass_top' : 'send'}
                        </span>
                        {isSubmitting ? 'Submitting...' : 'Submit Design'}
                    </button>
                )}

                {status === 'submitted' && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
                        <span className="text-sm font-medium text-emerald-400">Submitted</span>
                    </div>
                )}

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

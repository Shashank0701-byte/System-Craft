'use client';

interface InterviewTimerProps {
    formatted: string;
    progress: number;
    urgency: 'normal' | 'warning' | 'critical';
    isExpired: boolean;
}

const URGENCY_STYLES = {
    normal: {
        text: 'text-white',
        bar: 'bg-primary',
        bg: 'bg-primary/10',
        icon: 'timer',
        glow: '',
    },
    warning: {
        text: 'text-amber-400',
        bar: 'bg-amber-500',
        bg: 'bg-amber-500/10',
        icon: 'timer',
        glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    },
    critical: {
        text: 'text-red-400',
        bar: 'bg-red-500',
        bg: 'bg-red-500/10',
        icon: 'alarm',
        glow: 'shadow-[0_0_16px_rgba(239,68,68,0.4)]',
    },
};

export function InterviewTimer({ formatted, progress, urgency, isExpired }: InterviewTimerProps) {
    const styles = URGENCY_STYLES[urgency];

    return (
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border border-border-dark ${styles.bg} ${styles.glow} transition-all duration-300`}>
            <span className={`material-symbols-outlined text-[20px] ${styles.text} ${urgency === 'critical' ? 'animate-pulse' : ''}`}>
                {styles.icon}
            </span>

            {/* Time display */}
            <span className={`font-mono text-lg font-bold tabular-nums ${styles.text} ${isExpired ? 'line-through opacity-50' : ''}`}>
                {isExpired ? '00:00' : formatted}
            </span>

            {/* Progress bar */}
            <div className="w-20 h-1.5 bg-dashboard-card rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-linear ${styles.bar}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInterviewTimerOptions {
    /** Time limit in minutes */
    timeLimit: number;
    /** When the interview started (ISO string or Date) */
    startedAt: string | Date;
    /** Whether the timer is active */
    isActive: boolean;
    /** Called when time expires */
    onTimeUp?: () => void;
}

interface TimerState {
    /** Minutes remaining */
    minutes: number;
    /** Seconds remaining */
    seconds: number;
    /** Total seconds remaining */
    totalSecondsRemaining: number;
    /** Formatted time string (MM:SS) */
    formatted: string;
    /** Whether time has expired */
    isExpired: boolean;
    /** Progress percentage (100 = full, 0 = expired) */
    progress: number;
    /** Urgency level for visual cues */
    urgency: 'normal' | 'warning' | 'critical';
}

/**
 * Hook for managing interview countdown timer.
 * Calculates remaining time from startedAt + timeLimit,
 * updates every second, and fires onTimeUp when expired.
 */
export function useInterviewTimer({
    timeLimit,
    startedAt,
    isActive,
    onTimeUp,
}: UseInterviewTimerOptions): TimerState {
    const onTimeUpRef = useRef(onTimeUp);
    onTimeUpRef.current = onTimeUp;

    const hasExpiredRef = useRef(false);

    const calculateRemaining = useCallback((): number => {
        const start = new Date(startedAt).getTime();
        if (isNaN(start)) return 0;
        const endTime = start + timeLimit * 60 * 1000;
        const remaining = Math.max(0, endTime - Date.now());
        return Math.ceil(remaining / 1000);
    }, [startedAt, timeLimit]);

    const [totalSeconds, setTotalSeconds] = useState(() => calculateRemaining());

    useEffect(() => {
        if (!isActive) return;

        // Reset expired flag on reactivation
        hasExpiredRef.current = false;

        const interval = setInterval(() => {
            const remaining = calculateRemaining();
            setTotalSeconds(remaining);

            if (remaining <= 0 && !hasExpiredRef.current) {
                hasExpiredRef.current = true;
                onTimeUpRef.current?.();
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, calculateRemaining]);

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const totalTimeInSeconds = timeLimit * 60;
    const progress = totalTimeInSeconds > 0
        ? Math.max(0, Math.min(100, (totalSeconds / totalTimeInSeconds) * 100))
        : 0;

    let urgency: 'normal' | 'warning' | 'critical' = 'normal';
    if (totalSeconds <= 60) {
        urgency = 'critical'; // last minute
    } else if (totalSeconds <= 300) {
        urgency = 'warning'; // last 5 minutes
    }

    return {
        minutes,
        seconds,
        totalSecondsRemaining: totalSeconds,
        formatted: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        isExpired: totalSeconds <= 0,
        progress,
        urgency,
    };
}

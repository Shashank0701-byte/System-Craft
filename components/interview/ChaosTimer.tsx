'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ChaosTimerProps {
    introducedAt: Date | string;
    timeLimitMs?: number;
    onExpired?: () => void;
}

export function ChaosTimer({ introducedAt, timeLimitMs = 300000, onExpired }: ChaosTimerProps) {
    const onExpiredRef = useRef(onExpired);
    useEffect(() => {
        onExpiredRef.current = onExpired;
    }, [onExpired]);

    const calculateRemaining = useCallback((): number => {
        const start = new Date(introducedAt).getTime();
        const endTime = start + timeLimitMs;
        const remaining = Math.max(0, endTime - Date.now());
        return Math.ceil(remaining / 1000);
    }, [introducedAt, timeLimitMs]);

    const [secondsRemaining, setSecondsRemaining] = useState(() => calculateRemaining());

    useEffect(() => {
        const remainingInit = calculateRemaining();
        setSecondsRemaining(remainingInit);
        
        if (remainingInit <= 0) return;

        const interval = setInterval(() => {
            const current = calculateRemaining();
            setSecondsRemaining(current);
            if (current <= 0) {
                clearInterval(interval);
                onExpiredRef.current?.();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [calculateRemaining]);

    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const isExpired = secondsRemaining <= 0;

    return (
        <div className="flex items-center justify-center bg-red-600 text-white rounded-xl px-4 py-2 shadow-[0_0_20px_rgba(239,68,68,0.7)] hover:shadow-[0_0_25px_rgba(239,68,68,0.9)] transition-shadow border border-red-500/50">
            <span className="material-symbols-outlined mr-2 animate-pulse" style={{ fontSize: '24px' }}>warning</span>
            <div className="flex flex-col items-start leading-none justify-center">
                <span className="text-[9px] uppercase font-black tracking-widest opacity-90 mb-1">Evacuate / Mitigate</span>
                <span className="font-mono text-lg font-bold tabular-nums tracking-tight leading-none">
                    {isExpired ? '00:00' : formatted}
                </span>
            </div>
        </div>
    );
}

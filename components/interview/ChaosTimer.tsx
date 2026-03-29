'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { IConstraintChange } from '@/src/lib/db/models/InterviewSession';

interface ChaosTimerProps {
    constraint: IConstraintChange;
    onTimeout: (type: 'warning' | 'penalty', constraintId: string) => void;
}

export function ChaosTimer({ constraint, onTimeout }: ChaosTimerProps) {
    const onTimeoutRef = useRef(onTimeout);
    useEffect(() => {
        onTimeoutRef.current = onTimeout;
    }, [onTimeout]);

    // Fast-track values for testing (normally 5 mins and 2 mins)
    // Actually, stick to 5m and 2m per user requirement
    const WARNING_MS = 5 * 60 * 1000;
    const PENALTY_MS = 2 * 60 * 1000;

    const calculateRemaining = useCallback(() => {
        if (constraint.failedAt) return { remaining: 0, mode: 'failed' as const };
        
        const now = Date.now();
        if (constraint.overtimeAt) {
            const overtimeEnd = new Date(constraint.overtimeAt).getTime() + PENALTY_MS;
            return { remaining: Math.ceil(Math.max(0, overtimeEnd - now) / 1000), mode: 'overtime' as const };
        }

        const normalEnd = new Date(constraint.introducedAt).getTime() + WARNING_MS;
        const remaining = normalEnd - now;
        
        if (remaining <= 0) {
            // It hit 0 naturally but we haven't received DB overtime flag yet
            return { remaining: 0, mode: 'normal' as const };
        }
        return { remaining: Math.ceil(remaining / 1000), mode: 'normal' as const };
    }, [constraint]);

    const [state, setState] = useState(() => calculateRemaining());
    
    // To prevent spamming the effect while waiting for DB response
    const hasTriggeredWarning = useRef(false);
    const hasTriggeredPenalty = useRef(false);

    useEffect(() => {
        // Reset triggers if DB fields update
        if (constraint.overtimeAt) hasTriggeredWarning.current = false;
        if (constraint.failedAt) hasTriggeredPenalty.current = false;

        const interval = setInterval(() => {
            const current = calculateRemaining();
            setState(current);
            
            if (current.remaining <= 0) {
                if (current.mode === 'normal' && !constraint.overtimeAt && !hasTriggeredWarning.current) {
                    hasTriggeredWarning.current = true;
                    onTimeoutRef.current('warning', constraint.id);
                } else if (current.mode === 'overtime' && !constraint.failedAt && !hasTriggeredPenalty.current) {
                    hasTriggeredPenalty.current = true;
                    onTimeoutRef.current('penalty', constraint.id);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [calculateRemaining, constraint]);

    if (state.mode === 'failed') {
        return (
            <div className="flex items-center justify-center bg-gray-900 border border-slate-600 text-slate-400 rounded-xl px-4 py-2 shadow-inner">
                <span className="material-symbols-outlined mr-2 text-[20px]">error</span>
                <span className="font-mono text-xs font-bold tracking-widest uppercase">Unresolved Incident</span>
            </div>
        );
    }

    const minutes = Math.floor(state.remaining / 60);
    const seconds = state.remaining % 60;
    const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const isOvertime = state.mode === 'overtime';

    return (
        <div className={`flex items-center justify-center text-white rounded-xl px-4 py-2 hover:shadow-[0_0_25px_rgba(239,68,68,0.9)] transition-shadow border  ${isOvertime ? 'bg-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.7)] border-amber-500 animate-[pulse_1.5s_ease-in-out_infinite]' : 'bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.7)] border-red-500/50'}`}>
            <span className={`material-symbols-outlined mr-2 ${isOvertime ? 'text-amber-100' : 'animate-pulse'}`} style={{ fontSize: '24px' }}>warning</span>
            <div className="flex flex-col items-start leading-none justify-center">
                <span className={`text-[9px] uppercase font-black tracking-widest opacity-90 mb-1 ${isOvertime ? 'text-amber-100' : ''}`}>
                    {isOvertime ? 'Final 2 Minutes' : 'Address Failure'}
                </span>
                <span className={`font-mono text-lg font-bold tabular-nums tracking-tight leading-none ${isOvertime ? 'text-amber-100' : ''}`}>
                    {formatted}
                </span>
            </div>
        </div>
    );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { ICanvasNode, IConnection } from '../lib/db/models/Design';
import { IConstraintChange } from '../lib/db/models/InterviewSession';
import { authFetch } from '../lib/firebase/authClient';
import { LIVE_CHANGE_MIN_PROGRESS } from '../lib/interview/constraintTrigger';

export interface AIMessage {
    role: 'interviewer' | 'candidate';
    content: string;
    timestamp: string | Date;
}

interface HintResponse {
    message: string;
    severity: 'question' | 'nudge' | 'praise';
}

interface HintEndpointResponse {
    success: boolean;
    hint: HintResponse;
    message: AIMessage;
    constraintChange?: IConstraintChange | null;
}

interface UseInterviewAIProps {
    sessionId: string;
    stateRef: React.MutableRefObject<{ nodes: ICanvasNode[]; connections: IConnection[] } | null>;
    timeRemaining: number;
    initialMessages?: AIMessage[];
    onConstraintChange?: (change: IConstraintChange) => void;
    /** Session start time — used to arm chaos at 25% elapsed */
    startedAt?: string | Date;
    /** Interview length in minutes */
    timeLimit?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    /** Whether a live constraint has already been injected */
    hasConstraintChange?: boolean;
}

export function useInterviewAI({
    sessionId,
    stateRef,
    timeRemaining,
    initialMessages = [],
    onConstraintChange,
    startedAt,
    timeLimit,
    difficulty,
    hasConstraintChange = false,
}: UseInterviewAIProps) {
    const [messages, setMessages] = useState<AIMessage[]>(() => initialMessages);
    const [isThinking, setIsThinking] = useState(false);
    const hasInitializedMessagesRef = useRef(false);

    useEffect(() => {
        if (hasInitializedMessagesRef.current) return;
        if (initialMessages.length === 0) return;

        setMessages(initialMessages);
        hasInitializedMessagesRef.current = true;
    }, [initialMessages]);

    const isThinkingRef = useRef(isThinking);
    useEffect(() => {
        isThinkingRef.current = isThinking;
    }, [isThinking]);

    const timeRemainingRef = useRef(timeRemaining);
    useEffect(() => {
        timeRemainingRef.current = timeRemaining;
    }, [timeRemaining]);

    const hasConstraintChangeRef = useRef(hasConstraintChange);
    useEffect(() => {
        hasConstraintChangeRef.current = hasConstraintChange;
    }, [hasConstraintChange]);

    const hasStartedRef = useRef(false);
    const lastHintTimeRef = useRef(Date.now());
    const chaosArmScheduledRef = useRef(false);

    // Trigger an AI analysis
    const requestHint = useCallback(async (candidateReply?: string) => {
        try {
            if (isThinkingRef.current) return;
            isThinkingRef.current = true;
            setIsThinking(true);

            const currentState = stateRef.current;
            const nodes = currentState?.nodes || [];
            const connections = currentState?.connections || [];

            const response = await authFetch(`/api/interview/${sessionId}/hint`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nodes,
                    connections,
                    timeRemaining: timeRemainingRef.current,
                    candidateReply
                })
            });

            if (!response.ok) {
                throw new Error(`Hint request failed: ${response.statusText}`);
            }

            const data = await response.json() as HintEndpointResponse;

            // Update local message list
            setMessages(prev => {
                const next = [...prev];
                if (candidateReply) {
                    next.push({ role: 'candidate', content: candidateReply, timestamp: new Date() });
                }
                if (data.message) {
                    next.push(data.message);
                }
                return next;
            });

            if (data.constraintChange) {
                hasConstraintChangeRef.current = true;
                onConstraintChange?.(data.constraintChange);
            }

            lastHintTimeRef.current = Date.now();
        } catch (error) {
            console.error('Failed to request AI hint:', error);
        } finally {
            isThinkingRef.current = false;
            setIsThinking(false);
        }
    }, [sessionId, stateRef, onConstraintChange]);

    // Periodic polling - e.g., every 5 minutes in ms (300,000 ms)
    useEffect(() => {
        let startTimeout: NodeJS.Timeout | null = null;

        // Only start polling once the component is ready
        if (!hasStartedRef.current) {
            hasStartedRef.current = true;
            // Start a timer for the first check-in a bit early (e.g. 2 minutes)
            startTimeout = setTimeout(() => {
                requestHint();
            }, 120000);
        }

        const interval = setInterval(() => {
            // 5 minutes
            if (Date.now() - lastHintTimeRef.current >= 300000) {
                requestHint();
            }
        }, 60000); // Check every minute if 5 mins have passed since last interaction

        return () => {
            clearInterval(interval);
            if (startTimeout) clearTimeout(startTimeout);
        };
    }, [requestHint]);

    // Dedicated chaos arm: one attempt at 25% elapsed + one safety retry ~60s later
    useEffect(() => {
        if (chaosArmScheduledRef.current) return;
        if (!startedAt || !timeLimit || timeLimit <= 0) return;
        if (!difficulty || !['medium', 'hard'].includes(difficulty)) return;
        if (hasConstraintChange) return;

        const startedMs = new Date(startedAt).getTime();
        if (isNaN(startedMs)) return;

        chaosArmScheduledRef.current = true;

        const armAtMs = startedMs + LIVE_CHANGE_MIN_PROGRESS * timeLimit * 60 * 1000;
        const delayMs = Math.max(0, armAtMs - Date.now());

        const armTimeout = setTimeout(() => {
            if (!hasConstraintChangeRef.current) {
                requestHint();
            }
        }, delayMs);

        const retryTimeout = setTimeout(() => {
            if (!hasConstraintChangeRef.current) {
                requestHint();
            }
        }, delayMs + 60_000);

        return () => {
            clearTimeout(armTimeout);
            clearTimeout(retryTimeout);
            // Allow reschedule if session metadata changes before arming
            chaosArmScheduledRef.current = false;
        };
    }, [startedAt, timeLimit, difficulty, hasConstraintChange, requestHint]);

    const sendReply = useCallback((text: string) => {
        return requestHint(text);
    }, [requestHint]);

    return {
        messages,
        isThinking,
        sendReply,
        /**
         * Exposed strictly for synchronizing external AI messages generated
         * via backend webhooks/events (e.g. final-validation, chaos-timeout).
         * Do not use this to bypass `requestHint` or `sendReply`.
         */
        setMessages
    };
}

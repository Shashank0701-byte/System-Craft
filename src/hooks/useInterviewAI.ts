import { useState, useEffect, useCallback, useRef } from 'react';
import { ICanvasNode, IConnection } from '../lib/db/models/Design';
import { IConstraintChange } from '../lib/db/models/InterviewSession';
import { authFetch } from '../lib/firebase/authClient';

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
}

export function useInterviewAI({
    sessionId,
    stateRef,
    timeRemaining,
    initialMessages = [],
    onConstraintChange
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

    const hasStartedRef = useRef(false);
    const lastHintTimeRef = useRef(Date.now());

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

    const sendReply = useCallback((text: string) => {
        return requestHint(text);
    }, [requestHint]);

    return {
        messages,
        isThinking,
        sendReply,
        setMessages
    };
}

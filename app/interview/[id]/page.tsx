'use client';

import { useEffect, useState, useCallback, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { authFetch } from '@/src/lib/firebase/authClient';
import { useInterviewTimer } from '@/src/hooks/useInterviewTimer';
import { InterviewHeader } from '@/components/interview/InterviewHeader';
import { QuestionPanel } from '@/components/interview/QuestionPanel';
import { ComponentPalette } from '@/components/canvas/ComponentPalette';
import { DesignCanvas, CanvasNode, Connection } from '@/components/canvas/DesignCanvas';
import { PropertiesPanel } from '@/components/canvas/PropertiesPanel';

interface InterviewSessionData {
    id: string;
    question: {
        prompt: string;
        requirements: string[];
        constraints: string[];
        trafficProfile: { users?: string; rps?: string; storage?: string };
        hints: string[];
    };
    difficulty: 'easy' | 'medium' | 'hard';
    timeLimit: number;
    startedAt: string;
    submittedAt?: string;
    status: 'in_progress' | 'submitted' | 'evaluating' | 'evaluated';
    canvasSnapshot: {
        nodes: CanvasNode[];
        connections: Connection[];
    };
    evaluation?: unknown;
}

interface PageProps {
    params: Promise<{ id: string }>;
}

const AUTO_SAVE_DEBOUNCE_MS = 2000;

export default function InterviewCanvasPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth();
    const [session, setSession] = useState<InterviewSessionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showHints, setShowHints] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Refs for save logic
    const isSavingRef = useRef(false);
    const pendingSaveRef = useRef<{ nodes: CanvasNode[]; connections: Connection[] } | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const statusResetRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    // Interview timer
    const timer = useInterviewTimer({
        timeLimit: session?.timeLimit || 45,
        startedAt: session?.startedAt || new Date().toISOString(),
        isActive: session?.status === 'in_progress',
        onTimeUp: () => {
            // Auto-submit when time expires
            handleSubmit();
        },
    });

    // Fetch session data
    const fetchSession = useCallback(async () => {
        if (!user?.uid || !id) return;
        try {
            setIsLoading(true);
            const response = await authFetch(`/api/interview/${id}`);
            if (!response.ok) {
                if (response.status === 404) throw new Error('Interview session not found');
                if (response.status === 400) throw new Error('Invalid session ID');
                throw new Error('Failed to load interview');
            }
            const data = await response.json();
            setSession(data.session);
        } catch (err) {
            console.error('Error fetching session:', err);
            setError(err instanceof Error ? err.message : 'Failed to load interview');
        } finally {
            setIsLoading(false);
        }
    }, [user?.uid, id]);

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchSession();
        }
    }, [isAuthenticated, user, fetchSession]);

    // Perform auto-save to API
    const performSave = useCallback(async (nodes: CanvasNode[], connections: Connection[]) => {
        if (!isMountedRef.current || session?.status !== 'in_progress') return;

        isSavingRef.current = true;
        setSaveStatus('saving');

        try {
            const response = await authFetch(`/api/interview/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ action: 'save', nodes, connections }),
            });

            if (!isMountedRef.current) return;

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error('Auto-save failed:', response.status, errData);
                setSaveStatus('error');
            } else {
                setSaveStatus('saved');
                if (statusResetRef.current) clearTimeout(statusResetRef.current);
                statusResetRef.current = setTimeout(() => {
                    if (isMountedRef.current) setSaveStatus('idle');
                }, 2000);
            }
        } catch (err) {
            console.error('Error auto-saving:', err);
            if (isMountedRef.current) setSaveStatus('error');
        } finally {
            isSavingRef.current = false;

            // Process pending save
            if (pendingSaveRef.current && isMountedRef.current) {
                const pending = pendingSaveRef.current;
                pendingSaveRef.current = null;
                setTimeout(() => {
                    if (isMountedRef.current) performSave(pending.nodes, pending.connections);
                }, 100);
            }
        }
    }, [id, session?.status]);

    // Debounced save
    const saveDesign = useCallback((nodes: CanvasNode[], connections: Connection[]) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        if (isSavingRef.current) {
            pendingSaveRef.current = { nodes, connections };
            return;
        }

        pendingSaveRef.current = { nodes, connections };

        saveTimeoutRef.current = setTimeout(() => {
            saveTimeoutRef.current = null;
            if (pendingSaveRef.current) {
                const data = pendingSaveRef.current;
                pendingSaveRef.current = null;
                performSave(data.nodes, data.connections);
            }
        }, AUTO_SAVE_DEBOUNCE_MS);
    }, [performSave]);

    // Submit the interview
    const handleSubmit = useCallback(async () => {
        if (!session || session.status !== 'in_progress' || isSubmitting) return;

        try {
            setIsSubmitting(true);
            const response = await authFetch(`/api/interview/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ action: 'submit' }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to submit');
            }

            // Update local state
            setSession(prev => prev ? { ...prev, status: 'submitted', submittedAt: new Date().toISOString() } : null);
            setSubmitError(null);
        } catch (err) {
            console.error('Error submitting:', err);
            setSubmitError(err instanceof Error ? err.message : 'Failed to submit');
        } finally {
            setIsSubmitting(false);
        }
    }, [session, id, isSubmitting]);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (statusResetRef.current) clearTimeout(statusResetRef.current);

            // Flush pending save
            if (pendingSaveRef.current) {
                const data = pendingSaveRef.current;
                authFetch(`/api/interview/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ action: 'save', nodes: data.nodes, connections: data.connections }),
                }).catch(() => { });
                pendingSaveRef.current = null;
            }
        };
    }, [id]);

    // Loading state
    if (authLoading || isLoading) {
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-background-dark">
                <div className="h-14 border-b border-border-dark bg-sidebar-bg-dark" />
                <div className="flex flex-1 items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-400">Loading interview...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !session) {
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-background-dark">
                <div className="h-14 border-b border-border-dark bg-sidebar-bg-dark" />
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-center max-w-md">
                        <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
                        <h2 className="text-xl font-bold text-white mb-2">Failed to Load</h2>
                        <p className="text-slate-400 mb-6">{error || 'Session not found'}</p>
                        <a
                            href="/interview"
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium"
                        >
                            Back to Interviews
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    const isReadOnly = session.status !== 'in_progress';

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background-dark text-white font-display">
            <InterviewHeader
                difficulty={session.difficulty}
                saveStatus={saveStatus}
                timer={timer}
                status={session.status}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />

            {/* Submit Error Banner */}
            {submitError && (
                <div className="bg-red-500/10 border-y border-red-500/20 px-6 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                        <span className="material-symbols-outlined text-[18px]">error</span>
                        <span>Submission failed: {submitError}</span>
                    </div>
                    <button
                        onClick={() => setSubmitError(null)}
                        className="text-xs text-red-400 underline hover:no-underline font-medium cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Question Panel - left sidebar */}
                <div className="w-[320px] flex-shrink-0">
                    <QuestionPanel
                        question={session.question}
                        difficulty={session.difficulty}
                        showHints={showHints}
                        onToggleHints={() => setShowHints(prev => !prev)}
                    />
                </div>

                {/* Component Palette */}
                {!isReadOnly && <ComponentPalette />}

                {/* Canvas */}
                <DesignCanvas
                    initialNodes={session.canvasSnapshot?.nodes || []}
                    initialConnections={session.canvasSnapshot?.connections || []}
                    onSave={isReadOnly ? undefined : saveDesign}
                />

                {/* Properties Panel */}
                <PropertiesPanel />
            </div>

            {/* Submitted Overlay */}
            {isReadOnly && (
                <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
                        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-dashboard-card/95 backdrop-blur-sm border border-border-dark shadow-2xl">
                            <span className="material-symbols-outlined text-emerald-400 text-[20px]">lock</span>
                            <span className="text-sm text-slate-300">
                                This interview has been <span className="font-bold text-white">{session.status === 'submitted' ? 'submitted' : session.status}</span>.
                                The canvas is read-only.
                            </span>
                            <button
                                onClick={() => router.push('/interview')}
                                className="ml-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-sm rounded-lg font-medium transition-colors cursor-pointer"
                            >
                                Back to Interviews
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

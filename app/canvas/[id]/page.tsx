'use client';

import { useEffect, useState, useCallback, use, useRef } from 'react';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { authFetch } from '@/src/lib/firebase/authClient';
import { CanvasHeader } from '@/components/canvas/CanvasHeader';
import { ComponentPalette } from '@/components/canvas/ComponentPalette';
import { DesignCanvas, CanvasNode, Connection } from '@/components/canvas/DesignCanvas';
import PropertiesPanel from '@/components/canvas/PropertiesPanel';
import { CanvasPanelsProvider } from '@/components/canvas/CanvasPanelsContext';

interface DesignData {
    id: string;
    title: string;
    description?: string;
    status: string;
    nodes: CanvasNode[];
    connections: Connection[];
    whiteboardData?: string;
}

interface PendingSave {
    nodes: CanvasNode[];
    connections: Connection[];
    whiteboardData?: string;
    retryCount: number;
}

interface PageProps {
    params: Promise<{ id: string }>;
}

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

export default function CanvasPage({ params }: PageProps) {
    const { id } = use(params);
    const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth();
    const [design, setDesign] = useState<DesignData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Ref-based save tracking to prevent dropped saves
    const isSavingRef = useRef(false);
    const pendingSaveRef = useRef<PendingSave | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const statusResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    // Track latest debounced data so it can be flushed on unmount
    const latestDebouncedDataRef = useRef<{ nodes: CanvasNode[]; connections: Connection[]; whiteboardData?: string } | null>(null);

    // Fetch design data
    const fetchDesign = useCallback(async () => {
        if (!user?.uid || !id) return;

        try {
            setIsLoading(true);
            const response = await authFetch(`/api/designs/${id}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Design not found');
                }
                if (response.status === 400) {
                    throw new Error('Invalid design ID');
                }
                throw new Error('Failed to load design');
            }

            const data = await response.json();
            setDesign(data.design);
        } catch (err) {
            console.error('Error fetching design:', err);
            setError(err instanceof Error ? err.message : 'Failed to load design');
        } finally {
            setIsLoading(false);
        }
    }, [user?.uid, id]);

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchDesign();
        }
    }, [isAuthenticated, user, fetchDesign]);

    // Perform save with retry logic and exponential backoff
    const performSave = useCallback(async (nodes: CanvasNode[], connections: Connection[], whiteboardData?: string, retryCount = 0) => {
        if (!isMountedRef.current) return;

        isSavingRef.current = true;
        setSaveStatus('saving');

        try {
            const response = await authFetch(`/api/designs/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ nodes, connections, whiteboardData }),
            });

            if (!isMountedRef.current) return;

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                console.error('Save failed:', data.error);

                // Schedule retry with exponential backoff if under limit
                if (retryCount < MAX_RETRIES && isMountedRef.current) {
                    const delay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
                    console.log(`Retrying save in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);

                    retryTimeoutRef.current = setTimeout(() => {
                        if (isMountedRef.current) {
                            performSave(nodes, connections, whiteboardData, retryCount + 1);
                        }
                    }, delay);
                    return; // Don't set isSavingRef to false yet
                }

                // Max retries exceeded
                setSaveStatus('error');
            } else {
                setSaveStatus('saved');
                // Clear previous status reset timeout
                if (statusResetTimeoutRef.current) {
                    clearTimeout(statusResetTimeoutRef.current);
                }
                // Reset to idle after 2 seconds
                statusResetTimeoutRef.current = setTimeout(() => {
                    if (isMountedRef.current) {
                        setSaveStatus('idle');
                    }
                }, 2000);
            }
        } catch (err) {
            console.error('Error saving design:', err);

            // Schedule retry with exponential backoff if under limit
            if (retryCount < MAX_RETRIES && isMountedRef.current) {
                const delay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
                console.log(`Retrying save in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);

                retryTimeoutRef.current = setTimeout(() => {
                    if (isMountedRef.current) {
                        performSave(nodes, connections, whiteboardData, retryCount + 1);
                    }
                }, delay);
                return; // Don't set isSavingRef to false yet
            }

            if (isMountedRef.current) {
                setSaveStatus('error');
            }
        } finally {
            // Only mark as not saving if we're not retrying
            if (!retryTimeoutRef.current || retryCount >= MAX_RETRIES) {
                isSavingRef.current = false;
            }

            // Process pending save if there is one (new edits during save)
            if (pendingSaveRef.current && isMountedRef.current && !retryTimeoutRef.current) {
                const pending = pendingSaveRef.current;
                pendingSaveRef.current = null;
                // Use setTimeout to break potential tight loop
                setTimeout(() => {
                    if (isMountedRef.current) {
                        performSave(pending.nodes, pending.connections, pending.whiteboardData, 0);
                    }
                }, 100);
            }
        }
    }, [id]);

    // Save design with debounce and queue for pending changes
    const saveDesign = useCallback((nodes: CanvasNode[], connections: Connection[], whiteboardData?: string) => {
        // Clear any pending debounce timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        // Always store latest data for potential unmount flush
        latestDebouncedDataRef.current = { nodes, connections, whiteboardData };

        // If already saving, queue this save with reset retry count
        if (isSavingRef.current) {
            pendingSaveRef.current = { nodes, connections, whiteboardData, retryCount: 0 };
            return;
        }

        // Also store in pendingSaveRef so unmount can detect pending debounced saves
        pendingSaveRef.current = { nodes, connections, whiteboardData, retryCount: 0 };

        // Debounce by 1.5 seconds
        saveTimeoutRef.current = setTimeout(() => {
            saveTimeoutRef.current = null;
            latestDebouncedDataRef.current = null;

            if (pendingSaveRef.current) {
                const data = pendingSaveRef.current;
                pendingSaveRef.current = null;
                performSave(data.nodes, data.connections, data.whiteboardData, 0);
            }
        }, 1500);
    }, [performSave]);

    // Track mounted state and cleanup all timeouts
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;

            // Clear all timeouts
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }
            if (statusResetTimeoutRef.current) {
                clearTimeout(statusResetTimeoutRef.current);
                statusResetTimeoutRef.current = null;
            }

            // Flush any pending/debounced save on unmount (fire-and-forget)
            const dataToFlush = pendingSaveRef.current ||
                (latestDebouncedDataRef.current ? { ...latestDebouncedDataRef.current, retryCount: 0 } : null);

            if (dataToFlush) {
                authFetch(`/api/designs/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ nodes: dataToFlush.nodes, connections: dataToFlush.connections, whiteboardData: dataToFlush.whiteboardData }),
                }).catch(() => {
                    // Silently fail - component is unmounting
                });
                pendingSaveRef.current = null;
                latestDebouncedDataRef.current = null;
            }
        };
    }, [id]);

    // Handle title change
    const handleTitleChange = useCallback(async (newTitle: string) => {
        if (!design || !isMountedRef.current) return;

        // Store previous title for revert (avoid stale closure)
        const previousTitle = design.title;

        // Optimistically update local state
        setDesign(prev => prev ? { ...prev, title: newTitle } : null);

        // Save to API
        setSaveStatus('saving');
        try {
            const response = await authFetch(`/api/designs/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ title: newTitle }),
            });

            if (!isMountedRef.current) return;

            if (!response.ok) {
                throw new Error('Failed to update title');
            }

            setSaveStatus('saved');
            if (statusResetTimeoutRef.current) {
                clearTimeout(statusResetTimeoutRef.current);
            }
            statusResetTimeoutRef.current = setTimeout(() => {
                if (isMountedRef.current) {
                    setSaveStatus('idle');
                }
            }, 2000);
        } catch (err) {
            console.error('Error updating title:', err);
            if (!isMountedRef.current) return;

            setSaveStatus('error');
            // Revert on error using captured previousTitle (not stale closure)
            setDesign(prev => prev ? { ...prev, title: previousTitle } : null);
        }
    }, [design, id]);

    // Loading state
    if (authLoading || isLoading) {
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-[#060810]">
                {/* Header placeholder */}
                <div className="h-14 border-b border-white/[0.03] bg-[#0c0d16]/90 flex items-center px-4">
                    <div className="w-32 h-4 bg-white/[0.03] rounded animate-pulse" />
                </div>
                {/* Main loading area */}
                <div className="flex flex-1 items-center justify-center relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(6,8,16,0.6)_100%)] pointer-events-none" />
                    <div className="flex flex-col items-center gap-6 z-10">
                        <div className="relative flex items-center justify-center">
                            <div className="w-16 h-16 border border-cyan-500/20 rounded-full absolute animate-ping" />
                            <div className="w-12 h-12 border border-cyan-500/40 rounded-full absolute animate-[spin_3s_linear_infinite]" />
                            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                            <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-cyan-400 font-bold">Initializing Workspace</p>
                            <p className="text-[8px] font-mono tracking-wider uppercase text-white/30">Loading architecture state & nodes...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-[#060810]">
                {/* Header placeholder */}
                <div className="h-14 border-b border-white/[0.03] bg-[#0c0d16]/90 flex items-center px-4">
                    <div className="flex items-center gap-2 text-white/40 font-mono text-[10px] uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        <span>System Error</span>
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-center relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(6,8,16,0.6)_100%)] pointer-events-none" />
                    <div className="text-center max-w-md z-10 p-8 border border-red-500/20 bg-red-500/5 rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.05)] backdrop-blur-xl">
                        <span className="material-symbols-outlined text-4xl text-red-400 mb-4 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">gpp_bad</span>
                        <h2 className="text-[12px] font-mono font-bold text-white mb-2 uppercase tracking-widest">Failed to Load Workspace</h2>
                        <p className="text-[9px] font-mono text-red-400/80 mb-8 uppercase tracking-wider">{error}</p>
                        <a
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all hover:border-white/20"
                        >
                            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                            Return to Dashboard
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <CanvasPanelsProvider>
            <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
                <CanvasHeader
                    title={design?.title || 'Untitled Design'}
                    saveStatus={saveStatus}
                    onTitleChange={handleTitleChange}
                />
                <div className="flex flex-1 overflow-hidden">
                    <ComponentPalette />
                    <DesignCanvas
                        initialNodes={design?.nodes || []}
                        initialConnections={design?.connections || []}
                        initialWhiteboardData={design?.whiteboardData}
                        onSave={saveDesign}
                        enableWhiteboard
                    />
                    <PropertiesPanel />
                </div>
            </div>
        </CanvasPanelsProvider>
    );
}


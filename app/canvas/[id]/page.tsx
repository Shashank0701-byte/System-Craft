'use client';

import { useEffect, useState, useCallback, use, useRef } from 'react';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { authFetch } from '@/src/lib/firebase/authClient';
import { CanvasHeader } from '@/components/canvas/CanvasHeader';
import { ComponentPalette } from '@/components/canvas/ComponentPalette';
import { DesignCanvas, CanvasNode, Connection } from '@/components/canvas/DesignCanvas';
import { PropertiesPanel } from '@/components/canvas/PropertiesPanel';

interface DesignData {
    id: string;
    title: string;
    description?: string;
    status: string;
    nodes: CanvasNode[];
    connections: Connection[];
}

interface PendingSave {
    nodes: CanvasNode[];
    connections: Connection[];
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
    const latestDebouncedDataRef = useRef<{ nodes: CanvasNode[]; connections: Connection[] } | null>(null);

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
    const performSave = useCallback(async (nodes: CanvasNode[], connections: Connection[], retryCount = 0) => {
        if (!isMountedRef.current) return;

        isSavingRef.current = true;
        setSaveStatus('saving');

        try {
            const response = await authFetch(`/api/designs/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ nodes, connections }),
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
                            performSave(nodes, connections, retryCount + 1);
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
                        performSave(nodes, connections, retryCount + 1);
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
                        performSave(pending.nodes, pending.connections, 0);
                    }
                }, 100);
            }
        }
    }, [id]);

    // Save design with debounce and queue for pending changes
    const saveDesign = useCallback((nodes: CanvasNode[], connections: Connection[]) => {
        // Clear any pending debounce timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        // Always store latest data for potential unmount flush
        latestDebouncedDataRef.current = { nodes, connections };

        // If already saving, queue this save with reset retry count
        if (isSavingRef.current) {
            pendingSaveRef.current = { nodes, connections, retryCount: 0 };
            return;
        }

        // Also store in pendingSaveRef so unmount can detect pending debounced saves
        pendingSaveRef.current = { nodes, connections, retryCount: 0 };

        // Debounce by 1.5 seconds
        saveTimeoutRef.current = setTimeout(() => {
            saveTimeoutRef.current = null;
            latestDebouncedDataRef.current = null;

            if (pendingSaveRef.current) {
                const data = pendingSaveRef.current;
                pendingSaveRef.current = null;
                performSave(data.nodes, data.connections, 0);
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
                    body: JSON.stringify({ nodes: dataToFlush.nodes, connections: dataToFlush.connections }),
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
        if (!design) return;

        // Optimistically update local state
        setDesign(prev => prev ? { ...prev, title: newTitle } : null);

        // Save to API
        setSaveStatus('saving');
        try {
            const response = await authFetch(`/api/designs/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ title: newTitle }),
            });

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
            setSaveStatus('error');
            // Revert on error
            setDesign(prev => prev ? { ...prev, title: design.title } : null);
        }
    }, [design, id]);

    // Loading state
    if (authLoading || isLoading) {
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-background-dark">
                <div className="h-16 border-b border-border-dark bg-sidebar-bg-dark" />
                <div className="flex flex-1 items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-400">Loading canvas...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-background-dark">
                <div className="h-16 border-b border-border-dark bg-sidebar-bg-dark" />
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-center max-w-md">
                        <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
                        <h2 className="text-xl font-bold text-white mb-2">Failed to Load</h2>
                        <p className="text-slate-400 mb-6">{error}</p>
                        <a
                            href="/dashboard"
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium"
                        >
                            Back to Dashboard
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
                    onSave={saveDesign}
                />
                <PropertiesPanel />
            </div>
        </div>
    );
}


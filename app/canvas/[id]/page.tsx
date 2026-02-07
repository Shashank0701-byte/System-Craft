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

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function CanvasPage({ params }: PageProps) {
    const { id } = use(params);
    const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth();
    const [design, setDesign] = useState<DesignData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Ref-based save tracking to prevent dropped saves
    const isSavingRef = useRef(false);
    const pendingSaveRef = useRef<{ nodes: CanvasNode[]; connections: Connection[] } | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const statusResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

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

    // Perform save with retry for pending changes
    const performSave = useCallback(async (nodes: CanvasNode[], connections: Connection[]) => {
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
            if (isMountedRef.current) {
                setSaveStatus('error');
            }
        } finally {
            isSavingRef.current = false;

            // Check if there's a pending save
            if (pendingSaveRef.current && isMountedRef.current) {
                const pending = pendingSaveRef.current;
                pendingSaveRef.current = null;
                // Schedule the pending save
                performSave(pending.nodes, pending.connections);
            }
        }
    }, [id]);

    // Save design with queue for pending changes
    const saveDesign = useCallback((nodes: CanvasNode[], connections: Connection[]) => {
        // Clear any pending debounce timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // If already saving, queue this save
        if (isSavingRef.current) {
            pendingSaveRef.current = { nodes, connections };
            return;
        }

        // Debounce by 1.5 seconds
        saveTimeoutRef.current = setTimeout(() => {
            performSave(nodes, connections);
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
            }
            if (statusResetTimeoutRef.current) {
                clearTimeout(statusResetTimeoutRef.current);
            }

            // Flush pending save on unmount (fire-and-forget)
            if (pendingSaveRef.current) {
                const pending = pendingSaveRef.current;
                authFetch(`/api/designs/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(pending),
                }).catch(() => {
                    // Silently fail - component is unmounting
                });
            }
        };
    }, [id]);

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

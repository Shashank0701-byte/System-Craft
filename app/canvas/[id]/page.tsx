'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
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
    const [isSaving, setIsSaving] = useState(false);

    // Fetch design data
    const fetchDesign = useCallback(async () => {
        if (!user?.uid || !id) return;

        try {
            setIsLoading(true);
            const response = await fetch(`/api/designs/${id}?firebaseUid=${user.uid}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Design not found');
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

    // Auto-save function
    const saveDesign = useCallback(async (nodes: CanvasNode[], connections: Connection[]) => {
        if (!user?.uid || !id || isSaving) return;

        try {
            setIsSaving(true);
            await fetch(`/api/designs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firebaseUid: user.uid,
                    nodes,
                    connections,
                }),
            });
        } catch (err) {
            console.error('Error saving design:', err);
        } finally {
            setIsSaving(false);
        }
    }, [user?.uid, id, isSaving]);

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
                isSaving={isSaving}
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

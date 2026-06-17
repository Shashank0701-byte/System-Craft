'use client';

import { Excalidraw, serializeAsJSON } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import { useCallback, useEffect, useRef, useState } from 'react';

interface WhiteboardProps {
    initialData?: string;
    onSave?: (data: string) => void;
    readOnly?: boolean;
}

export default function WhiteboardClient({ initialData, onSave, readOnly = false }: WhiteboardProps) {
    const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoadRef = useRef(true);

    // Parse initial data for Excalidraw
    const initialDataState: ExcalidrawInitialDataState | undefined = (() => {
        if (!initialData) return undefined;
        try {
            const parsed = JSON.parse(initialData);
            return {
                elements: parsed.elements || [],
                appState: parsed.appState || {},
                files: parsed.files || undefined,
            };
        } catch {
            return undefined;
        }
    })();

    const handleChange = useCallback((elements: readonly any[], appState: any, files: any) => {
        if (!onSave || readOnly) return;

        // Skip the initial load event
        if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            return;
        }

        // Debounce saves
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            const data = JSON.stringify({
                elements: elements,
                appState: {
                    // Only persist view-related state, not transient UI state
                    viewBackgroundColor: appState.viewBackgroundColor,
                    gridSize: appState.gridSize,
                    gridColor: appState.gridColor,
                    gridStep: appState.gridStep,
                    zoom: appState.zoom,
                    scrollX: appState.scrollX,
                    scrollY: appState.scrollY,
                },
                files: files || {},
            });
            onSave(data);
        }, 1500);
    }, [onSave, readOnly]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div style={{ position: 'absolute', inset: 0 }}>
            <Excalidraw
                excalidrawAPI={(api) => setExcalidrawAPI(api)}
                initialData={initialDataState}
                onChange={handleChange}
                viewModeEnabled={readOnly}
                theme="dark"
                UIOptions={{
                    canvasActions: {
                        loadScene: false,
                        export: false,
                    },
                }}
            />
        </div>
    );
}

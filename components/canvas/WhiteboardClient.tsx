'use client';

import { Tldraw, Editor, getSnapshot, loadSnapshot } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useCallback, useEffect, useState, useRef } from 'react';

interface WhiteboardProps {
    initialData?: string;
    onSave?: (data: string) => void;
    readOnly?: boolean;
}

export default function WhiteboardClient({ initialData, onSave, readOnly = false }: WhiteboardProps) {
    const [editor, setEditor] = useState<Editor | null>(null);
    const isInitialLoadRef = useRef(true);

    const handleMount = useCallback((editor: Editor) => {
        setEditor(editor);

        if (initialData) {
            try {
                const snapshot = JSON.parse(initialData);
                loadSnapshot(editor.store, snapshot);
            } catch (error) {
                console.error("Failed to load whiteboard data", error);
            }
        }
    }, [initialData]);

    // Track changes for saving
    useEffect(() => {
        if (!editor || readOnly || !onSave) return;

        // Debounced save
        let timeoutId: NodeJS.Timeout;

        const cleanup = editor.store.listen(() => {
            if (isInitialLoadRef.current) {
                isInitialLoadRef.current = false;
                return;
            }

            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const snapshot = getSnapshot(editor.store);
                onSave(JSON.stringify(snapshot));
            }, 1000); // Save after 1 second of inactivity
        });

        return () => {
            cleanup();
            clearTimeout(timeoutId);
        };
    }, [editor, readOnly, onSave]);

    return (
        <div className="w-full h-full relative" style={{ zIndex: 10 }}>
            <Tldraw 
                onMount={handleMount}
                hideUi={readOnly}
            />
        </div>
    );
}

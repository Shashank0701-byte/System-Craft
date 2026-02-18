'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface CanvasPanelsContextType {
    leftOpen: boolean;
    rightOpen: boolean;
    toggleLeft: () => void;
    toggleRight: () => void;
    closeAll: () => void;
}

const CanvasPanelsContext = createContext<CanvasPanelsContextType>({
    leftOpen: false,
    rightOpen: false,
    toggleLeft: () => { },
    toggleRight: () => { },
    closeAll: () => { },
});

export function CanvasPanelsProvider({ children }: { children: ReactNode }) {
    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);

    const toggleLeft = useCallback(() => {
        setLeftOpen(prev => !prev);
        setRightOpen(false);
    }, []);

    const toggleRight = useCallback(() => {
        setRightOpen(prev => !prev);
        setLeftOpen(false);
    }, []);

    const closeAll = useCallback(() => {
        setLeftOpen(false);
        setRightOpen(false);
    }, []);

    const value = useMemo(() => ({
        leftOpen, rightOpen, toggleLeft, toggleRight, closeAll,
    }), [leftOpen, rightOpen, toggleLeft, toggleRight, closeAll]);

    return (
        <CanvasPanelsContext.Provider value={value}>
            {children}
        </CanvasPanelsContext.Provider>
    );
}

export const useCanvasPanels = () => useContext(CanvasPanelsContext);

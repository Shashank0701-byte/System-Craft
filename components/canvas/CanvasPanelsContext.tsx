'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

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

    const toggleLeft = () => {
        setLeftOpen(prev => !prev);
        setRightOpen(false); // Close the other panel
    };

    const toggleRight = () => {
        setRightOpen(prev => !prev);
        setLeftOpen(false); // Close the other panel
    };

    const closeAll = () => {
        setLeftOpen(false);
        setRightOpen(false);
    };

    return (
        <CanvasPanelsContext.Provider value={{ leftOpen, rightOpen, toggleLeft, toggleRight, closeAll }}>
            {children}
        </CanvasPanelsContext.Provider>
    );
}

export const useCanvasPanels = () => useContext(CanvasPanelsContext);

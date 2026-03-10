'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface SidebarContextType {
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
    isOpen: false,
    toggle: () => { },
    close: () => { },
});

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar on route change
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsOpen(false);
    }, [pathname]);

    // Close on Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        if (isOpen) document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <SidebarContext.Provider value={{
            isOpen,
            toggle: () => setIsOpen(prev => !prev),
            close: () => setIsOpen(false),
        }}>
            {children}
        </SidebarContext.Provider>
    );
}

export const useSidebar = () => useContext(SidebarContext);

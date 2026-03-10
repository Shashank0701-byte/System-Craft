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
    const [isOpenState, setIsOpenState] = useState(false);
    const [openedByPathname, setOpenedByPathname] = useState<string | null>(null);
    const pathname = usePathname();

    const isOpen = isOpenState && openedByPathname === pathname;

    // Close on Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpenState(false);
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
            toggle: () => {
                if (isOpen) {
                    setIsOpenState(false);
                } else {
                    setIsOpenState(true);
                    setOpenedByPathname(pathname);
                }
            },
            close: () => setIsOpenState(false),
        }}>
            {children}
        </SidebarContext.Provider>
    );
}

export const useSidebar = () => useContext(SidebarContext);

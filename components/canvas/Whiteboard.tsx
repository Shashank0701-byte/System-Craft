'use client';

import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled — the canvas API requires browser environment
const DynamicWhiteboard = dynamic(
    () => import('./WhiteboardClient'),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center w-full h-full bg-[#060810]">
                <div className="w-8 h-8 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
            </div>
        ),
    }
);

interface WhiteboardProps {
    initialData?: string;
    onSave?: (data: string) => void;
    readOnly?: boolean;
}

export function Whiteboard(props: WhiteboardProps) {
    return <DynamicWhiteboard {...props} />;
}

'use client';

import dynamic from 'next/dynamic';

// Dynamically import Excalidraw component with SSR disabled (it uses browser APIs)
const DynamicWhiteboard = dynamic(
    () => import('./WhiteboardClient'),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center w-full h-full">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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

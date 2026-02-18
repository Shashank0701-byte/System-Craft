"use client";

import dynamic from "next/dynamic";

const ArchitectureField = dynamic(() => import("@/components/ArchitectureField"), {
    ssr: false,
    loading: () => <div className="absolute inset-0 z-[-1] pointer-events-none" />,
});

export function ClientArchitectureField() {
    return <ArchitectureField />;
}

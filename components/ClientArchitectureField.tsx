"use client";

import dynamic from "next/dynamic";

const ArchitectureField = dynamic(() => import("@/components/ArchitectureField"), {
    ssr: false,
});

export function ClientArchitectureField() {
    return <ArchitectureField />;
}

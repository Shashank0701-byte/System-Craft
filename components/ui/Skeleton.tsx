/**
 * Skeleton loaders for SystemCraft.
 *
 * Base: a dark slab with a directional cyan shimmer sweep — like a signal
 * tracing through a circuit. Specialised variants mirror the exact shape of
 * their real counterparts so the layout doesn't shift on load.
 */

// ── Base atom ────────────────────────────────────────────────────────────────

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`rounded bg-white/[0.04] animate-shimmer ${className}`}
            aria-hidden="true"
        />
    );
}

// ── Interview session card ────────────────────────────────────────────────────
// Mirrors: /app/interview/page.tsx session card (p-5, rounded-xl, ~h-32+)

export function InterviewSessionCardSkeleton() {
    return (
        <div
            className="flex flex-col rounded-xl bg-[#0c0d16]/40 border border-white/[0.04] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
            aria-hidden="true"
        >
            {/* Top row: difficulty badge + status + timestamp */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <Skeleton className="h-4 w-12 rounded" />
                    <Skeleton className="h-3.5 w-20 rounded" />
                </div>
                <Skeleton className="h-3 w-14 rounded" />
            </div>

            {/* Question prompt — two lines */}
            <Skeleton className="h-3 w-full rounded mb-2" />
            <Skeleton className="h-3 w-3/4 rounded mb-4" />

            {/* Footer: timer + score */}
            <div className="mt-auto flex items-center justify-between border-t border-dashed border-white/[0.03] pt-4">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
            </div>
        </div>
    );
}

// ── Design canvas card ────────────────────────────────────────────────────────
// Mirrors: /components/dashboard/DesignCard.tsx (aspect-[4/3], rounded-xl)

export function DesignCardSkeleton() {
    return (
        <div
            className="aspect-[4/3] rounded-xl bg-[#0c0d16]/40 border border-white/[0.04] overflow-hidden relative flex flex-col"
            aria-hidden="true"
        >
            {/* Canvas preview area — shows a mini node-graph placeholder */}
            <div className="flex-1 relative p-4">
                {/* Shimmer layer behind the graph */}
                <div className="absolute inset-0 animate-shimmer rounded-t-xl" />

                {/* Stylised node + connection SVG */}
                <svg
                    className="absolute inset-0 w-full h-full opacity-[0.12]"
                    viewBox="0 0 160 110"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Edges */}
                    <line x1="35" y1="30" x2="80" y2="30" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="80" y1="30" x2="125" y2="30" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="80" y1="30" x2="80" y2="75" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="35" y1="75" x2="80" y2="75" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="80" y1="75" x2="125" y2="75" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Nodes */}
                    <rect x="22" y="20" width="26" height="18" rx="4" fill="rgba(34,211,238,0.08)" stroke="rgba(34,211,238,0.25)" strokeWidth="1" />
                    <rect x="67" y="20" width="26" height="18" rx="4" fill="rgba(34,211,238,0.08)" stroke="rgba(34,211,238,0.25)" strokeWidth="1" />
                    <rect x="112" y="20" width="26" height="18" rx="4" fill="rgba(34,211,238,0.08)" stroke="rgba(34,211,238,0.25)" strokeWidth="1" />
                    <rect x="22" y="65" width="26" height="18" rx="4" fill="rgba(34,211,238,0.05)" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
                    <rect x="67" y="65" width="26" height="18" rx="4" fill="rgba(34,211,238,0.05)" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
                    <rect x="112" y="65" width="26" height="18" rx="4" fill="rgba(34,211,238,0.05)" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
                </svg>
            </div>

            {/* Footer meta */}
            <div className="px-4 py-3 border-t border-white/[0.04] flex items-center justify-between">
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-3 w-12 rounded" />
            </div>
        </div>
    );
}

// ── Practice template card ────────────────────────────────────────────────────
// Mirrors: /app/practice/page.tsx template card (min-h-[220px], rounded-xl, p-6)

export function PracticeTemplateSkeleton() {
    return (
        <div
            className="rounded-xl bg-[#0c0d16]/30 border border-white/[0.04] overflow-hidden min-h-[220px] relative"
            aria-hidden="true"
        >
            {/* Shimmer layer */}
            <div className="absolute inset-0 animate-shimmer" />

            <div className="relative z-10 p-6 flex flex-col h-full min-h-[220px]">
                {/* Difficulty badge + category */}
                <div className="flex items-start justify-between mb-4">
                    <Skeleton className="h-4 w-14 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                </div>

                {/* Title — two lines */}
                <Skeleton className="h-3.5 w-full rounded mb-2" />
                <Skeleton className="h-3.5 w-4/5 rounded mb-3" />

                {/* Description — two lines */}
                <Skeleton className="h-3 w-full rounded mb-1.5" />
                <Skeleton className="h-3 w-2/3 rounded mb-auto" />

                {/* Tags row */}
                <div className="flex items-center gap-2 mt-5 mb-4">
                    <Skeleton className="h-4 w-12 rounded-full" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-10 rounded-full" />
                </div>

                {/* CTA button */}
                <Skeleton className="h-9 w-full rounded-lg" />
            </div>
        </div>
    );
}

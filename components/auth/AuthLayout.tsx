"use client";

import SystemStatusPanel from "./SystemStatusPanel";

/**
 * AuthLayout — Shared layout for login and signup pages.
 *
 * Left: Decorative atmosphere panel (hidden on mobile).
 * Right: Centered auth form with mobile logo fallback.
 *
 * Ambient Bridge:
 *   - Soft cyan glow emanating from the left (infrastructure)
 *   - Deep indigo glow behind the authentication card (right)
 *   - Faint gradients that meet naturally in the center
 *
 * Spatial Composition:
 *   - Centered inside the right panel (justify-center) to avoid excess empty space on the right
 */

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="h-dvh w-screen flex overflow-hidden bg-[#060810]">

      {/* ── Ambient Bridge background layer ────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Shared noise texture overlay */}
        <div className="noise-overlay absolute inset-0" />
        
        {/* Soft cyan glow on the left (NOC / infrastructure side) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(34,211,238,0.035),transparent_45%)]" />
        
        {/* Deep indigo glow on the right (Auth card side) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(99,102,241,0.025),transparent_40%)]" />
        
        {/* Faint vignette for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      {/* ── Left Atmosphere Panel (Observability) ─────────── */}
      <div className="hidden lg:flex w-[30%] min-w-[300px] max-w-[400px] relative z-10 border-r border-white/[0.03]">
        <SystemStatusPanel />
      </div>

      {/* ── Right Form Panel (Access Card - Centered) ──────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto relative z-10">
        <div className="relative w-full max-w-md">
          {/* Mobile logo — only visible below lg */}
          <div className="flex lg:hidden items-center gap-2.5 mb-10">
            <div className="flex size-8 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] text-cyan-200">
              <span className="material-symbols-outlined text-[17px]">hub</span>
            </div>
            <span className="text-sm font-semibold tracking-[-0.02em] text-white/90 font-display">
              SystemCraft
            </span>
          </div>

          {children}
        </div>
      </div>
    </main>
  );
}

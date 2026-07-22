"use client";

import Image from "next/image";
import SystemStatusPanel from "./SystemStatusPanel";

/**
 * AuthLayout — Shared layout for login and signup pages.
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

        {/* Soft cyan glow on the left */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(34,211,238,0.035),transparent_45%)]" />

        {/* Deep indigo glow on the right */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(99,102,241,0.025),transparent_40%)]" />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      {/* ── Left Panel ─────────────────────────────────────── */}
      <div className="relative z-10 hidden w-[30%] min-w-[300px] max-w-[400px] border-r border-white/[0.03] lg:flex">
        <SystemStatusPanel />
      </div>

      {/* ── Right Form Panel ───────────────────────────────── */}
      <div className="relative z-10 flex flex-1 items-center justify-center overflow-y-auto px-6 py-12">
        <div className="relative w-full max-w-md">

          {/* Mobile Logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <Image
              src="/favicon.png"
              alt="SystemCraft"
              width={38}
              height={38}
              priority
              unoptimized
            />

            <span className="font-display text-sm font-semibold tracking-[-0.02em] text-white/90">
              SystemCraft
            </span>
          </div>

          {children}
        </div>
      </div>
    </main>
  );
}
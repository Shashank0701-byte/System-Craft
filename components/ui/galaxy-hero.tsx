'use client';

import React, { useEffect, useRef, Suspense, lazy } from 'react';
import Link from 'next/link';

const Spline = lazy(() => import('@splinetool/react-spline'));

// ---------------------------------------------------------------------------
// Spline 3D background
// ---------------------------------------------------------------------------
function SplineBackground() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ pointerEvents: 'none' }}>
      <div className="absolute inset-0" style={{ pointerEvents: 'auto' }}>
        <Suspense fallback={<div className="w-full h-full bg-background-dark" />}>
          <Spline
            style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}
            scene="https://prod.spline.design/us3ALejTXl6usHZ7/scene.splinecode"
          />
        </Suspense>
      </div>
      <div
        className="absolute inset-0"
        style={{
          pointerEvents: 'none',
          background: `
            linear-gradient(to right, rgba(10,10,12,0.82), transparent 35%, transparent 65%, rgba(10,10,12,0.82)),
            linear-gradient(to bottom, rgba(10,10,12,0.35) 0%, transparent 25%, transparent 70%, rgba(10,10,12,0.95) 100%)
          `,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero content
// ---------------------------------------------------------------------------
function HeroContent() {
  return (
    <div className="relative z-10 flex flex-col items-start justify-center h-full max-w-2xl px-6 sm:px-10 lg:px-16 pt-24 pb-16 pointer-events-none">
      <div className="mb-6 pointer-events-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 pl-1 text-sm text-slate-400 backdrop-blur-sm">
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">New</span>
          <span className="pr-2">v1.0 is now live</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </div>
      </div>

      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.08] text-white mb-6">
        Master System Design<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-primary/60">
          Like a Real Interview.
        </span>
      </h1>

      <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed mb-10">
        The first simulator that grades your architecture in real-time. Build systems, face chaos events, and get AI feedback — all before the actual interview.
      </p>

      <div className="flex flex-col sm:flex-row items-start gap-4 pointer-events-auto">
        <Link
          href="/signup"
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary/20 hover:bg-primary/30 text-white font-semibold px-8 border border-primary/40 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <span className="material-symbols-outlined text-[20px]">draw</span>
          Start Designing Free
        </Link>
        <Link
          href="/login"
          className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-black/40 hover:border-white/20 text-slate-300 hover:text-white font-medium px-8 transition-all duration-200"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <span className="material-symbols-outlined text-[20px] text-slate-400">login</span>
          Sign In
        </Link>
      </div>

      <div className="mt-10 flex items-center gap-3 text-sm text-slate-500 pointer-events-none">
        <div className="flex -space-x-2">
          {['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500'].map((c, i) => (
            <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-background-dark`} />
          ))}
        </div>
        <span>Trusted by <span className="text-white font-semibold">2,400+</span> engineers</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product preview card
// ---------------------------------------------------------------------------
function ProductPreview({ previewRef }: { previewRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <section className="relative z-10 container mx-auto px-4 md:px-8 pb-24" style={{ marginTop: '-8vh' }}>
      <div
        ref={previewRef}
        className="w-full md:w-[82%] mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_80px_-20px_rgba(71,37,244,0.3)] bg-[#18181b]"
      >
        {/* Fake browser chrome */}
        <div className="h-10 bg-[#27272a] border-b border-white/5 flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
            <div className="w-3 h-3 rounded-full bg-[#eab308]" />
            <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
          </div>
          <div className="ml-4 flex h-6 px-3 items-center rounded bg-[#18181b] border border-white/5 text-[10px] text-slate-500 font-mono w-64">
            systemcraft.app/interview/session-01
          </div>
        </div>

        {/* Canvas screenshot */}
        <div className="relative bg-[#121118] bg-[radial-gradient(#2b2839_1px,transparent_1px)] bg-[size:20px_20px] aspect-[16/9]">
          <div
            className="w-full h-full bg-cover bg-center opacity-90"
            style={{
              backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBMJdUsp7O3Lnzktpqp6sExelw0meOOh4JTyKSME0dXk8-J5ZH1lTg_3kZtB7fpfS7zC5jRF9Iq1nu2v1D1CvsgD0RrpEW_pTSAiElndKclplqBgaDDa0WGIq2vhhtDbwwOB4fl6VsJQGtMbu2YIinaUAFMGEe1LjPuDUmlLSNhjNhlRDloh0HEvmoLtCl0MBq0jT1gFI68n9LhgGPAy2NPF6SkhoVsXdqvSgBpWqnNgRd_gqvqzZevUtFr48VNyzQFT3oKh6wTnpc0')",
            }}
          />
          {/* AI chat bubble */}
          <div className="absolute bottom-6 right-6 bg-[#1e1b2e]/90 backdrop-blur border border-primary/30 rounded-xl px-4 py-3 shadow-xl max-w-[260px]">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[11px] text-indigo-400">robot_2</span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-300">AI Interviewer</span>
            </div>
            <p className="text-[12px] text-slate-300 leading-relaxed">
              Good start. How does traffic reach your database if the LB isn&apos;t connected?
            </p>
          </div>
          {/* Chaos badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/90 backdrop-blur rounded-lg px-3 py-1.5 border border-red-500/50 shadow-lg text-white">
            <span className="material-symbols-outlined text-[16px] animate-pulse">warning</span>
            <span className="text-[11px] font-bold uppercase tracking-wide">Node Failure — 4:32</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function GalaxyHero() {
  const contentRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        if (contentRef.current) {
          const opacity = Math.max(0, 1 - scrollY / 350);
          contentRef.current.style.opacity = String(opacity);
        }
        if (previewRef.current) {
          previewRef.current.style.transform = `translateY(-${scrollY * 0.35}px)`;
        }
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative bg-background-dark">
      <div className="relative min-h-screen w-full overflow-hidden">
        <SplineBackground />
        <div
          ref={contentRef}
          className="relative z-10 flex items-center min-h-screen"
          style={{ pointerEvents: 'none' }}
        >
          <div className="container mx-auto">
            <HeroContent />
          </div>
        </div>
      </div>

      <div className="relative bg-background-dark">
        <ProductPreview previewRef={previewRef} />
      </div>
    </div>
  );
}

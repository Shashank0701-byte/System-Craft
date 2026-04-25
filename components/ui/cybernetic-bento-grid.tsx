"use client";

import React, { useEffect, useRef } from "react";

interface BentoItemProps {
  className?: string;
  children: React.ReactNode;
}

const BentoItem = ({ className = "", children }: BentoItemProps) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = item.getBoundingClientRect();
      item.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
      item.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    };
    item.addEventListener("mousemove", handleMouseMove);
    return () => item.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={itemRef}
      className={`relative rounded-2xl border border-white/8 bg-[#131022]/80 p-6 overflow-hidden
        before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-300
        before:bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(71,37,244,0.12),transparent_70%)]
        hover:before:opacity-100 hover:border-primary/25 transition-colors duration-300
        ${className}`}
    >
      {children}
    </div>
  );
};

export function CyberneticBentoGrid() {
  return (
    <section className="relative z-10 bg-background-dark py-24 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start justify-between mb-12">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-3">Everything you need</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Core Features</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              A complete system design interview simulator — from canvas to chaos to evaluation.
            </p>
          </div>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">

          {/* Large — Interactive Canvas */}
          <BentoItem className="lg:col-span-2 lg:row-span-2">
            <div className="flex flex-col h-full gap-4">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/15 border border-primary/20">
                <span className="material-symbols-outlined text-primary text-[22px]">draw</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Interactive Design Canvas</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Drag-and-drop Load Balancers, App Servers, SQL Databases, Redis Caches, Message Queues, and CDNs. Wire them together and build real architectures — not just diagrams.
                </p>
              </div>
              {/* Mini canvas preview */}
              <div className="mt-auto rounded-xl bg-[#0d0b1a] border border-white/5 p-4 flex flex-wrap gap-2">
                {[
                  { icon: 'balance', label: 'LB', color: 'text-indigo-400' },
                  { icon: 'dns', label: 'Server', color: 'text-blue-400' },
                  { icon: 'storage', label: 'SQL', color: 'text-emerald-400' },
                  { icon: 'memory', label: 'Cache', color: 'text-amber-400' },
                  { icon: 'queue', label: 'Queue', color: 'text-pink-400' },
                  { icon: 'cloud', label: 'CDN', color: 'text-cyan-400' },
                ].map(n => (
                  <div key={n.label} className="flex flex-col items-center gap-1 w-12">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className={`material-symbols-outlined text-[18px] ${n.color}`}>{n.icon}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-medium">{n.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </BentoItem>

          {/* AI Interviewer */}
          <BentoItem>
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 mb-3">
              <span className="material-symbols-outlined text-indigo-400 text-[20px]">robot_2</span>
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">AI Interviewer</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Gemini-powered interviewer checks in every 5 minutes with probing questions and nudges.
            </p>
          </BentoItem>

          {/* Chaos Mode */}
          <BentoItem>
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 mb-3">
              <span className="material-symbols-outlined text-red-400 text-[20px]">warning</span>
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Chaos Mode</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Mid-interview node failures and traffic spikes. Fix it in 5 minutes or lose marks.
            </p>
          </BentoItem>

          {/* Structural Linter */}
          <BentoItem>
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 mb-3">
              <span className="material-symbols-outlined text-amber-400 text-[20px]">rule</span>
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Structural Linter</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Real-time detection of disconnected nodes, missing caches, and single points of failure.
            </p>
          </BentoItem>

          {/* Evaluation — wide */}
          <BentoItem className="lg:col-span-2">
            <div className="flex items-start gap-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex-shrink-0">
                <span className="material-symbols-outlined text-emerald-400 text-[20px]">workspace_premium</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">Deep Evaluation</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Score 0–100 with AI-generated strengths, weaknesses, and suggestions. Structural rules + Gemini reasoning combined into one final grade.
                </p>
              </div>
              {/* Score pill */}
              <div className="ml-auto flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-2xl font-black text-emerald-400">84</span>
                <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wide">/100</span>
              </div>
            </div>
          </BentoItem>

          {/* Load Simulation */}
          <BentoItem>
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 mb-3">
              <span className="material-symbols-outlined text-purple-400 text-[20px]">speed</span>
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Load Simulation</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Run traffic simulations to see which nodes bottleneck under 100k RPS.
            </p>
          </BentoItem>

          {/* Analytics */}
          <BentoItem>
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/20 mb-3">
              <span className="material-symbols-outlined text-cyan-400 text-[20px]">monitoring</span>
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Progress Analytics</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Score trends, structural rule heatmaps, and weakness frequency across all sessions.
            </p>
          </BentoItem>

        </div>
      </div>
    </section>
  );
}

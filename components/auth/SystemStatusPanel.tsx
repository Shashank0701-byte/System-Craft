"use client";
import Image from "next/image";
/**
 * SystemStatusPanel — Decorative left-panel for auth pages.
 *
 * Renders a coherent operational dashboard:
 *   Brand → Status → Live Infrastructure → Metrics → Session Details
 *
 * All values are static/decorative. Animations are restrained
 * and match the landing page's visual language.
 */

// ── Topology data ───────────────────────────────────────────
const topoNodes = [
  { id: "lb",      label: "LB",      x: 15, y: 28 },
  { id: "app",     label: "APP",     x: 40, y: 18 },
  { id: "cache",   label: "CACHE",   x: 65, y: 12 },
  { id: "db",      label: "DB",      x: 65, y: 50 },
  { id: "queue",   label: "QUEUE",   x: 40, y: 58 },
  { id: "replica", label: "REPLICA", x: 85, y: 38 },
];

const topoEdges = [
  { from: "lb",  to: "app" },
  { from: "app", to: "cache" },
  { from: "app", to: "db" },
  { from: "app", to: "queue" },
  { from: "db",  to: "replica" },
];

// ── Operational metrics (aligned uppercase monospace) ───────
const metrics = [
  { label: "AUTH_SERVICE",     value: "HEALTHY",   accent: true },
  { label: "NET_LATENCY",      value: "18 MS",     accent: false },
  { label: "WORKSPACE_ENV",    value: "READY",     accent: false },
  { label: "INTERVIEW_ENGINE", value: "ONLINE",    accent: true },
  { label: "SIMULATION_POOL",  value: "AVAILABLE", accent: false },
  { label: "TOPOLOGY_STATE",   value: "VALIDATED", accent: false },
];

export default function SystemStatusPanel() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between px-8 py-10 overflow-hidden select-none">

      {/* ── Background atmosphere ─────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(34,211,238,0.05),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(99,102,241,0.03),transparent_50%)]" />

      {/* ── Top section: Brand + Status + Topology + Metrics */}
      <div className="flex w-full max-w-[340px] flex-col items-center">

        {/* ── Brand mark ──────────────────────────────────── */}
        <div className="mb-8 flex items-center gap-3">
          <Image
            src="/favicon.png"
            alt="SystemCraft"
            width={36}
            height={36}
            priority
            unoptimized
            className="shrink-0"
          />

          <span className="font-display text-sm font-semibold tracking-tight text-white/80">
            SystemCraft
          </span>
        </div>

        {/* ── System Status header ────────────────────────── */}
        <div className="mb-5 flex items-center gap-2 self-start">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[9px] font-mono font-medium tracking-[0.25em] uppercase text-white/35">
            SYSTEM STATUS
          </span>
        </div>

        {/* ── Infrastructure topology container ───────────── */}
        <div className="mb-6 w-full rounded-xl border border-white/[0.04] bg-[#080b12]/30">
          {/* Container header */}
          <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-2">
            <span className="text-[8px] font-mono font-medium tracking-[0.2em] uppercase text-white/20">
              INFRASTRUCTURE
            </span>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-1 w-1 rounded-full bg-emerald-400" />
              <span className="text-[8px] font-mono tracking-wide text-emerald-400/60 uppercase">
                ONLINE
              </span>
            </div>
          </div>

          {/* Topology SVG area - scaled up to occupy container width */}
          <div className="relative w-full aspect-[5/3] px-2 py-2">
            <svg
              viewBox="0 0 100 70"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="authEdgeGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%"   stopColor="#22d3ee" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.12" />
                </linearGradient>
                <filter id="authNodeGlow">
                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Edges */}
              {topoEdges.map((edge) => {
                const from = topoNodes.find((n) => n.id === edge.from)!;
                const to   = topoNodes.find((n) => n.id === edge.to)!;
                return (
                  <line
                    key={`${edge.from}-${edge.to}`}
                    x1={from.x} y1={from.y}
                    x2={to.x}   y2={to.y}
                    stroke="url(#authEdgeGrad)"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Packet dots — slow occasional traversal */}
              {topoEdges.map((edge, i) => {
                const from = topoNodes.find((n) => n.id === edge.from)!;
                const to   = topoNodes.find((n) => n.id === edge.to)!;
                const dur  = 3.2 + i * 0.95;
                return (
                  <circle
                    key={`pkt-${i}`}
                    r="0.65"
                    fill="#22d3ee"
                    opacity="0.45"
                  >
                    <animateMotion
                      dur={`${dur}s`}
                      repeatCount="indefinite"
                      path={`M${from.x},${from.y} L${to.x},${to.y}`}
                    />
                  </circle>
                );
              })}

              {/* Nodes */}
              {topoNodes.map((node) => (
                <g key={node.id} filter="url(#authNodeGlow)">
                  {/* Slow breathing pulse rings */}
                  <circle
                    cx={node.x} cy={node.y} r="5.2"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="0.25"
                    opacity="0.1"
                  >
                    <animate
                      attributeName="r"
                      values="4.8;5.6;4.8"
                      dur="5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.05;0.15;0.05"
                      dur="5s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Core circle */}
                  <circle
                    cx={node.x} cy={node.y} r="2.8"
                    fill="rgba(15,23,42,0.9)"
                    stroke="rgba(34,211,238,0.18)"
                    strokeWidth="0.4"
                  />
                  <circle
                    cx={node.x} cy={node.y} r="1"
                    fill="#22d3ee"
                    opacity="0.15"
                  />
                </g>
              ))}
            </svg>

            {/* Node labels — positioned over SVG */}
            {topoNodes.map((node) => (
              <div
                key={`label-${node.id}`}
                className="absolute -translate-x-1/2 pointer-events-none select-none"
                style={{
                  left: `${node.x}%`,
                  top:  `${node.y + 8}%`,
                }}
              >
                <span className="text-[6.5px] font-mono font-medium tracking-[0.2em] text-white/20 uppercase">
                  {node.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Operational metrics (aligned uppercase columns) ── */}
        <div className="w-full space-y-2 pt-1 border-t border-dashed border-white/[0.04]">
          {metrics.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between font-mono text-[9px] tracking-wider"
            >
              <span className="text-white/25 uppercase">
                {row.label}
              </span>
              <span
                className={`text-right uppercase ${
                  row.accent
                    ? "text-cyan-400/80"
                    : "text-white/50"
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom: engineering session details ───────────── */}
      <div className="flex w-full max-w-[340px] flex-col items-center gap-1 pt-6 border-t border-white/[0.02]">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-mono tracking-[0.2em] uppercase text-white/15">
            NODE // MUMBAI-1 (AZ-A)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-mono tracking-wider text-white/15">
            TLS 1.3 ENABLED
          </span>
          <span className="text-[8px] text-white/10">·</span>
          <span className="text-[8px] font-mono tracking-wider text-white/15">
            BUILD V1.3.2
          </span>
        </div>
        <span className="text-[8px] font-mono tracking-[0.25em] uppercase text-white/15">
          SECURE PROTOCOL HANDSHAKE
        </span>
      </div>
    </div>
  );
}

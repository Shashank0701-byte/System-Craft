"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, useScroll, useTransform, useMotionValueEvent, type Variants } from "framer-motion";

// ── Types ───────────────────────────────────────────────────
type HeroPhase = "assembly" | "flow" | "cache" | "failure" | "autoscale" | "stable";

// ── Data ────────────────────────────────────────────────────
const timelineSteps = [
  {
    phase: "01_FOUNDATION",
    title: "WHAT IS SYSTEM DESIGN?",
    copy: "A set of trade-offs where latency, cost, reliability, and complexity pull in different directions.",
  },
  {
    phase: "02_BEHAVIOR",
    title: "HOW DISTRIBUTED SYSTEMS BEHAVE",
    copy: "Traffic, queues, caches, replicas, and timeouts shape what the user actually experiences.",
  },
  {
    phase: "03_CHAOS",
    title: "FAILURES HAPPEN",
    copy: "Every architecture eventually sees a node drop, a queue grow, or a database stall under pressure.",
  },
  {
    phase: "04_SIMULATION",
    title: "AI INTERVIEW BEGINS",
    copy: "The interviewer changes the constraints and watches how fast the architecture adapts.",
  },
  {
    phase: "05_ANALYSIS",
    title: "YOU RECEIVE FEEDBACK",
    copy: "Structural issues and reasoning gaps are surfaced with direct, actionable guidance.",
  },
  {
    phase: "06_MASTERY",
    title: "BECOME INTERVIEW READY",
    copy: "Build the muscle memory to explain systems with confidence under realistic pressure.",
  },
];

const demos = [
  {
    name: "Cache",
    title: "Cache layer responds",
    detail: "Hot paths served from memory instantly. Watch latency drop as the cache absorbs repeated reads.",
    metric: "p95 328ms",
    color: "#22d3ee",
    barHeights: [0.9, 0.7, 0.95, 0.6, 0.85, 0.75],
  },
  {
    name: "Database",
    title: "Primary DB under pressure",
    detail: "One overloaded primary ripples through the entire graph, amplifying tail latency across services.",
    metric: "p95 3.2s",
    color: "#f43f5e",
    barHeights: [0.3, 0.5, 0.7, 0.9, 0.95, 0.85],
  },
  {
    name: "Kafka",
    title: "Queue depth growing",
    detail: "Consumer lag builds, backpressure becomes visible, and the system signals it needs more throughput.",
    metric: "lag 42k",
    color: "#f59e0b",
    barHeights: [0.2, 0.35, 0.5, 0.65, 0.8, 0.95],
  },
  {
    name: "Load Balancer",
    title: "Traffic rebalancing",
    detail: "Unhealthy nodes fade out of the hot path. Traffic redistributes evenly across healthy replicas.",
    metric: "4/4 healthy",
    color: "#10b981",
    barHeights: [0.8, 0.85, 0.8, 0.82, 0.78, 0.84],
  },
  {
    name: "CDN",
    title: "Edge propagation",
    detail: "Requests terminate closer to users. Origin pressure drops as edge caches absorb global traffic.",
    metric: "edge hit 93%",
    color: "#8b5cf6",
    barHeights: [0.6, 0.7, 0.8, 0.85, 0.9, 0.93],
  },
];

const nodes = [
  { id: "users", label: "Users", x: 10, y: 54 },
  { id: "cdn", label: "CDN", x: 24, y: 24 },
  { id: "lb", label: "Load Balancer", x: 34, y: 52 },
  { id: "app", label: "App Servers", x: 51, y: 34 },
  { id: "cache", label: "Cache", x: 64, y: 19 },
  { id: "db", label: "Primary DB", x: 76, y: 54 },
  { id: "replica", label: "Replica", x: 83, y: 31 },
  { id: "queue", label: "Queue", x: 52, y: 74 },
];

const segments = [
  { from: [10, 54], to: [24, 24] },
  { from: [24, 24], to: [34, 52] },
  { from: [34, 52], to: [51, 34] },
  { from: [51, 34], to: [64, 19] },
  { from: [51, 34], to: [76, 54] },
  { from: [76, 54], to: [83, 31] },
  { from: [51, 34], to: [52, 74] },
];

const phaseCopy: Record<HeroPhase, string> = {
  assembly: "Servers assembling",
  flow: "Traffic flowing",
  cache: "Cache introduced",
  failure: "Database failure",
  autoscale: "Autoscaler launched",
  stable: "System stabilized",
};

// ── Framer Motion Variants ──────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const heroTextVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ── Mini SVG Visualization for Demo Cards ───────────────────
function DemoViz({ demo, isActive }: { demo: typeof demos[0]; isActive: boolean }) {
  return (
    <div className="mb-4 flex h-20 items-end justify-center gap-1.5 rounded-xl border border-white/8 bg-black/40 px-4 pb-3 pt-2">
      {demo.barHeights.map((h, i) => (
        <motion.div
          key={i}
          className="w-4 rounded-sm"
          style={{ backgroundColor: isActive ? demo.color : "rgba(255,255,255,0.12)" }}
          initial={{ height: "12%" }}
          animate={{
            height: isActive ? `${h * 100}%` : "12%",
            opacity: isActive ? 0.9 : 0.35,
          }}
          transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ── Timeline Card ───────────────────────────────────────────
function TimelineCard({ step, index, isLeft }: { step: typeof timelineSteps[0]; index: number; isLeft: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Slide in effect (trigger once)
  const wasInView = useInView(cardRef, { once: true, margin: "-100px" });

  // Sync lighting up precisely with the center of the screen
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["center end", "center center"]
  });
  
  const [isActive, setIsActive] = useState(false);
  
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest >= 1 && !isActive) setIsActive(true);
    else if (latest < 1 && isActive) setIsActive(false);
  });

  return (
    <div className={`relative flex w-full md:grid md:grid-cols-2 md:gap-16`}>
      {/* Left Column Container */}
      <div className={`flex w-full ${!isLeft ? "md:invisible hidden md:flex" : ""}`}>
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
          animate={wasInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={`relative w-full rounded-2xl border bg-[#0A0D14]/80 p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-colors duration-500 ${isActive ? "border-emerald-500/50" : "border-white/[0.08]"}`}
        >
          {/* Corner accents */}
          <div className="absolute left-2 top-2 h-1 w-1 rounded-full bg-white/20" />
          <div className="absolute right-2 top-2 h-1 w-1 rounded-full bg-white/20" />
          <div className="absolute bottom-2 left-2 h-1 w-1 rounded-full bg-white/20" />
          <div className="absolute bottom-2 right-2 h-1 w-1 rounded-full bg-white/20" />
          <div className={`absolute left-1/2 top-2 h-1 w-3 -translate-x-1/2 rounded-full transition-colors duration-500 ${isActive ? "bg-emerald-500" : "bg-emerald-500/20"}`} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-dashed border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${isActive ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-white/20"}`} />
              <div className={`text-[11px] font-mono tracking-wider transition-colors duration-500 ${isActive ? "text-emerald-400" : "text-white/40"}`}>
                [STATE]: {step.phase}
              </div>
            </div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-white/30">
              NODE_0{index + 1}
            </div>
          </div>

          {/* Content */}
          <div className="pt-5">
            <h3 className={`flex items-center gap-2 text-sm font-bold tracking-widest uppercase transition-colors duration-500 ${isActive ? "text-emerald-400" : "text-white/70"}`}>
              <span className={isActive ? "text-emerald-500" : "text-white/30"}>{">"}</span> {step.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              {step.copy}
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* Right Column Container */}
      <div className={`flex w-full ${isLeft ? "md:invisible hidden md:flex" : ""}`}>
        {!isLeft && (
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, x: 40 }}
            animate={wasInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`relative w-full rounded-2xl border bg-[#0A0D14]/80 p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-colors duration-500 ${isActive ? "border-emerald-500/50" : "border-white/[0.08]"}`}
          >
            <div className="absolute left-2 top-2 h-1 w-1 rounded-full bg-white/20" />
            <div className="absolute right-2 top-2 h-1 w-1 rounded-full bg-white/20" />
            <div className="absolute bottom-2 left-2 h-1 w-1 rounded-full bg-white/20" />
            <div className="absolute bottom-2 right-2 h-1 w-1 rounded-full bg-white/20" />
            <div className={`absolute left-1/2 top-2 h-1 w-3 -translate-x-1/2 rounded-full transition-colors duration-500 ${isActive ? "bg-emerald-500" : "bg-emerald-500/20"}`} />

            <div className="flex items-center justify-between border-b border-dashed border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${isActive ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-white/20"}`} />
                <div className={`text-[11px] font-mono tracking-wider transition-colors duration-500 ${isActive ? "text-emerald-400" : "text-white/40"}`}>
                  [STATE]: {step.phase}
                </div>
              </div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-white/30">
                NODE_0{index + 1}
              </div>
            </div>

            <div className="pt-5">
              <h3 className={`flex items-center gap-2 text-sm font-bold tracking-widest uppercase transition-colors duration-500 ${isActive ? "text-emerald-400" : "text-white/70"}`}>
                <span className={isActive ? "text-emerald-500" : "text-white/30"}>{">"}</span> {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                {step.copy}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Center dot on the timeline for this specific card */}
      <div 
        className={`absolute top-1/2 left-[24px] z-10 hidden size-3 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 bg-[#0A0D14] transition-all duration-300 md:block md:left-1/2 ${
          isActive ? "border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.8)] scale-125" : "border-white/20 scale-100"
        }`} 
      />
    </div>
  );
}

// ── Timeline Section ────────────────────────────────────────
function TimelineSection() {
  const lineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: lineRef,
    offset: ["start center", "end center"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="story" className="relative z-10 mx-auto max-w-7xl px-6 py-28 sm:px-8 lg:px-10">
      <div className="mb-24 text-center">
        <h2 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
          The Architecture Lifestyle
        </h2>
      </div>

      <div ref={lineRef} className="relative mx-auto max-w-4xl">
        {/* Center line (subtle background line) */}
        <div className="absolute bottom-0 left-[24px] top-0 hidden w-px bg-gradient-to-b from-transparent via-white/5 to-transparent md:block md:left-1/2 md:-translate-x-1/2" />
        {/* Center dotted line */}
        <div className="absolute bottom-0 left-[24px] top-0 hidden w-px border-l-2 border-dotted border-white/[0.08] md:block md:left-1/2 md:-translate-x-1/2" />
        
        {/* Glowing scroll tracking line (draws down continuously) */}
        <motion.div
          className="absolute left-[23px] top-0 z-10 hidden w-[2px] origin-top bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] md:block md:left-1/2 md:-translate-x-1/2"
          style={{ height: lineHeight }}
        />
        
        {/* Leading bullet at the tip of the drawing line */}
        <motion.div
          className="absolute left-[24px] top-0 z-20 hidden size-2.5 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,1)] md:block md:left-1/2 md:-translate-x-1/2"
          style={{ top: lineHeight, marginTop: "-5px" }}
        />

        <div className="flex flex-col gap-12 md:gap-8">
          {timelineSteps.map((step, index) => (
            <TimelineCard key={step.phase} step={step} index={index} isLeft={index % 2 === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Node Graph (Hero) ───────────────────────────────────────
function NodeGraph({ phase }: { phase: HeroPhase }) {
  const activeLines = useMemo(() => {
    if (phase === "assembly") return 1;
    if (phase === "flow") return 4;
    if (phase === "cache") return 5;
    if (phase === "failure") return 6;
    return 7;
  }, [phase]);

  return (
    <div className="noise-overlay relative h-[29rem] overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#06060a]/90 shadow-[0_40px_120px_-40px_rgba(74,58,255,0.35)]">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.15),transparent_35%),radial-gradient(circle_at_bottom,rgba(34,211,238,0.1),transparent_32%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_30%,rgba(0,0,0,0.26))]" />
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:56px_56px] opacity-20 [mask-image:radial-gradient(circle_at_center,black,transparent_85%)]" />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 520" aria-hidden="true">
        <defs>
          <linearGradient id="networkGlow" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connection lines */}
        {segments.map((segment, index) => {
          const [x1, y1] = segment.from;
          const [x2, y2] = segment.to;
          const visible = index < activeLines;
          return (
            <line
              key={index}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke={visible ? "url(#networkGlow)" : "rgba(148,163,184,0.15)"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={visible ? "0" : "6 8"}
              className={`transition-all duration-700 ${visible ? "opacity-100" : "opacity-25"}`}
            />
          );
        })}

        {/* Animated request packets */}
        {phase !== "assembly" && segments.slice(0, activeLines).map((segment, index) => {
          const [x1, y1] = segment.from;
          const [x2, y2] = segment.to;
          return (
            <circle key={`packet-${index}`} r="4" fill="#22d3ee" opacity="0.8" filter="url(#softGlow)">
              <animateMotion
                dur={`${1.5 + index * 0.3}s`}
                repeatCount="indefinite"
                path={`M${x1 * 10},${y1 * 5.2} L${x2 * 10},${y2 * 5.2}`}
              />
            </circle>
          );
        })}

        {/* Node circles */}
        {nodes.map((node, index) => {
          const active = phase !== "assembly" || index <= 3;
          const glow = node.id === "cache" && phase === "cache";
          const failure = node.id === "db" && phase === "failure";
          const autoscale = node.id === "replica" && phase === "autoscale";
          const isHighlighted = glow || autoscale;

          return (
            <g key={node.id} filter="url(#softGlow)">
              <circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r={node.id === "lb" ? 42 : node.id === "app" ? 40 : 34}
                fill={failure ? "rgba(127,29,29,0.22)" : active ? "rgba(15,23,42,0.88)" : "rgba(15,23,42,0.55)"}
                stroke={failure ? "#f43f5e" : active ? "rgba(96,165,250,0.35)" : "rgba(148,163,184,0.15)"}
                strokeWidth="1"
                className="transition-all duration-500"
              />
              <circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r={node.id === "lb" ? 18 : 14}
                fill={isHighlighted ? "#22d3ee" : failure ? "#ef4444" : "#c4b5fd"}
                opacity={isHighlighted || failure ? 0.9 : 0.18}
                className={isHighlighted ? "animate-node-pulse" : ""}
              />
            </g>
          );
        })}
      </svg>

      {/* Node labels */}
      {nodes.map((node) => {
        const highlighted =
          (phase === "cache" && node.id === "cache") ||
          (phase === "failure" && node.id === "db") ||
          (phase === "autoscale" && node.id === "replica");
        return (
          <div
            key={node.id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1 text-[10px] tracking-[0.18em] uppercase transition-all duration-500 ${
              highlighted
                ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.15)]"
                : "border-white/[0.06] bg-black/40 text-white/50"
            }`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            {node.label}
          </div>
        );
      })}

      {/* Phase indicator */}
      <div className="absolute left-5 top-5 flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-black/50 px-3.5 py-2 backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-[10px] font-medium tracking-[0.22em] uppercase text-white/60"
          >
            {phaseCopy[phase]}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Metric cards */}
      <div className="absolute bottom-5 left-5 right-5 grid gap-2.5 sm:grid-cols-3">
        {[
          ["Latency", phase === "failure" ? "3.2s" : phase === "cache" ? "328ms" : "781ms"],
          ["Throughput", phase === "autoscale" ? "+126%" : "+48%"],
          ["Health", phase === "failure" ? "degraded" : "stable"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/[0.06] bg-black/40 px-4 py-3 backdrop-blur-md">
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/30">{label}</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={value}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className={`mt-1.5 text-lg font-semibold tabular-nums ${
                  label === "Health" && value === "degraded" ? "text-rose-400" : "text-white"
                }`}
              >
                {value}
              </motion.div>
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FAQ Section ─────────────────────────────────────────────
type FaqCategory = "general" | "interview" | "technical";

const faqData = {
  general: [
    { q: "Who is SystemCraft for?", a: "Software engineers preparing for mid to senior-level system design interviews at top tech companies." },
    { q: "Is this a video course?", a: "No. It's a live, interactive simulator where you build architectures and react to real-time traffic and failures." },
    { q: "Do I need to know AWS/GCP?", a: "No, we focus on fundamental distributed system concepts (load balancers, caches, queues) rather than vendor-specific services." },
  ],
  interview: [
    { q: "How does the AI interviewer work?", a: "It acts as a Staff-level interviewer, analyzing your architecture, asking follow-ups, and introducing unexpected chaos events (e.g. 'Your database just went down. How do you recover?')." },
    { q: "Do I get a score?", a: "Yes. After each session, you receive a detailed rubrik breakdown of your structural decisions, reasoning gaps, and actionable areas to improve." },
  ],
  technical: [
    { q: "What concepts are covered?", a: "Caching strategies, database replication, sharding, message queues, CDN routing, rate limiting, leader election, and CAP theorem trade-offs." },
    { q: "Are the simulations accurate?", a: "The math engine underneath simulates latency, throughput, and bottleneck cascading based on real-world distributed systems principles." },
  ]
};

// ── Scenarios Section ───────────────────────────────────────
const scenariosData = [
  {
    id: "caching",
    name: "Distributed Caching",
    icon: "memory",
    desc: "Analyze and implement in-memory data grids to absorb massive read-heavy traffic spikes.",
    complexity: 2,
  },
  {
    id: "sharding",
    name: "Database Sharding",
    icon: "database",
    desc: "Partition massive datasets across multiple nodes while maintaining consistency and balancing hot shards.",
    complexity: 4,
  },
  {
    id: "queues",
    name: "Message Queues",
    icon: "queue",
    desc: "Decouple microservices and implement backpressure mechanisms to handle asynchronous workloads.",
    complexity: 3,
  },
  {
    id: "load-balancing",
    name: "Global Load Balancing",
    icon: "router",
    desc: "Route traffic efficiently across geographic regions to minimize latency and handle zone failures.",
    complexity: 3,
  },
  {
    id: "rate-limiting",
    name: "Rate Limiting",
    icon: "speed",
    desc: "Design distributed algorithms (Token Bucket, Leaky Bucket) to protect APIs from abuse and overload.",
    complexity: 2,
  },
  {
    id: "leader-election",
    name: "Leader Election",
    icon: "gavel",
    desc: "Ensure high availability and fault tolerance in consensus-based clusters (e.g., using Paxos or Raft).",
    complexity: 5,
  }
];

function ScenariosSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % scenariosData.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const activeScenario = scenariosData[activeIndex];

  return (
    <section id="scenarios" className="relative z-10 mx-auto max-w-6xl px-6 py-28 sm:px-8 lg:px-10">
      <div className="mb-16 text-center">
        <h2 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
          Core Concepts
        </h2>
      </div>

      <div 
        className="mx-auto flex flex-col overflow-hidden rounded-[1.5rem] border border-[#1a1f2e] bg-[#0A0D14] shadow-[0_20px_80px_-20px_rgba(0,0,0,0.8)] md:h-[500px] md:flex-row"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Left Sidebar */}
        <div className="flex w-full flex-col border-r border-[#1a1f2e] bg-[#07090d] md:w-80">
          <div className="px-6 py-6 text-[10px] font-bold tracking-[0.2em] uppercase text-emerald-500">
            Available Scenarios
          </div>
          <div className="flex flex-1 flex-col py-2">
            {scenariosData.map((scenario, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={scenario.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`group relative flex items-center px-6 py-4 text-left transition-colors duration-300 ${
                    isActive ? "bg-emerald-950/20" : "hover:bg-[#0c1018]"
                  }`}
                >
                  <span className={`text-sm font-medium ${isActive ? "text-white" : "text-white/40 group-hover:text-white/60"}`}>
                    {scenario.name}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute bottom-0 right-0 top-0 w-1.5 bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="absolute inset-y-0 right-0 flex flex-col justify-center gap-[2px] px-[2px]">
                        <div className="h-[2px] w-full bg-emerald-950/50" />
                        <div className="h-[2px] w-full bg-emerald-950/50" />
                        <div className="h-[2px] w-full bg-emerald-950/50" />
                      </div>
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content */}
        <div className="relative flex flex-1 flex-col items-center justify-center p-8 md:p-12 overflow-hidden">
          {/* Faint Scanlines */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:100%_4px]" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeScenario.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 w-full max-w-md"
            >
              {/* Icon & Audio Wave */}
              <div className="mb-10 flex items-center gap-8">
                <div className="relative flex size-24 items-center justify-center">
                  <motion.svg
                    viewBox="0 0 100 100"
                    className="absolute inset-0 size-full text-emerald-500/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 6" />
                  </motion.svg>
                  
                  <div className="absolute inset-2 rounded-full border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]" />
                  
                  <span className="material-symbols-outlined z-10 text-[40px] text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">
                    {activeScenario.icon}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-70">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 rounded-full bg-emerald-500"
                      animate={{ height: [8, Math.random() * 20 + 10, 8] }}
                      transition={{ duration: 0.5 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </div>

              {/* Text Content */}
              <div>
                <h3 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                  {activeScenario.name}
                </h3>
                <div className="mt-3 h-[3px] w-12 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />

                <div className="mt-8 flex items-start gap-2">
                  <span className="font-mono text-sm font-bold text-emerald-500">{">_desc:"}</span>
                  <p className="font-mono text-sm leading-relaxed text-white/50">
                    {activeScenario.desc}
                  </p>
                </div>

                {/* Complexity Meter */}
                <div className="mt-12">
                  <div className="mb-3 text-[10px] font-bold tracking-[0.2em] uppercase text-white/30">
                    Complexity Level
                  </div>
                  <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-8 rounded-full transition-colors duration-500 ${
                          i < activeScenario.complexity 
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" 
                            : "bg-white/5"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>("general");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const currentFaqs = faqData[activeCategory];

  return (
    <section id="faq" className="relative z-10 mx-auto max-w-5xl px-6 py-28 sm:px-8 lg:px-10">
      <div className="mb-16 text-center">
        <h2 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
          Frequently Asked Questions
        </h2>
      </div>

      {/* The Console Shell */}
      <div className="mx-auto max-w-4xl rounded-[3rem] rounded-br-[5rem] border border-[#2a2d3d] bg-[#1a1c23] p-4 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] md:p-8 relative">
        
        {/* Speaker Grill Accent */}
        <div className="absolute bottom-10 right-10 flex gap-1.5 rotate-[-25deg] opacity-40">
           <div className="h-10 w-2 rounded-full bg-[#0a0c10] shadow-inner" />
           <div className="h-10 w-2 rounded-full bg-[#0a0c10] shadow-inner" />
           <div className="h-10 w-2 rounded-full bg-[#0a0c10] shadow-inner" />
           <div className="h-10 w-2 rounded-full bg-[#0a0c10] shadow-inner" />
        </div>

        {/* Top LEDs */}
        <div className="mb-4 flex items-center justify-between px-4">
           <div className="flex items-center gap-2">
             <div className="size-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
             <div className="text-[10px] font-bold tracking-widest text-[#4a5168]">PWR</div>
           </div>
           <div className="text-[10px] font-bold tracking-widest text-[#4a5168]">SYSTEMCRAFT OS v1.0</div>
        </div>

        {/* The Screen */}
        <div className="relative h-[380px] overflow-hidden rounded-xl border-8 border-[#0a0c10] bg-[#020605] p-1 shadow-inner font-mono md:h-[450px] md:p-2">
            {/* Scanlines (pointer-events-none ensures it doesn't block scrolling) */}
            <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20" />
            
            {/* Scrollable Container */}
            <div className="h-full w-full overflow-y-auto p-4 md:p-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#020605] [&::-webkit-scrollbar-thumb]:bg-emerald-900/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-emerald-500/50">
              
              {/* Header */}
              <div className="mb-6 flex items-center gap-3 border-b border-emerald-900/50 pb-4 text-emerald-400">
                <span className="animate-pulse">_</span>
                <span className="tracking-widest">DIR: /{activeCategory.toUpperCase()}</span>
              </div>

              {/* Accordion */}
              <div className="relative z-10 flex flex-col gap-3">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  {currentFaqs.map((faq, i) => {
                    const isOpen = openIndex === i;
                    return (
                      <div key={i} className="overflow-hidden rounded-lg border border-emerald-900/30 bg-emerald-950/10 shrink-0">
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : i)}
                          className="flex w-full items-center justify-between p-4 text-left text-sm text-emerald-400 transition-colors hover:bg-emerald-900/20"
                        >
                          <span className="flex gap-3">
                            <span className="text-emerald-600 pointer-events-none">{">"}</span>
                            <span className="pointer-events-none">{faq.q}</span>
                          </span>
                          <span className={`text-[10px] pointer-events-none transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                            ▼
                          </span>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-4 pb-4 pl-10 text-sm leading-relaxed text-emerald-200/70"
                            >
                              {faq.a}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            </div>
        </div>

        {/* The Controls Area */}
        <div className="mt-12 mb-6 flex items-center justify-between px-6 md:px-12 relative z-10">
          {/* D-Pad (Decorative) */}
          <div className="relative size-24">
            <div className="absolute left-1/2 top-0 h-full w-8 -translate-x-1/2 rounded-sm bg-[#11131a] shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.05)] border border-[#2a2d3d]/50" />
            <div className="absolute top-1/2 left-0 w-full h-8 -translate-y-1/2 rounded-sm bg-[#11131a] shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.05)] border border-[#2a2d3d]/50" />
            {/* Center indent */}
            <div className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#11131a] shadow-inner" />
          </div>

          {/* Action Buttons */}
          <div className="relative h-32 w-36 ml-auto mr-8">
             {/* General */}
             <button
                onClick={() => { setActiveCategory("general"); setOpenIndex(0); }}
                className="absolute left-0 top-1/2 -translate-y-1/2 group size-12"
              >
                <div className={`flex h-full w-full items-center justify-center rounded-full border-b-4 transition-all group-active:translate-y-1 group-active:border-b-0 ${
                  activeCategory === "general"
                    ? "border-emerald-800 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                    : "border-[#0a0c10] bg-[#11131a] group-hover:bg-[#202330]"
                }`}>
                  <span className={`text-lg font-bold ${activeCategory === "general" ? "text-[#0a0c10]" : "text-emerald-500"}`}>G</span>
                </div>
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-widest text-[#6a7188]">GEN</span>
              </button>

             {/* Interview */}
             <button
                onClick={() => { setActiveCategory("interview"); setOpenIndex(0); }}
                className="absolute left-1/2 top-0 -translate-x-1/2 group size-12"
              >
                <div className={`flex h-full w-full items-center justify-center rounded-full border-b-4 transition-all group-active:translate-y-1 group-active:border-b-0 ${
                  activeCategory === "interview"
                    ? "border-emerald-800 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                    : "border-[#0a0c10] bg-[#11131a] group-hover:bg-[#202330]"
                }`}>
                  <span className={`text-lg font-bold ${activeCategory === "interview" ? "text-[#0a0c10]" : "text-emerald-500"}`}>I</span>
                </div>
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-widest text-[#6a7188]">INT</span>
              </button>

             {/* Technical */}
             <button
                onClick={() => { setActiveCategory("technical"); setOpenIndex(0); }}
                className="absolute right-0 top-1/2 -translate-y-1/2 group size-12"
              >
                <div className={`flex h-full w-full items-center justify-center rounded-full border-b-4 transition-all group-active:translate-y-1 group-active:border-b-0 ${
                  activeCategory === "technical"
                    ? "border-emerald-800 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                    : "border-[#0a0c10] bg-[#11131a] group-hover:bg-[#202330]"
                }`}>
                  <span className={`text-lg font-bold ${activeCategory === "technical" ? "text-[#0a0c10]" : "text-emerald-500"}`}>T</span>
                </div>
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-widest text-[#6a7188]">TECH</span>
              </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ──────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#030407] py-12 relative z-10">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex size-7 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/8 text-cyan-200">
              <span className="material-symbols-outlined text-[16px]">hub</span>
            </div>
            <div className="text-sm font-semibold tracking-wide text-white/90">SystemCraft</div>
          </div>
          <div className="flex items-center gap-8 text-sm text-white/45">
            <Link href="/practice" className="transition-colors hover:text-white">Practice</Link>
            <Link href="/dashboard" className="transition-colors hover:text-white">Dashboard</Link>
            <Link href="/login" className="transition-colors hover:text-white">Login</Link>
          </div>
          <div className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} SystemCraft. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Ambient Background ──────────────────────────────────────
function ClientParticles() {
  const [mounted, setMounted] = useState(false);
  
  const particles = useMemo(() => {
    return [...Array(15)].map(() => ({
      width: Math.random() * 2 + 1 + 'px',
      height: Math.random() * 2 + 1 + 'px',
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      duration: Math.random() * 20 + 20,
      xOffset: Math.random() * 50 - 25
    }));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ width: p.width, height: p.height, left: p.left, top: p.top }}
          animate={{
            y: [0, -100, 0],
            x: [0, p.xOffset, 0],
            opacity: [0.1, 0.4, 0.1]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </>
  );
}

function AmbientBackground() {
  const { scrollYProgress } = useScroll();
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2, 0.3], [0.8, 0.8, 0]);
  const timelineOpacity = useTransform(scrollYProgress, [0.1, 0.3, 0.6, 0.7], [0, 0.8, 0.8, 0]);
  const featuresOpacity = useTransform(scrollYProgress, [0.5, 0.7, 0.9, 0.95], [0, 0.8, 0.8, 0]);
  const ctaOpacity = useTransform(scrollYProgress, [0.8, 0.9, 1], [0, 0.8, 1]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#090B12]">
      {/* Layer 03: Noise */}
      <div className="absolute inset-0 opacity-[0.025] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Layer 04: Engineering Grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(to right, #ffffff 1px, transparent 1px),
          linear-gradient(to bottom, #ffffff 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px'
      }} />

      {/* Layer 06: Cursor Lighting */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.03), transparent 80%)`
        }}
      />

      {/* Layer 07 / Layer 13: Scroll Atmosphere */}
      {/* Hero (Purple/Indigo) */}
      <motion.div 
        style={{ opacity: heroOpacity }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.08),transparent_40%)]" 
      />

      {/* Timeline (Emerald/Cyan) */}
      <motion.div 
        style={{ opacity: timelineOpacity }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.06),transparent_60%),radial-gradient(circle_at_20%_40%,rgba(34,211,238,0.06),transparent_50%)]" 
      />

      {/* Features/Demos (Cyan/Blue) */}
      <motion.div 
        style={{ opacity: featuresOpacity }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.07),transparent_60%),radial-gradient(circle_at_80%_60%,rgba(59,130,246,0.07),transparent_50%)]" 
      />

      {/* CTA (Purple) */}
      <motion.div 
        style={{ opacity: ctaOpacity }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(168,85,247,0.08),transparent_60%)]" 
      />

      {/* Layer 05: Floating Particles (Dust) */}
      <div className="absolute inset-0 opacity-[0.4]">
         <ClientParticles />
      </div>
    </div>
  );
}

// ── Main Landing Page ───────────────────────────────────────
export default function SystemCraftLanding() {
  const [phase, setPhase] = useState<HeroPhase>("assembly");
  const [hoveredDemo, setHoveredDemo] = useState(demos[0]);
  const [reduceMotion, setReduceMotion] = useState(false);

  const demoRef = useRef<HTMLDivElement>(null);
  const demosInView = useInView(demoRef, { once: true, margin: "-100px" });
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-100px" });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    if (media.matches) return;

    const sequence: HeroPhase[] = ["assembly", "flow", "cache", "failure", "autoscale", "stable"];
    const timers = sequence.map((nextPhase, index) =>
      window.setTimeout(() => setPhase(nextPhase), 1400 + index * 1200),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  return (
    <main className="relative overflow-hidden bg-[#090B12] text-white">
      <AmbientBackground />

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-12 pt-6 sm:px-8 lg:px-10">
        {/* Nav */}
        <nav className="flex items-center justify-between rounded-full border border-white/[0.06] bg-white/[0.03] px-5 py-3 backdrop-blur-md">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/8 text-cyan-200">
              <span className="material-symbols-outlined text-[20px]">hub</span>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide">SystemCraft</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/30">System design interviews</div>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm text-white/45 md:flex">
            <a href="#story" className="transition-colors duration-300 hover:text-white">Story</a>
            <a href="#demos" className="transition-colors duration-300 hover:text-white">Demos</a>
            <a href="#ready" className="transition-colors duration-300 hover:text-white">Ready</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/45 transition-colors duration-300 hover:text-white">
              Sign in
            </Link>
            <Link href="/signup" className="rounded-full border border-white/[0.08] bg-white/[0.06] px-4 py-2 text-sm font-medium transition-all duration-300 hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]">
              Get started
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="grid gap-10 pb-20 pt-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:pt-24">
          <motion.div
            className="max-w-2xl"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={heroTextVariants}
              className="inline-flex items-center gap-2.5 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-cyan-200/80"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300" />
              </span>
              Live distributed system
            </motion.div>

            <motion.h1
              variants={heroTextVariants}
              className="mt-7 text-5xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-[5.5rem]"
            >
              Build systems.
              <span className="block bg-gradient-to-r from-white via-indigo-200 to-cyan-200 bg-clip-text text-transparent">
                Survive failures.
              </span>
            </motion.h1>

            <motion.p
              variants={heroTextVariants}
              className="mt-7 max-w-xl text-base leading-7 text-white/50 sm:text-lg"
            >
              SystemCraft is an AI-powered system design interview simulator that makes architecture feel alive before the first question is even asked.
            </motion.p>

            <motion.div variants={heroTextVariants} className="mt-9 flex flex-wrap gap-3">
              <Link href="/signup" className="group relative rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-cyan-100 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                Start designing
              </Link>
              <Link href="/practice" className="rounded-full border border-white/[0.08] bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.08]">
                Try a practice round
              </Link>
            </motion.div>

            <motion.div variants={heroTextVariants} className="mt-12 grid max-w-2xl grid-cols-3 gap-2.5">
              {[
                ["AI feedback", "Reasoning + structure"],
                ["Chaos events", "Failures, spikes, reroutes"],
                ["Replayable", "Iterate like an interview"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-colors duration-300 hover:border-white/[0.1] hover:bg-white/[0.05]">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-white/30">{label}</div>
                  <div className="mt-2 text-sm text-white/65">{value}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={reduceMotion ? "" : "animate-[float_12s_ease-in-out_infinite]"}
          >
            <NodeGraph phase={phase} />
          </motion.div>
        </div>
      </section>

      {/* ── TIMELINE ───────────────────────────────────────── */}
      <TimelineSection />

      {/* ── SCENARIOS ──────────────────────────────────────── */}
      <ScenariosSection />

      {/* ── DEMOS ──────────────────────────────────────────── */}
      <section id="demos" ref={demoRef} className="relative z-10 mx-auto max-w-7xl px-6 py-28 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0, y: 40 }}
            animate={demosInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/50">Interactive demonstrations</div>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Every component tells a story under load.
            </h2>
            <p className="mt-6 text-base leading-7 text-white/45">
              Explore how each layer of a distributed system behaves when traffic spikes, nodes fail, and queues grow. Each visualization reacts in real time.
            </p>

            {/* Live state panel */}
            <div className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
              <div className="text-[10px] uppercase tracking-[0.28em] text-white/25">Live state</div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={hoveredDemo.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{hoveredDemo.title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">{hoveredDemo.detail}</p>
                  <div
                    className="mt-5 inline-flex rounded-full border px-3 py-1 text-sm"
                    style={{
                      borderColor: `${hoveredDemo.color}33`,
                      backgroundColor: `${hoveredDemo.color}15`,
                      color: hoveredDemo.color,
                    }}
                  >
                    {hoveredDemo.metric}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Demo cards */}
          <motion.div
            className="grid gap-3 md:grid-cols-2"
            initial="hidden"
            animate={demosInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {demos.map((demo) => {
              const isActive = hoveredDemo.name === demo.name;
              return (
                <motion.button
                  key={demo.name}
                  variants={fadeUp}
                  type="button"
                  onMouseEnter={() => setHoveredDemo(demo)}
                  onFocus={() => setHoveredDemo(demo)}
                  className={`group rounded-2xl border p-5 text-left transition-all duration-300 ${
                    isActive
                      ? "border-white/[0.12] bg-white/[0.07] shadow-[0_0_40px_-12px_rgba(99,102,241,0.15)]"
                      : "border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]"
                  }`}
                >
                  <DemoViz demo={demo} isActive={isActive} />
                  <div className="text-[10px] uppercase tracking-[0.26em] text-white/25">{demo.name}</div>
                  <div className="mt-1.5 text-lg font-medium tracking-[-0.03em] text-white/85">{demo.title}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/40">{demo.detail}</p>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section id="ready" ref={ctaRef} className="relative z-10 mx-auto max-w-7xl px-6 py-28 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="animate-mesh relative overflow-hidden rounded-[2.5rem] border border-white/[0.08] p-10 sm:p-14 lg:p-20"
          style={{
            backgroundImage: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(34,211,238,0.06), rgba(168,85,247,0.08), rgba(99,102,241,0.1))",
          }}
        >
          {/* Subtle grid inside CTA */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />

          <div className="relative max-w-3xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-100/50">Become interview ready</div>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Design architectures that actually survive the interview.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/50">
              Build real distributed systems, face AI-driven chaos events, and receive structural feedback — all before your next system design round.
            </p>
          </div>
          <div className="relative mt-10 flex flex-wrap gap-3">
            <Link href="/signup" className="group rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-cyan-100 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]">
              Build my first system
            </Link>
            <Link href="/dashboard" className="rounded-full border border-white/[0.1] bg-white/[0.05] px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.1]">
              Open dashboard
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <FaqSection />

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <Footer />
    </main>
  );
}

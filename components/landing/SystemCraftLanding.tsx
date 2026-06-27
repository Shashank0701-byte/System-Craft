"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, useScroll, useTransform, useMotionValueEvent, type Variants } from "framer-motion";
import { InfrastructureEnvironment } from "./engine/InfrastructureEnvironment";

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
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full rounded-2xl border bg-[#050608]/90 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_25px_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md transition-all duration-500 hover:border-white/[0.12] hover:translate-y-[-2px] ${isActive ? "border-cyan-500/40 shadow-[0_15px_30px_-5px_rgba(34,211,238,0.05)]" : "border-white/[0.05]"}`}
        >
          {/* Corner accents */}
          <div className="absolute left-2 top-2 h-1 w-1 rounded-full bg-white/20" />
          <div className="absolute right-2 top-2 h-1 w-1 rounded-full bg-white/20" />
          <div className="absolute bottom-2 left-2 h-1 w-1 rounded-full bg-white/20" />
          <div className="absolute bottom-2 right-2 h-1 w-1 rounded-full bg-white/20" />
          <div className={`absolute left-1/2 top-2 h-1 w-3 -translate-x-1/2 rounded-full transition-colors duration-500 ${isActive ? "bg-cyan-400" : "bg-cyan-400/20"}`} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-dashed border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${isActive ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "bg-white/20"}`} />
              <div className={`text-[10px] font-mono tracking-wider transition-colors duration-500 ${isActive ? "text-cyan-400" : "text-white/40"}`}>
                [STATE]: {step.phase}
              </div>
            </div>
            <div className="text-[9px] font-mono tracking-[0.2em] uppercase text-white/30">
              NODE_0{index + 1}
            </div>
          </div>

          {/* Content */}
          <div className="pt-5">
            <h3 className={`flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-colors duration-500 ${isActive ? "text-cyan-400" : "text-white/70"}`}>
              <span className={isActive ? "text-cyan-500" : "text-white/30"}>{">"}</span> {step.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/40">
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
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full rounded-2xl border bg-[#050608]/90 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_25px_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md transition-all duration-500 hover:border-white/[0.12] hover:translate-y-[-2px] ${isActive ? "border-cyan-500/40 shadow-[0_15px_30px_-5px_rgba(34,211,238,0.05)]" : "border-white/[0.05]"}`}
          >
            <div className="absolute left-2 top-2 h-1 w-1 rounded-full bg-white/20" />
            <div className="absolute right-2 top-2 h-1 w-1 rounded-full bg-white/20" />
            <div className="absolute bottom-2 left-2 h-1 w-1 rounded-full bg-white/20" />
            <div className="absolute bottom-2 right-2 h-1 w-1 rounded-full bg-white/20" />
            <div className={`absolute left-1/2 top-2 h-1 w-3 -translate-x-1/2 rounded-full transition-colors duration-500 ${isActive ? "bg-cyan-400" : "bg-cyan-400/20"}`} />

            <div className="flex items-center justify-between border-b border-dashed border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${isActive ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "bg-white/20"}`} />
                <div className={`text-[10px] font-mono tracking-wider transition-colors duration-500 ${isActive ? "text-cyan-400" : "text-white/40"}`}>
                  [STATE]: {step.phase}
                </div>
              </div>
              <div className="text-[9px] font-mono tracking-[0.2em] uppercase text-white/30">
                NODE_0{index + 1}
              </div>
            </div>

            <div className="pt-5">
              <h3 className={`flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-colors duration-500 ${isActive ? "text-cyan-400" : "text-white/70"}`}>
                <span className={isActive ? "text-cyan-500" : "text-white/30"}>{">"}</span> {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/40">
                {step.copy}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Center dot on the timeline for this specific card */}
      <div 
        className={`absolute top-1/2 left-[24px] z-10 hidden size-3 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 bg-[#0A0D14] transition-all duration-300 md:block md:left-1/2 ${
          isActive ? "border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] scale-125" : "border-white/20 scale-100"
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
    <motion.section
      id="story"
      initial={{ opacity: 0, y: 30, scale: 0.99 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 mx-auto max-w-7xl px-6 py-32 sm:px-8 lg:px-10"
    >
      <div className="mb-24 text-center">
        <h2 className="font-display text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          The Architecture Journey
        </h2>
      </div>

      <div ref={lineRef} className="relative mx-auto max-w-4xl">
        {/* Center line (subtle background line) */}
        <div className="absolute bottom-0 left-[24px] top-0 hidden w-px bg-gradient-to-b from-transparent via-white/5 to-transparent md:block md:left-1/2 md:-translate-x-1/2" />
        {/* Center dotted line */}
        <div className="absolute bottom-0 left-[24px] top-0 hidden w-px border-l-2 border-dotted border-white/[0.08] md:block md:left-1/2 md:-translate-x-1/2" />
        
        {/* Glowing scroll tracking line (draws down continuously) */}
        <motion.div
          className="absolute left-[23px] top-0 z-10 hidden w-[2px] origin-top bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)] md:block md:left-1/2 md:-translate-x-1/2"
          style={{ height: lineHeight }}
        />
        
        {/* Leading bullet at the tip of the drawing line */}
        <motion.div
          className="absolute left-[24px] top-0 z-20 hidden size-2.5 rounded-full bg-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.8)] md:block md:left-1/2 md:-translate-x-1/2"
          style={{ top: lineHeight, marginTop: "-5px" }}
        />

        <div className="flex flex-col gap-12 md:gap-8">
          {timelineSteps.map((step, index) => (
            <TimelineCard key={step.phase} step={step} index={index} isLeft={index % 2 === 0} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ── Node Graph (Hero) ───────────────────────────────────────
const segmentsWithIds = [
  { from: "users", to: "cdn" },
  { from: "cdn", to: "lb" },
  { from: "lb", to: "app" },
  { from: "app", to: "cache" },
  { from: "app", to: "db" },
  { from: "db", to: "replica" },
  { from: "app", to: "queue" },
];

function NodeGraph({ phase }: { phase: HeroPhase }) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<Record<string, { val1: string; val2: string }>>({});

  const activeLines = useMemo(() => {
    if (phase === "assembly") return 1;
    if (phase === "flow") return 4;
    if (phase === "cache") return 5;
    if (phase === "failure") return 6;
    return 7;
  }, [phase]);

  // Update telemetry values periodically for a live monitoring dashboard feel
  useEffect(() => {
    const update = () => {
      const newTelemetry: Record<string, { val1: string; val2: string }> = {};
      nodes.forEach((n) => {
        if (n.id === "lb") {
          newTelemetry[n.id] = {
            val1: `${(92.4 + Math.random() * 5).toFixed(1)}%`,
            val2: `${Math.floor(2200 + Math.random() * 400)} RPS`
          };
        } else if (n.id === "cache") {
          newTelemetry[n.id] = {
            val1: `HIT:${(98.1 + Math.random() * 1.5).toFixed(1)}%`,
            val2: `MEM:${(42.5 + Math.random() * 2).toFixed(1)}%`
          };
        } else if (n.id === "db") {
          newTelemetry[n.id] = {
            val1: phase === "failure" ? "ERR_503" : `LOAD:${Math.floor(20 + Math.random() * 15)}%`,
            val2: `CONN:${phase === "failure" ? "0" : Math.floor(45 + Math.random() * 10)}`
          };
        } else if (n.id === "app") {
          newTelemetry[n.id] = {
            val1: `CPU:${Math.floor(15 + Math.random() * 10)}%`,
            val2: `P99:${Math.floor(18 + Math.random() * 5)}MS`
          };
        } else if (n.id === "queue") {
          newTelemetry[n.id] = {
            val1: `LAG:${phase === "failure" ? Math.floor(120 + Math.random() * 30) : 0}`,
            val2: `MSG:${Math.floor(45 + Math.random() * 10)}/S`
          };
        } else if (n.id === "replica") {
          newTelemetry[n.id] = {
            val1: phase === "failure" ? "LAGGING" : `LAG:0.2MS`,
            val2: "SYNC:OK"
          };
        } else if (n.id === "cdn") {
          newTelemetry[n.id] = {
            val1: "HIT:94.2%",
            val2: "18MS"
          };
        } else {
          newTelemetry[n.id] = {
            val1: "RATE:120/S",
            val2: "ACTIVE"
          };
        }
      });
      setTelemetry(newTelemetry);
    };
    update();
    const interval = setInterval(update, 1200);
    return () => clearInterval(interval);
  }, [phase]);

  // Determine if a line is active / highlighted based on hovered node
  const getLineStroke = (index: number, visible: boolean) => {
    if (!visible) return "rgba(148, 163, 184, 0.08)";
    if (!hoveredNode) return "url(#networkGlow)";
    const conn = segmentsWithIds[index];
    const isRelated = conn.from === hoveredNode || conn.to === hoveredNode;
    return isRelated ? "url(#activeConnectionGlow)" : "rgba(99, 102, 241, 0.12)";
  };

  const getLineOpacity = (index: number, visible: boolean) => {
    if (!visible) return 0.25;
    if (!hoveredNode) return 1.0;
    const conn = segmentsWithIds[index];
    const isRelated = conn.from === hoveredNode || conn.to === hoveredNode;
    return isRelated ? 1.0 : 0.25;
  };

  // Determine node visual state on hover
  const isNodeActive = (nodeId: string, active: boolean) => {
    if (!active) return false;
    if (!hoveredNode) return true;
    if (nodeId === hoveredNode) return true;
    return segmentsWithIds.some(
      (s) =>
        (s.from === hoveredNode && s.to === nodeId) ||
        (s.to === hoveredNode && s.from === nodeId)
    );
  };

  return (
    <div className="noise-overlay relative h-[29rem] overflow-hidden rounded-[2.5rem] border border-white/[0.08] bg-[#030407]/95 shadow-[0_45px_100px_-30px_rgba(0,0,0,0.85)]">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_40%),radial-gradient(circle_at_bottom,rgba(34,211,238,0.06),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.01),transparent_30%,rgba(0,0,0,0.4))]" />
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:56px_56px] opacity-25 [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]" />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 520" aria-hidden="true">
        <defs>
          <linearGradient id="networkGlow" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="activeConnectionGlow" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#38bdf8" />
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
              stroke={getLineStroke(index, visible)}
              strokeWidth={hoveredNode ? "1.8" : "1.5"}
              strokeLinecap="round"
              strokeDasharray={visible ? "0" : "4 8"}
              opacity={getLineOpacity(index, visible)}
              className="transition-all duration-500 ease-out"
            />
          );
        })}

        {/* Animated request packets */}
        {phase !== "assembly" &&
          segments.slice(0, activeLines).map((segment, index) => {
            const [x1, y1] = segment.from;
            const [x2, y2] = segment.to;
            // Photons speed variance
            const duration = 1.2 + (index % 3) * 0.4;
            return (
              <circle key={`packet-${index}`} r="3" fill="#22d3ee" opacity="0.9" filter="url(#softGlow)">
                <animateMotion
                  dur={`${duration}s`}
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

          const baseRadius = node.id === "lb" ? 42 : node.id === "app" ? 40 : 34;
          const isHovered = node.id === hoveredNode;
          const isCurrentActive = isNodeActive(node.id, active);

          return (
            <g
              key={node.id}
              filter="url(#softGlow)"
              className="cursor-pointer transition-all duration-300"
              onMouseEnter={() => active && setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Pulse rings on packet impact */}
              {active && (
                <motion.circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r={baseRadius + 8}
                  fill="none"
                  stroke={failure ? "#ef4444" : "#22d3ee"}
                  strokeWidth="0.5"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isHighlighted || failure ? [0.1, 0.4, 0.1] : [0.03, 0.15, 0.03],
                    scale: isHighlighted || failure ? [0.95, 1.05, 0.95] : [0.98, 1.02, 0.98]
                  }}
                  transition={{
                    duration: isHighlighted || failure ? 1.5 : 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}

              {/* Outer casing */}
              <motion.circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                animate={{
                  r: isHovered ? baseRadius + 3 : baseRadius,
                  stroke: failure
                    ? "#f43f5e"
                    : isHovered
                    ? "#22d3ee"
                    : isCurrentActive
                    ? "rgba(96,165,250,0.3)"
                    : "rgba(148,163,184,0.08)",
                  fill: failure
                    ? "rgba(127,29,29,0.18)"
                    : isHovered
                    ? "rgba(15,23,42,0.92)"
                    : isCurrentActive
                    ? "rgba(15,23,42,0.85)"
                    : "rgba(15,23,42,0.4)"
                }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                strokeWidth="1"
              />

              {/* Inner core */}
              <circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r={node.id === "lb" ? 18 : 14}
                fill={isHighlighted ? "#22d3ee" : failure ? "#ef4444" : "#c4b5fd"}
                opacity={isHighlighted || failure ? 0.95 : isHovered ? 0.4 : 0.15}
                className={`transition-all duration-300 ${isHighlighted || failure ? "animate-node-pulse" : ""}`}
              />
            </g>
          );
        })}
      </svg>

      {/* Node labels & Microscopic Telemetry */}
      {nodes.map((node) => {
        const active = phase !== "assembly" || node.id === "users" || node.id === "cdn" || node.id === "lb" || node.id === "app";
        const highlighted =
          (phase === "cache" && node.id === "cache") ||
          (phase === "failure" && node.id === "db") ||
          (phase === "autoscale" && node.id === "replica");
        const isHovered = node.id === hoveredNode;

        return (
          <div
            key={node.id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-3 py-1.5 transition-all duration-300 pointer-events-none ${
              highlighted
                ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.12)]"
                : isHovered
                ? "border-cyan-300/35 bg-[#0A0D14] text-white"
                : "border-white/[0.05] bg-[#030407]/75 text-white/50"
            }`}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              opacity: active ? 1 : 0.25
            }}
          >
            <div className="flex flex-col items-center select-none">
              <span className="text-[9px] font-bold tracking-[0.16em] uppercase leading-none">
                {node.label}
              </span>
              {active && telemetry[node.id] && (
                <span className="mt-1 font-mono text-[7px] text-cyan-400/60 tracking-tight uppercase leading-none">
                  {telemetry[node.id].val1} | {telemetry[node.id].val2}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Phase indicator */}
      <div className="absolute left-5 top-5 flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-black/60 px-3.5 py-2 backdrop-blur-md">
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
            className="text-[10px] font-mono font-medium tracking-[0.22em] uppercase text-white/70"
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
          <div key={label} className="rounded-xl border border-white/[0.06] bg-black/50 px-4 py-3 backdrop-blur-md">
            <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/30">{label}</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={value}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className={`mt-1 text-base font-semibold font-mono tracking-tight tabular-nums ${
                  label === "Health" && value === "degraded" ? "text-rose-400 animate-pulse" : "text-white"
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
    <motion.section
      id="scenarios"
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 mx-auto max-w-6xl px-6 py-28 sm:px-8 lg:px-10"
    >
      <div className="mb-16 text-center">
        <h2 className="font-display text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Core Concepts
        </h2>
      </div>

      <div 
        className="mx-auto flex flex-col overflow-hidden rounded-[2.5rem] border border-white/[0.05] bg-[#050608]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_30px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-500 hover:border-white/[0.1] md:h-[500px] md:flex-row"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Left Sidebar */}
        <div className="flex w-full flex-col border-r border-white/[0.05] bg-[#030407]/40 md:w-80">
          <div className="px-6 py-6 text-[9px] font-bold tracking-[0.25em] font-mono uppercase text-cyan-400">
            Available Scenarios
          </div>
          <div className="flex flex-1 flex-col py-2">
            {scenariosData.map((scenario, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={scenario.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`group relative flex items-center px-6 py-4 text-left transition-all duration-[400ms] cubic-bezier(0.16,1,0.3,1) ${
                    isActive ? "bg-white/[0.03]" : "hover:bg-white/[0.01]"
                  }`}
                >
                  <span className={`text-sm font-medium transition-colors duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isActive ? "text-cyan-400 font-semibold" : "text-white/40 group-hover:text-white/65"}`}>
                    {scenario.name}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute bottom-0 right-0 top-0 w-[3px] bg-gradient-to-b from-cyan-400 to-indigo-500 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content */}
        <div className="relative flex flex-1 flex-col items-center justify-center p-8 md:p-12 overflow-hidden bg-gradient-to-b from-[#080b11]/30 to-[#030406]/10">
          {/* Faint Scanlines */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:100%_4px]" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeScenario.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-md"
            >
              {/* Icon & Audio Wave */}
              <div className="mb-10 flex items-center gap-8">
                <div className="relative flex size-24 items-center justify-center">
                  <motion.svg
                    viewBox="0 0 100 100"
                    className="absolute inset-0 size-full text-cyan-500/15"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 6" />
                  </motion.svg>
                  
                  <div className="absolute inset-2 rounded-full border border-cyan-500/10 bg-cyan-950/[0.02] shadow-[0_0_30px_rgba(34,211,238,0.06)]" />
                  
                  <span className="material-symbols-outlined z-10 text-[40px] text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]">
                    {activeScenario.icon}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-60">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-cyan-400"
                      animate={{ height: [8, Math.random() * 20 + 10, 8] }}
                      transition={{ duration: 0.5 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </div>

              {/* Text Content */}
              <div>
                <h3 className="font-display text-3xl font-bold tracking-[-0.03em] text-white drop-shadow-md">
                  {activeScenario.name}
                </h3>
                <div className="mt-3 h-[2px] w-12 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />

                <div className="mt-8 flex items-start gap-2">
                  <span className="font-mono text-sm font-bold text-cyan-400">{">_desc:"}</span>
                  <p className="font-mono text-sm leading-relaxed text-white/50">
                    {activeScenario.desc}
                  </p>
                </div>

                {/* Complexity Meter */}
                <div className="mt-12">
                  <div className="mb-3 text-[9px] font-bold tracking-[0.25em] font-mono uppercase text-white/20">
                    Complexity Level
                  </div>
                  <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-8 rounded-full transition-colors duration-500 ${
                          i < activeScenario.complexity 
                            ? "bg-gradient-to-r from-cyan-400 to-indigo-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]" 
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
    </motion.section>
  );
}

function FaqSection() {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>("general");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const currentFaqs = faqData[activeCategory];

  return (
    <motion.section
      id="faq"
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 mx-auto max-w-5xl px-6 py-28 sm:px-8 lg:px-10"
    >
      <div className="mb-16 text-center">
        <h2 className="font-display text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Frequently Asked Questions
        </h2>
      </div>

      {/* The Console Shell */}
      <div className="mx-auto max-w-4xl rounded-[3rem] rounded-br-[5rem] border border-white/[0.06] bg-[#050608]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_40px_100px_-20px_rgba(0,0,0,0.85)] md:p-8 relative">
        
        {/* Speaker Grill Accent */}
        <div className="absolute bottom-10 right-10 flex gap-1.5 rotate-[-25deg] opacity-30">
           <div className="h-10 w-2 rounded-full bg-black/80 shadow-inner" />
           <div className="h-10 w-2 rounded-full bg-black/80 shadow-inner" />
           <div className="h-10 w-2 rounded-full bg-black/80 shadow-inner" />
           <div className="h-10 w-2 rounded-full bg-black/80 shadow-inner" />
        </div>

        {/* Top LEDs */}
        <div className="mb-4 flex items-center justify-between px-4">
           <div className="flex items-center gap-2">
             <div className="size-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
             <div className="text-[9px] font-bold tracking-[0.25em] font-mono text-white/30">PWR</div>
           </div>
           <div className="text-[9px] font-bold tracking-[0.25em] font-mono text-white/30">SYSTEMCRAFT OS v1.0</div>
        </div>

        {/* The Screen */}
        <div className="relative h-[380px] overflow-hidden rounded-xl border-8 border-black/90 bg-[#020305] p-1 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)] font-mono md:h-[450px] md:p-2">
            {/* Scanlines (pointer-events-none ensures it doesn't block scrolling) */}
            <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-15" />
            
            {/* Scrollable Container */}
            <div className="h-full w-full overflow-y-auto p-4 md:p-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#020305] [&::-webkit-scrollbar-thumb]:bg-cyan-950/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-cyan-500/50">
              
              {/* Header */}
              <div className="mb-6 flex items-center gap-3 border-b border-cyan-950/50 pb-4 text-cyan-400/80">
                <span className="animate-pulse">_</span>
                <span className="tracking-widest text-xs">DIR: /{activeCategory.toUpperCase()}</span>
              </div>

              {/* Accordion */}
              <div className="relative z-10 flex flex-col gap-3">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-3"
                >
                  {currentFaqs.map((faq, i) => {
                    const isOpen = openIndex === i;
                    return (
                      <div key={i} className="overflow-hidden rounded-lg border border-cyan-950/30 bg-cyan-950/5 shrink-0 transition-colors duration-300">
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : i)}
                          className="flex w-full items-center justify-between p-4 text-left text-sm text-cyan-400/80 transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-cyan-950/10 hover:text-cyan-300"
                        >
                          <span className="flex gap-3">
                            <span className="text-cyan-600/85 pointer-events-none">{">"}</span>
                            <span className="pointer-events-none">{faq.q}</span>
                          </span>
                          <span className={`text-[9px] pointer-events-none transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                            ▼
                          </span>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-4 pb-4 pl-10 text-sm leading-relaxed text-white/50"
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
            <div className="absolute left-1/2 top-0 h-full w-8 -translate-x-1/2 rounded-sm bg-[#090a0f] shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.02)] border border-white/[0.04]" />
            <div className="absolute top-1/2 left-0 w-full h-8 -translate-y-1/2 rounded-sm bg-[#090a0f] shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.02)] border border-white/[0.04]" />
            {/* Center indent */}
            <div className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#050608] shadow-inner" />
          </div>

          {/* Action Buttons */}
          <div className="relative h-32 w-36 ml-auto mr-8">
             {/* General */}
             <button
                onClick={() => { setActiveCategory("general"); setOpenIndex(0); }}
                className="absolute left-0 top-1/2 -translate-y-1/2 group size-12"
              >
                <div className={`flex h-full w-full items-center justify-center rounded-full border-b-4 transition-all duration-[400ms] cubic-bezier(0.16,1,0.3,1) group-active:translate-y-1 group-active:border-b-0 ${
                  activeCategory === "general"
                    ? "border-cyan-800 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    : "border-black/50 bg-[#090b0f] group-hover:bg-[#121620]"
                }`}>
                  <span className={`text-lg font-bold font-mono transition-colors duration-[400ms] ${activeCategory === "general" ? "text-black" : "text-cyan-400"}`}>G</span>
                </div>
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold font-mono tracking-widest text-white/20">GEN</span>
              </button>

             {/* Interview */}
             <button
                onClick={() => { setActiveCategory("interview"); setOpenIndex(0); }}
                className="absolute left-1/2 top-0 -translate-x-1/2 group size-12"
              >
                <div className={`flex h-full w-full items-center justify-center rounded-full border-b-4 transition-all duration-[400ms] cubic-bezier(0.16,1,0.3,1) group-active:translate-y-1 group-active:border-b-0 ${
                  activeCategory === "interview"
                    ? "border-cyan-800 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    : "border-black/50 bg-[#090b0f] group-hover:bg-[#121620]"
                }`}>
                  <span className={`text-lg font-bold font-mono transition-colors duration-[400ms] ${activeCategory === "interview" ? "text-black" : "text-cyan-400"}`}>I</span>
                </div>
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold font-mono tracking-widest text-white/20">INT</span>
              </button>

             {/* Technical */}
             <button
                onClick={() => { setActiveCategory("technical"); setOpenIndex(0); }}
                className="absolute right-0 top-1/2 -translate-y-1/2 group size-12"
              >
                <div className={`flex h-full w-full items-center justify-center rounded-full border-b-4 transition-all duration-[400ms] cubic-bezier(0.16,1,0.3,1) group-active:translate-y-1 group-active:border-b-0 ${
                  activeCategory === "technical"
                    ? "border-cyan-800 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    : "border-black/50 bg-[#090b0f] group-hover:bg-[#121620]"
                }`}>
                  <span className={`text-lg font-bold font-mono transition-colors duration-[400ms] ${activeCategory === "technical" ? "text-black" : "text-cyan-400"}`}>T</span>
                </div>
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold font-mono tracking-widest text-white/20">TECH</span>
              </button>
          </div>
        </div>
      </div>
    </motion.section>
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



// ── Main Landing Page ───────────────────────────────────────
export default function SystemCraftLanding() {
  const [phase, setPhase] = useState<HeroPhase>("assembly");
  const [hoveredDemo, setHoveredDemo] = useState(demos[0]);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string>("hero");

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

  useEffect(() => {
    const sections = ["hero", "story", "scenarios", "demos", "ready", "faq"];
    const observerOptions = {
      root: null,
      rootMargin: "-45% 0px -45% 0px",
      threshold: 0.05,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="relative overflow-hidden bg-[#020306] text-white">
      <InfrastructureEnvironment />

      {/* ── BESPOKE FLOATING NAVIGATION ─────────────────────────── */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex w-[90%] max-w-5xl items-center justify-between rounded-full border border-white/[0.04] bg-[#05060a]/50 px-5 py-2.5 backdrop-blur-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-300">
            <span className="material-symbols-outlined text-[15px] select-none">hub</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-wider leading-none text-white/90">SystemCraft</span>
            <span className="text-[7px] uppercase tracking-[0.25em] text-white/20 mt-0.5 select-none">interviews</span>
          </div>
        </Link>

        {/* Center links with glass pill hover */}
        <div className="hidden items-center gap-2 md:flex">
          {[
            { href: "#story", label: "Story" },
            { href: "#demos", label: "Demos" },
            { href: "#ready", label: "Ready" }
          ].map((link, idx) => (
            <a
              key={link.label}
              href={link.href}
              onMouseEnter={() => setHoveredNav(idx)}
              onMouseLeave={() => setHoveredNav(null)}
              className="relative rounded-full px-4 py-1.5 text-xs font-medium tracking-wide text-white/45 transition-colors duration-300 hover:text-white"
            >
              <span className="relative z-10">{link.label}</span>
              {hoveredNav === idx && (
                <motion.div
                  layoutId="nav-hover-pill"
                  className="absolute inset-0 rounded-full border border-white/[0.04] bg-white/[0.03]"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
            </a>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs font-semibold tracking-wider text-white/45 transition-colors duration-300 hover:text-white">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="group relative flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium tracking-wide text-white transition-all duration-300 hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── LEFT MARGIN HUD AXIS ─────────────────────────────────── */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-6 font-mono text-[7px] uppercase tracking-[0.25em] pointer-events-none select-none">
        {[
          { id: "hero", label: "SYS_LOC.01 // HERO" },
          { id: "story", label: "SYS_LOC.02 // STORY" },
          { id: "scenarios", label: "SYS_LOC.03 // CONCEPTS" },
          { id: "demos", label: "SYS_LOC.04 // DEMOS" },
          { id: "ready", label: "SYS_LOC.05 // READY" },
          { id: "faq", label: "SYS_LOC.06 // FAQ" },
        ].map((item) => {
          const isActive = activeSection === item.id;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 transition-all duration-500 ${
                isActive ? "text-cyan-400 font-bold" : "text-white/20"
              }`}
            >
              <span
                className={`h-[1.5px] transition-all duration-500 ${
                  isActive
                    ? "w-6 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                    : "w-4 bg-white/10"
                }`}
              />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section id="hero" className="relative z-10 mx-auto max-w-7xl px-6 pb-12 pt-6 sm:px-8 lg:px-10">
        <div className="h-16" />

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
              className="inline-flex items-center gap-2.5 rounded-full border border-cyan-300/15 bg-cyan-300/[0.04] px-4 py-2 text-[10px] uppercase font-mono tracking-[0.28em] text-cyan-200/80"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300" />
              </span>
              Live distributed system
            </motion.div>

            <motion.h1
              variants={heroTextVariants}
              className="mt-7 font-display text-5xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-[5.5rem]"
              transition={{ ease: [0.16, 1, 0.3, 1] }}
            >
              Build systems.
              <span className="block bg-gradient-to-r from-white via-indigo-200 to-cyan-100 bg-clip-text text-transparent">
                Survive failures.
              </span>
            </motion.h1>

            <motion.p
              variants={heroTextVariants}
              className="mt-7 max-w-xl text-sm leading-relaxed text-white/40 sm:text-base"
              transition={{ ease: [0.16, 1, 0.3, 1] }}
            >
              SystemCraft is an AI-powered system design interview simulator that makes architecture feel alive before the first question is even asked.
            </motion.p>

            <motion.div variants={heroTextVariants} className="mt-9 flex flex-wrap gap-3">
              <Link href="/signup" className="group relative overflow-hidden rounded-full bg-white px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-black transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-cyan-50 hover:shadow-[0_15px_30px_-5px_rgba(34,211,238,0.25)]">
                Start designing
              </Link>
              <Link href="/practice" className="rounded-full border border-white/[0.08] bg-white/[0.03] px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/[0.18] hover:bg-white/[0.08]">
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
      <motion.section
        id="demos"
        ref={demoRef}
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto max-w-7xl px-6 py-28 sm:px-8 lg:px-10"
      >
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0, y: 40 }}
            animate={demosInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/50">Interactive demonstrations</div>
            <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Every component tells a story under load.
            </h2>
            <p className="mt-6 text-base leading-7 text-white/45">
              Explore how each layer of a distributed system behaves when traffic spikes, nodes fail, and queues grow. Each visualization reacts in real time.
            </p>

            {/* Live state panel */}
            <div className="mt-10 rounded-2xl border border-white/[0.05] bg-[#050608]/90 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_20px_40px_rgba(0,0,0,0.5)]">
              <div className="text-[10px] uppercase tracking-[0.28em] text-white/25">Live state</div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={hoveredDemo.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em]">{hoveredDemo.title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">{hoveredDemo.detail}</p>
                  <div
                    className="mt-5 inline-flex rounded-full border px-3 py-1 text-sm font-mono"
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
                  className={`group rounded-2xl border p-5 text-left transition-all duration-[400ms] cubic-bezier(0.16,1,0.3,1) ${
                    isActive
                      ? "border-cyan-500/40 bg-[#050608]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_20px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(34,211,238,0.05)] translate-y-[-2px]"
                      : "border-white/[0.05] bg-[#050608]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] hover:border-white/[0.12] hover:bg-[#050608]/80 hover:translate-y-[-2px] hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]"
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
      </motion.section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <motion.section
        id="ready"
        ref={ctaRef}
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto max-w-7xl px-6 py-28 sm:px-8 lg:px-10"
      >
        <div
          className="relative overflow-hidden rounded-[3rem] border border-white/[0.05] bg-[#050608]/95 p-10 sm:p-14 lg:p-20 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_40px_100px_-20px_rgba(0,0,0,0.85)]"
          style={{
            background: "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)",
          }}
        >
          {/* Subtle grid inside CTA */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />

          <div className="relative max-w-3xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-100/50">Become interview ready</div>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Design architectures that actually survive the interview.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/50">
              Build real distributed systems, face AI-driven chaos events, and receive structural feedback — all before your next system design round.
            </p>
          </div>
          <div className="relative mt-10 flex flex-wrap gap-3">
            <Link href="/signup" className="group relative overflow-hidden rounded-full bg-white px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-black transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-cyan-50 hover:shadow-[0_15px_30px_-5px_rgba(34,211,238,0.25)]">
              Build my first system
            </Link>
            <Link href="/dashboard" className="group flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/[0.18] hover:bg-white/[0.08] hover:shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
              Open dashboard
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <FaqSection />

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <Footer />
    </main>
  );
}

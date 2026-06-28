'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface DesignCardProps {
  id: string;
  title: string;
  status: 'DRAFT' | 'REVIEWED' | 'COMPLETED';
  editedTime: string;
  imageUrl?: string;
  reviewers?: boolean;
  nodeCount?: number;
  connectionCount?: number;
  onDelete?: (id: string) => Promise<void>;
}

export function DesignCard({ id, title, status, editedTime, nodeCount = 0, connectionCount = 0, onDelete }: DesignCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Generate a distinct mock layout seed based on design id to display different layout previews
  const topologySeed = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }, [id]);

  // Topology node layout configurations
  const nodes = useMemo(() => {
    const layoutIndex = topologySeed % 3;
    if (layoutIndex === 0) {
      return [
        { label: 'LB', x: 20, y: 35 },
        { label: 'APP', x: 50, y: 20 },
        { label: 'CACHE', x: 80, y: 20 },
        { label: 'DB', x: 80, y: 50 },
        { label: 'MQ', x: 50, y: 50 },
      ];
    } else if (layoutIndex === 1) {
      return [
        { label: 'LB', x: 20, y: 35 },
        { label: 'APP', x: 45, y: 35 },
        { label: 'CACHE', x: 70, y: 20 },
        { label: 'DB', x: 70, y: 50 },
        { label: 'REP', x: 90, y: 50 },
      ];
    } else {
      return [
        { label: 'LB', x: 15, y: 35 },
        { label: 'GW', x: 40, y: 35 },
        { label: 'API', x: 65, y: 20 },
        { label: 'DB', x: 65, y: 50 },
        { label: 'WRK', x: 85, y: 35 },
      ];
    }
  }, [topologySeed]);

  const edges = useMemo(() => {
    const layoutIndex = topologySeed % 3;
    if (layoutIndex === 0) {
      return [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 1, to: 4 },
      ];
    } else if (layoutIndex === 1) {
      return [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 3, to: 4 },
      ];
    } else {
      return [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 3, to: 4 },
        { from: 2, to: 4 },
      ];
    }
  }, [topologySeed]);

  // Derived mock operational metrics
  const mockLatency = useMemo(() => {
    return 10 + (topologySeed % 15);
  }, [topologySeed]);

  const mockComplexity = useMemo(() => {
    const val = nodeCount;
    return val > 8 ? 'HIGH' : val > 4 ? 'MEDIUM' : 'LOW';
  }, [nodeCount]);

  const mockHealth = useMemo(() => {
    const val = topologySeed % 100;
    if (status === 'COMPLETED') return { label: '100% HEALTHY', color: 'text-emerald-400', dot: 'bg-emerald-400' };
    if (val > 85) return { label: 'DEGRADED', color: 'text-amber-400', dot: 'bg-amber-400' };
    return { label: 'OPERATIONAL', color: 'text-cyan-400', dot: 'bg-cyan-400' };
  }, [topologySeed, status]);

  const statusColor = {
    'DRAFT': 'border-white/10 text-white/40 bg-white/[0.01]',
    'REVIEWED': 'border-cyan-400/20 text-cyan-400 bg-cyan-400/5',
    'COMPLETED': 'border-emerald-400/20 text-emerald-400 bg-emerald-400/5'
  }[status];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <>
      <Link href={`/canvas/${id}`}>
        <div className="group flex flex-col rounded-xl bg-[#0c0d16]/30 border border-white/[0.04] hover:border-white/[0.12] hover:bg-[#0c0d16]/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.02)] transition-all duration-300 overflow-hidden cursor-pointer h-full select-none relative">
          
          {/* Top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] group-hover:via-white/[0.1] to-transparent transition-all duration-300" />

          {/* Living Topology Preview Canvas */}
          <div className="h-34 w-full bg-[#060810]/80 relative overflow-hidden flex items-center justify-center p-2">
            <svg
              viewBox="0 0 100 70"
              className="absolute inset-0 h-full w-full opacity-55 group-hover:opacity-85 transition-opacity duration-300"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id={`edgeGrad-${id}`} x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.08" />
                </linearGradient>
              </defs>

              {/* Connections */}
              {edges.map((edge, i) => {
                const from = nodes[edge.from];
                const to = nodes[edge.to];
                if (!from || !to) return null;
                return (
                  <line
                    key={i}
                    x1={from.x} y1={from.y}
                    x2={to.x} y2={to.y}
                    stroke={`url(#edgeGrad-${id})`}
                    strokeWidth="0.55"
                  />
                );
              })}

              {/* Packets */}
              {edges.map((edge, i) => {
                const from = nodes[edge.from];
                const to = nodes[edge.to];
                if (!from || !to) return null;
                const dur = 3.5 + i * 1.2;
                return (
                  <circle
                    key={`p-${i}`}
                    r="0.5"
                    fill="#22d3ee"
                    opacity="0.5"
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
              {nodes.map((node, i) => (
                <g key={i}>
                  {/* Breath pulse */}
                  <circle
                    cx={node.x} cy={node.y} r="3.5"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="0.25"
                    opacity="0.06"
                  >
                    <animate
                      attributeName="r"
                      values="3.2;4.2;3.2"
                      dur="6s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.03;0.1;0.03"
                      dur="6s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx={node.x} cy={node.y} r="1.6"
                    fill="#080a12"
                    stroke="rgba(34,211,238,0.2)"
                    strokeWidth="0.4"
                  />
                </g>
              ))}
            </svg>

            {/* Micro Node labels */}
            {nodes.map((node, i) => (
              <span
                key={i}
                className="absolute text-[5px] font-mono tracking-wider text-white/20 uppercase pointer-events-none -translate-x-1/2"
                style={{ left: `${node.x}%`, top: `${node.y + 4}%` }}
              >
                {node.label}
              </span>
            ))}

            {/* Menu overlay toggles */}
            <div className="absolute top-2.5 right-2.5" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="bg-[#0c0d16]/80 hover:bg-[#0c0d16] text-white/50 hover:text-white/80 p-1.5 rounded-lg border border-white/[0.05] shadow-md transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">more_horiz</span>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-36 bg-[#0c0d16] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/[0.06] overflow-hidden z-50 p-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 flex items-center gap-2 rounded-lg text-left text-xs font-mono uppercase tracking-wider text-white/50 hover:bg-white/[0.02] hover:text-white/80 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                    <span>Rename</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 flex items-center gap-2 rounded-lg text-left text-xs font-mono uppercase tracking-wider text-white/50 hover:bg-white/[0.02] hover:text-white/80 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">content_copy</span>
                    <span>Duplicate</span>
                  </button>
                  <div className="border-t border-white/[0.04] my-1" />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      setIsConfirmOpen(true);
                    }}
                    className="w-full px-2.5 py-1.5 flex items-center gap-2 rounded-lg text-left text-xs font-mono uppercase tracking-wider text-red-400 hover:bg-red-500/[0.06] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete</span>
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>

            {/* Health status led dot */}
            <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/45 border border-white/[0.03] text-[7px] font-mono tracking-widest uppercase">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${mockHealth.dot} opacity-70 animate-pulse`} />
              <span className="text-white/30">{mockHealth.label}</span>
            </div>
          </div>

          {/* Description / metadata body */}
          <div className="p-4 flex flex-col flex-1">
            <h4 className="text-xs font-bold tracking-tight text-white/85 group-hover:text-cyan-400 transition-colors font-display line-clamp-1">
              {title}
            </h4>

            {/* Simple metadata */}
            <div className="mt-2 text-[9px] font-mono tracking-wider uppercase text-white/40 flex items-center gap-1.5">
              <span>{nodeCount} Nodes</span>
              <span className="text-white/20">·</span>
              <span>{connectionCount} Links</span>
            </div>

            {/* Footer status pill & schedule edited timestamp */}
            <div className="mt-auto pt-4 flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase border ${statusColor}`}>
                {status}
              </span>
              <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider text-white/20">
                <span className="material-symbols-outlined text-[12px]">schedule</span>
                <span>Edited {editedTime}</span>
              </div>
            </div>
          </div>

        </div>
      </Link>

      {/* Delete Confirmation Modal */}
      {isConfirmOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 select-none"
          onClick={(e) => {
            e.preventDefault();
            if (!isDeleting) setIsConfirmOpen(false);
          }}
        >
          <div
            className="bg-[#0c0d16] rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-white/[0.06] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <span className="material-symbols-outlined text-red-400">delete</span>
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-white/90 font-display">Delete Topology</h3>
            </div>
            <p className="text-xs text-white/40 mb-6 font-body leading-relaxed">
              Are you sure you want to decommission the sandbox environment <span className="font-semibold text-white/70">&quot;{title}&quot;</span>? All telemetry data will be permanently wiped.
            </p>
            <div className="flex gap-3 justify-end font-mono text-[9px] tracking-wider uppercase">
              <button
                onClick={() => setIsConfirmOpen(false)}
                disabled={isDeleting}
                className="px-3.5 py-2 text-white/40 hover:text-white/70 hover:bg-white/[0.02] rounded-lg transition-colors border border-transparent"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin" />
                    DELETING...
                  </>
                ) : (
                  'DELETE'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

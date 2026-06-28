'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { DesignCanvas, CanvasNode, Connection, CanvasStateRef } from '@/components/canvas/DesignCanvas';
import { ComponentPalette } from '@/components/canvas/ComponentPalette';
import { CanvasPanelsProvider } from '@/components/canvas/CanvasPanelsContext';
import { ITemplate } from '@/src/lib/templates/types';
import { SimulationResult } from '@/src/lib/simulation/engine';
import {
    getSavedProgress, saveProgress, clearProgress,
    isSolved, markSolved, unmarkSolved,
} from '@/src/lib/practice/storage';

export default function PracticePage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [template, setTemplate] = useState<ITemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [simulationState, setSimulationState] = useState<SimulationResult | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showSolution, setShowSolution] = useState(false);
    const [solved, setSolved] = useState(false);
    const [canvasVersion, setCanvasVersion] = useState(0);

    // Preserve user's canvas modifications across solution toggles
    const [userNodes, setUserNodes] = useState<CanvasNode[] | null>(null);
    const [userConnections, setUserConnections] = useState<Connection[] | null>(null);
    const canvasStateRef = useRef<CanvasStateRef | null>(null);

    // Auto-save progress periodically
    const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function loadTemplate() {
            try {
                const res = await fetch(`/api/templates/${id}`, { signal: controller.signal });
                if (!res.ok) throw new Error(`Failed to load template: ${res.status} ${res.statusText}`);
                const data = await res.json();

                if (controller.signal.aborted) return;

                setTemplate(data.template);

                // Load saved progress from localStorage
                const saved = getSavedProgress(id);
                if (saved) {
                    setUserNodes(saved.nodes);
                    setUserConnections(saved.connections);
                }

                // Check if already solved
                setSolved(isSolved(id));
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                if (!controller.signal.aborted) {
                    setError(err instanceof Error ? err.message : 'Failed to load');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }
        if (id) loadTemplate();

        return () => controller.abort();
    }, [id]);

    // Auto-save every 3 seconds while actively working
    useEffect(() => {
        if (!id || showSolution) return;

        autoSaveRef.current = setInterval(() => {
            if (canvasStateRef.current) {
                saveProgress(id, canvasStateRef.current.nodes, canvasStateRef.current.connections);
            }
        }, 3000);

        return () => {
            if (autoSaveRef.current) clearInterval(autoSaveRef.current);
        };
    }, [id, showSolution]);

    const handleToggleSolution = useCallback(() => {
        if (!showSolution) {
            // Snapshot user's work before switching to solution
            if (canvasStateRef.current) {
                const nodes = [...canvasStateRef.current.nodes];
                const connections = [...canvasStateRef.current.connections];
                setUserNodes(nodes);
                setUserConnections(connections);
                saveProgress(id, nodes, connections);
            }
        }
        setShowSolution(prev => !prev);
        setFeedback(null);
    }, [showSolution, id]);

    const handleSubmit = () => {
        if (!template || !simulationState) {
            setFeedback({ type: 'error', text: 'Run the simulation first before submitting your fix.' });
            return;
        }

        // Guard: ensure the bottleneck node is defined and has metrics
        if (!template.bottleneckNodeId || !simulationState.nodeMetrics[template.bottleneckNodeId]) {
            setFeedback({ type: 'error', text: 'No bottleneck node defined or metrics unavailable for the target node.' });
            return;
        }
        
        const bottleneckNodeStatus = simulationState.nodeMetrics[template.bottleneckNodeId].status;
        
        if (bottleneckNodeStatus === 'normal' || bottleneckNodeStatus === 'warning') {
            if (simulationState.globalStatus === 'critical') {
                setFeedback({ type: 'error', text: `Bottleneck resolved on the target node, but another part of the system is now critical. Keep tweaking!` });
            } else if (simulationState.globalStatus === 'degraded') {
                setFeedback({ type: 'error', text: `Target bottleneck resolved, but the system is still degraded. Other nodes are under stress — optimize further.` });
            } else {
                // SUCCESS — globalStatus is 'healthy'
                setSolved(true);
                markSolved(id);
                if (canvasStateRef.current) {
                    saveProgress(id, canvasStateRef.current.nodes, canvasStateRef.current.connections);
                }
                setFeedback({ type: 'success', text: '🎉 System stabilized! Bottleneck resolved. Excellent architectural decision.' });
            }
        } else {
            setFeedback({ type: 'error', text: `The bottleneck node is still overloaded under this load. Try adding a component to absorb some of the traffic.`});
        }
    };

    const handleReset = () => {
        if (!template) return;
        setUserNodes(null);
        setUserConnections(null);
        setFeedback(null);
        setSolved(false);
        setCanvasVersion(v => v + 1);
        clearProgress(id);
        unmarkSolved(id);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#060810]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border border-white/[0.06] border-t-cyan-400 rounded-full animate-spin" />
                    <p className="text-white/40 text-xs font-mono tracking-widest uppercase">Initializing Sandbox...</p>
                </div>
            </div>
        );
    }
    if (error || !template) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#060810]">
                <p className="text-red-400 font-mono text-xs uppercase tracking-widest">Error: {error}</p>
            </div>
        );
    }

    const activeNodes = showSolution
        ? template.modelSolution.nodes
        : (userNodes ?? template.initialNodes);
    const activeConnections = showSolution
        ? template.modelSolution.connections
        : (userConnections ?? template.initialConnections);

    return (
        <CanvasPanelsProvider>
            <div className="flex h-screen w-full flex-col bg-[#060810] text-white overflow-hidden">
                {/* Header */}
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.04] bg-[#0c0d16] px-6 z-10 select-none">
                    <div className="flex items-center gap-4">
                        <div 
                           className="flex items-center justify-center size-8 rounded-lg border border-white/[0.05] bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer" 
                           onClick={() => router.push('/practice')}
                        >
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                        </div>
                        <div>
                            <h1 className="text-[13px] font-mono font-bold tracking-wider text-white flex items-center gap-2 uppercase">
                               {template.title}
                               {solved && (
                                   <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[8px] font-mono font-semibold text-emerald-400 uppercase tracking-widest">
                                       <span className="material-symbols-outlined text-[10px]">check_circle</span>
                                       Solved
                                   </span>
                               )}
                            </h1>
                            <p className="text-[9px] font-mono tracking-widest text-white/30 uppercase mt-0.5">{template.category} • {template.difficulty}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[9px] tracking-wider uppercase">
                        <button 
                           onClick={handleReset}
                           className="rounded px-3 py-1.5 text-white/40 hover:text-white hover:bg-white/[0.02] transition cursor-pointer"
                           title="Reset to original template"
                        >
                            Reset
                        </button>
                        <button 
                           onClick={handleToggleSolution}
                           className="rounded px-3 py-1.5 border border-white/[0.06] hover:bg-white/[0.02] transition text-white/60 cursor-pointer"
                        >
                            {showSolution ? 'Back to Your Work' : 'View Solution'}
                        </button>
                        {!solved ? (
                            <button 
                               onClick={handleSubmit}
                               disabled={showSolution}
                               className="rounded bg-cyan-500 text-black px-4 py-1.5 font-bold hover:bg-cyan-400 transition shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                                Submit Fix
                            </button>
                        ) : (
                            <button 
                               onClick={() => router.push('/practice')}
                               className="rounded border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 font-bold text-cyan-400 hover:bg-cyan-500/20 transition shadow-sm cursor-pointer"
                            >
                                Practice More
                            </button>
                        )}
                    </div>
                </header>

                {/* Canvas area */}
                <div className="flex flex-1 overflow-hidden relative">
                    {!showSolution && <ComponentPalette />}
                    
                    <DesignCanvas 
                        key={`${showSolution ? 'solution' : 'active'}-${userNodes ? 'saved' : 'initial'}-${canvasVersion}`}
                        initialNodes={activeNodes}
                        initialConnections={activeConnections}
                        initialTargetRps={template.targetRps}
                        onSimulationChange={setSimulationState}
                        readOnly={showSolution}
                        stateRef={showSolution ? undefined : canvasStateRef}
                    />
                    
                    {/* Problem Card overlay */}
                    <div className="absolute top-6 z-[60] w-80 flex flex-col gap-4 pointer-events-none" style={{ left: showSolution ? '24px' : '280px' }}>
                        
                        <div className="bg-[#0c0d16]/95 backdrop-blur-xl rounded-xl p-4 border border-white/[0.08] shadow-2xl pointer-events-auto">
                            <h3 className="text-[10px] font-mono font-bold tracking-widest text-white/80 uppercase mb-2">Problem Statement</h3>
                            <p className="text-[11px] font-mono text-white/50 leading-relaxed">
                                {template.description}
                            </p>
                        </div>

                        {showSolution && (
                             <div className="bg-[#1e1b4b]/95 backdrop-blur-xl rounded-xl p-4 border border-indigo-500/30 shadow-2xl pointer-events-auto">
                                <h3 className="text-[10px] font-mono font-bold tracking-widest text-indigo-300 uppercase mb-2">Model Solution</h3>
                                <p className="text-[11px] font-mono text-indigo-200/80 leading-relaxed">
                                    {template.solutionExplanation}
                                </p>
                            </div>
                        )}
                        
                        {feedback && !showSolution && (
                            <div className={`backdrop-blur-xl rounded-xl p-4 border shadow-2xl pointer-events-auto ${
                                feedback.type === 'success' 
                                    ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
                                    : 'bg-red-950/90 border-red-500/30 text-red-300'
                            }`}>
                                <p className="text-[11px] font-mono font-medium leading-relaxed uppercase tracking-wider">
                                    {feedback.text}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </CanvasPanelsProvider>
    );
}

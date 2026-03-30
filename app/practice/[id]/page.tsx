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
            } else {
                // SUCCESS — persist solved state
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
        clearProgress(id);
        unmarkSolved(id);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400">Loading exercise...</p>
                </div>
            </div>
        );
    }
    if (error || !template) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-dark">
                <p className="text-red-500">Error: {error}</p>
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
            <div className="flex h-screen w-full flex-col bg-background-dark text-white overflow-hidden">
                {/* Header */}
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-border-dark bg-sidebar-bg px-6 z-10">
                    <div className="flex items-center gap-3">
                        <span className="text-slate-400 cursor-pointer hover:text-white transition" onClick={() => router.push('/practice')}>←</span>
                        <div>
                            <h1 className="text-base font-semibold text-white flex items-center gap-2">
                               {template.title}
                               {solved && (
                                   <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                                       <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>check_circle</span>
                                       Solved
                                   </span>
                               )}
                            </h1>
                            <p className="text-xs text-slate-500">{template.category} • {template.difficulty.toUpperCase()}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                           onClick={handleReset}
                           className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-slate-300 transition cursor-pointer"
                           title="Reset to original template"
                        >
                            Reset
                        </button>
                        <button 
                           onClick={handleToggleSolution}
                           className="rounded-lg px-4 py-2 border border-border-dark text-sm hover:bg-sidebar-bg transition text-slate-300 cursor-pointer"
                        >
                            {showSolution ? 'Back to Your Work' : 'View Solution'}
                        </button>
                        {!solved ? (
                            <button 
                               onClick={handleSubmit}
                               disabled={showSolution}
                               className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                                Submit Fix
                            </button>
                        ) : (
                            <button 
                               onClick={() => router.push('/practice')}
                               className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80 transition shadow-sm cursor-pointer"
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
                        key={`${showSolution ? 'solution' : 'active'}-${userNodes ? 'saved' : 'initial'}`}
                        initialNodes={activeNodes}
                        initialConnections={activeConnections}
                        initialTargetRps={template.targetRps}
                        onSimulationChange={setSimulationState}
                        readOnly={showSolution}
                        stateRef={showSolution ? undefined : canvasStateRef}
                    />
                    
                    {/* Problem Card overlay */}
                    <div className="absolute top-6 z-[60] w-80 flex flex-col gap-4 pointer-events-none" style={{ left: showSolution ? '24px' : '280px' }}>
                        
                        <div className="bg-black/90 backdrop-blur-md rounded-xl p-5 border border-border-dark shadow-xl pointer-events-auto">
                            <h3 className="font-semibold text-white mb-2">Problem Statement</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {template.description}
                            </p>
                        </div>

                        {showSolution && (
                             <div className="bg-indigo-950/95 backdrop-blur-md rounded-xl p-5 border border-indigo-800 shadow-xl pointer-events-auto">
                                <h3 className="font-semibold text-indigo-300 mb-2">Model Solution</h3>
                                <p className="text-sm text-indigo-200 leading-relaxed">
                                    {template.solutionExplanation}
                                </p>
                            </div>
                        )}
                        
                        {feedback && !showSolution && (
                            <div className={`backdrop-blur-md rounded-xl p-4 border shadow-xl pointer-events-auto ${
                                feedback.type === 'success' 
                                    ? 'bg-emerald-950/95 border-emerald-800 text-emerald-300'
                                    : 'bg-red-950/95 border-red-800 text-red-300'
                            }`}>
                                <p className="text-sm font-medium leading-relaxed">
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

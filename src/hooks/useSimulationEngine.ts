import { useState, useEffect } from 'react';
import { ICanvasNode, IConnection } from '@/src/lib/db/models/Design';
import { runSimulation, SimulationResult } from '@/src/lib/simulation/engine';

export function useSimulationEngine(
    nodes: ICanvasNode[],
    connections: IConnection[],
    targetRps: number,
    isRunning: boolean
) {
    const [metrics, setMetrics] = useState<SimulationResult>({
        nodeMetrics: {},
        edgeMetrics: {},
        globalStatus: 'healthy'
    });

    useEffect(() => {
        if (!isRunning || targetRps <= 0) {
            setMetrics({
                nodeMetrics: {},
                edgeMetrics: {},
                globalStatus: 'healthy'
            });
            return;
        }

        const result = runSimulation(nodes, connections, targetRps);
        setMetrics(result);
        
    }, [nodes, connections, targetRps, isRunning]);

    return metrics;
}

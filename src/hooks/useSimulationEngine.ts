import { useMemo } from 'react';
import { ICanvasNode, IConnection } from '@/src/lib/db/models/Design';
import { runSimulation, SimulationResult } from '@/src/lib/simulation/engine';

const EMPTY_METRICS: SimulationResult = {
    nodeMetrics: {},
    edgeMetrics: {},
    globalStatus: 'healthy'
};

export function useSimulationEngine(
    nodes: ICanvasNode[],
    connections: IConnection[],
    targetRps: number,
    isRunning: boolean
) {
    return useMemo<SimulationResult>(() => {
        if (!isRunning || targetRps <= 0) {
            return EMPTY_METRICS;
        }
        return runSimulation(nodes, connections, targetRps);
    }, [nodes, connections, targetRps, isRunning]);
}

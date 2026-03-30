import { ICanvasNode, IConnection } from '../db/models/Design';
import { NODE_CAPACITIES, NodeMetrics, EdgeMetrics } from './constants';

export interface SimulationResult {
    nodeMetrics: Record<string, NodeMetrics>;
    edgeMetrics: Record<string, EdgeMetrics>;
    globalStatus: 'healthy' | 'degraded' | 'critical';
}

export function runSimulation(nodes: ICanvasNode[], edges: IConnection[], targetRps: number): SimulationResult {
    const nodeMetrics: Record<string, NodeMetrics> = {};
    const edgeMetrics: Record<string, EdgeMetrics> = {};
    
    // Initialize metrics
    nodes.forEach(node => {
        nodeMetrics[node.id] = {
            trafficIn: 0,
            trafficOut: 0,
            capacity: NODE_CAPACITIES[node.type] || 5000,
            status: 'normal'
        };
    });

    edges.forEach(edge => {
        edgeMetrics[edge.id] = { trafficFlow: 0 };
    });

    if (targetRps <= 0) {
        return { nodeMetrics, edgeMetrics, globalStatus: 'healthy' };
    }

    // Identify sources (Clients or nodes with 0 in-degree if no clients)
    let sources = nodes.filter(n => n.type === 'Client');
    if (sources.length === 0) {
        const hasIncoming = new Set(edges.map(e => e.to));
        sources = nodes.filter(n => !hasIncoming.has(n.id));
    }

    if (sources.length === 0) {
        // Total cycle, pick a random node to start
        if (nodes.length > 0) sources = [nodes[0]];
    }

    // Build Adjacency List and InDegrees for Kahn's
    const adj: Record<string, IConnection[]> = {};
    const inDegree: Record<string, number> = {};
    
    nodes.forEach(n => {
        adj[n.id] = [];
        inDegree[n.id] = 0;
    });

    edges.forEach(e => {
        if (adj[e.from]) adj[e.from].push(e);
        if (inDegree[e.to] !== undefined) inDegree[e.to]++;
    });

    // Iterative propagation with convergence detection to handle cycles properly
    // We iterate until traffic distribution stabilizes or we hit maxIterations

    // Initial Load
    sources.forEach(s => {
        if (nodeMetrics[s.id]) {
            nodeMetrics[s.id].trafficIn += targetRps / sources.length;
        }
    });

    const maxIterations = 100;
    const epsilon = 0.01; // Convergence threshold: stop when total change < epsilon
    const sourceIds = new Set(sources.map(s => s.id));

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        // Store previous trafficIn values to measure convergence
        const prevTrafficIn: Record<string, number> = {};
        Object.keys(nodeMetrics).forEach(id => {
            prevTrafficIn[id] = nodeMetrics[id].trafficIn;
        });

        // Reset edge flows before recalculating this iteration's spread
        edges.forEach(e => { edgeMetrics[e.id].trafficFlow = 0; });

        // Create next iteration's trafficIn map, starting with sources
        const nextTrafficIn: Record<string, number> = {};
        sourceIds.forEach(id => {
            nextTrafficIn[id] = targetRps / sources.length;
        });
        nodes.forEach(n => {
            if (!sourceIds.has(n.id)) {
                nextTrafficIn[n.id] = 0;
            }
        });

        // Process each node: compute outFlow and distribute to children
        nodes.forEach(node => {
            const metrics = nodeMetrics[node.id];
            const processingTraffic = prevTrafficIn[node.id];

            // Cap out at capacity
            const outFlow = Math.min(processingTraffic, metrics.capacity);
            metrics.trafficOut = outFlow;

            // Update status
            if (processingTraffic > metrics.capacity) {
                metrics.status = 'bottlenecked';
            } else if (processingTraffic > metrics.capacity * 0.8) {
                metrics.status = 'warning';
            } else {
                metrics.status = 'normal';
            }

            // Distribute to children
            const outgoingEdges = adj[node.id];
            if (outgoingEdges && outgoingEdges.length > 0) {
                // Cache nodes absorb most traffic (90% hit rate), only forwarding misses
                const effectiveOut = node.type === 'Cache' ? outFlow * 0.1 : outFlow;
                const flowPerEdge = effectiveOut / outgoingEdges.length;
                outgoingEdges.forEach(edge => {
                    edgeMetrics[edge.id].trafficFlow += flowPerEdge;
                    if (nextTrafficIn[edge.to] !== undefined) {
                        nextTrafficIn[edge.to] += flowPerEdge;
                    }
                });
            }
        });

        // Update nodeMetrics with nextTrafficIn
        Object.keys(nextTrafficIn).forEach(id => {
            nodeMetrics[id].trafficIn = nextTrafficIn[id];
        });

        // Measure total delta to check for convergence
        let totalDelta = 0;
        Object.keys(nodeMetrics).forEach(id => {
            totalDelta += Math.abs(nodeMetrics[id].trafficIn - prevTrafficIn[id]);
        });

        // Stop if converged
        if (totalDelta < epsilon) {
            break;
        }
    }

    // Evaluate Global Status
    const bottleneckCount = Object.values(nodeMetrics).filter(m => m.status === 'bottlenecked').length;
    let globalStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (bottleneckCount > 2) globalStatus = 'critical';
    else if (bottleneckCount > 0) globalStatus = 'degraded';

    return { nodeMetrics, edgeMetrics, globalStatus };
}
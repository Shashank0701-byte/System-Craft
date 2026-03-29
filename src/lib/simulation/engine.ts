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

    // We will do a modified iterative propagation to handle cycles softly.
    // Instead of strict topological sort, we do a fixed number of iterations (e.g. 5 passes)
    // For pure DAGs, it propagates cleanly. For cycles, it stabilizes.
    
    // Initial Load
    sources.forEach(s => {
        if (nodeMetrics[s.id]) {
            nodeMetrics[s.id].trafficIn += targetRps / sources.length;
        }
    });

    // 10 passes is enough for most UI architectures
    for (let pass = 0; pass < 10; pass++) {
        // Reset edge flows before recalculating this pass's spread
        edges.forEach(e => { edgeMetrics[e.id].trafficFlow = 0; });
        
        // We need a snapshot of trafficIn for the current frame to distribute it properly
        const sourceIds = new Set(sources.map(s => s.id));
        const currentTrafficIn = Object.keys(nodeMetrics).reduce((acc, id) => {
            acc[id] = nodeMetrics[id].trafficIn;
            // Clear trafficIn for non-sources so they can receive the fresh wave
            if (!sourceIds.has(id)) {
                nodeMetrics[id].trafficIn = 0;
            }
            return acc;
        }, {} as Record<string, number>);

        nodes.forEach(node => {
            const metrics = nodeMetrics[node.id];
            const processingTraffic = currentTrafficIn[node.id];
            
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
                const flowPerEdge = outFlow / outgoingEdges.length;
                outgoingEdges.forEach(edge => {
                    edgeMetrics[edge.id].trafficFlow += flowPerEdge;
                    if (nodeMetrics[edge.to]) {
                        nodeMetrics[edge.to].trafficIn += flowPerEdge;
                    }
                });
            }
        });
    }

    // Evaluate Global Status
    const bottleneckCount = Object.values(nodeMetrics).filter(m => m.status === 'bottlenecked').length;
    let globalStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (bottleneckCount > 2) globalStatus = 'critical';
    else if (bottleneckCount > 0) globalStatus = 'degraded';

    return { nodeMetrics, edgeMetrics, globalStatus };
}

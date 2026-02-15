import { ICanvasNode, IConnection } from '../db/models/Design';
import { IRuleResult } from '../db/models/InterviewSession';

/**
 * Result of the structural evaluation
 */
export interface StructuralEvaluation {
    score: number;
    passedRules: string[];
    failedRules: string[];
    details: IRuleResult[];
}

interface RuleDefinition {
    id: string;
    description: string;
    weight: number;
    severity: 'critical' | 'warning' | 'info';
    check: (nodes: ICanvasNode[], connections: IConnection[], requirements: string[], constraints: string[]) => { pass: boolean; message: string };
}

/**
 * Standard rules for system design evaluation
 */
const RULES: RuleDefinition[] = [
    // 1. Core Component Presence
    {
        id: 'has_load_balancer',
        description: 'Design includes a Load Balancer',
        weight: 15,
        severity: 'critical',
        check: (nodes) => {
            const hasLB = nodes.some(n => n.type === 'LB');
            return {
                pass: hasLB,
                message: hasLB ? 'Load balancer correctly identified' : 'Missing a Load Balancer to distribute traffic between servers.'
            };
        }
    },
    {
        id: 'has_database',
        description: 'Design includes a Database',
        weight: 15,
        severity: 'critical',
        check: (nodes) => {
            const hasDB = nodes.some(n => n.type === 'SQL' || n.type === 'Blob');
            return {
                pass: hasDB,
                message: hasDB ? 'Storage layer present' : 'Missing a persistent storage layer (SQL or Blob storage).'
            };
        }
    },
    {
        id: 'has_application_server',
        description: 'Design includes Application Servers',
        weight: 15,
        severity: 'critical',
        check: (nodes) => {
            const hasServer = nodes.some(n => n.type === 'Server' || n.type === 'Function');
            return {
                pass: hasServer,
                message: hasServer ? 'Application logic layer present' : 'Missing application servers or functions to process business logic.'
            };
        }
    },

    // 2. Connectivity & Flow
    {
        id: 'lb_connected_to_servers',
        description: 'Load Balancer connects to Servers',
        weight: 10,
        severity: 'warning',
        check: (nodes, connections) => {
            const lbs = nodes.filter(n => n.type === 'LB');
            if (lbs.length === 0) return { pass: false, message: 'No Load Balancer to check connections.' };

            const connectedToServers = lbs.some(lb =>
                connections.some(c => {
                    const target = nodes.find(n => n.id === c.to || n.id === c.from);
                    const otherId = c.from === lb.id ? c.to : (c.to === lb.id ? c.from : null);
                    if (!otherId) return false;
                    const otherNode = nodes.find(n => n.id === otherId);
                    return otherNode?.type === 'Server' || otherNode?.type === 'Function';
                })
            );

            return {
                pass: connectedToServers,
                message: connectedToServers ? 'Traffic flows from Load Balancer to servers' : 'Load Balancer is not connected to any application servers.'
            };
        }
    },
    {
        id: 'servers_connected_to_db',
        description: 'Servers connect to Database',
        weight: 10,
        severity: 'warning',
        check: (nodes, connections) => {
            const servers = nodes.filter(n => n.type === 'Server' || n.type === 'Function');
            if (servers.length === 0) return { pass: false, message: 'No servers to check connections.' };

            const connectedToDB = servers.some(s =>
                connections.some(c => {
                    const otherId = c.from === s.id ? c.to : (c.to === s.id ? c.from : null);
                    if (!otherId) return false;
                    const otherNode = nodes.find(n => n.id === otherId);
                    return otherNode?.type === 'SQL' || otherNode?.type === 'Blob';
                })
            );

            return {
                pass: connectedToDB,
                message: connectedToDB ? 'Servers are correctly connected to storage' : 'Application logic is not connected to any database or storage.'
            };
        }
    },

    // 3. Performance & Scalability
    {
        id: 'caching_layer',
        description: 'Includes Caching for performance',
        weight: 10,
        severity: 'info',
        check: (nodes, _, requirements) => {
            const hasCache = nodes.some(n => n.type === 'Cache' || n.type === 'CDN');
            const mentionsHighLoad = requirements.some(r => r.toLowerCase().includes('scale') || r.toLowerCase().includes('latency'));

            if (hasCache) return { pass: true, message: 'Caching layer used for performance optimization.' };
            if (mentionsHighLoad) return { pass: false, message: 'High performance requirements detected. Consider adding a Cache or CDN.' };
            return { pass: true, message: 'Simple design: Caching not strictly required but recommended.' };
        }
    },
    {
        id: 'asynchronous_processing',
        description: 'Uses Queues for async tasks',
        weight: 10,
        severity: 'info',
        check: (nodes) => {
            const hasQueue = nodes.some(n => n.type === 'Queue' || n.type === 'Kafka');
            return {
                pass: hasQueue,
                message: hasQueue ? 'Async processing used for decoupled architecture' : 'Consider using a Message Queue for long-running or non-blocking tasks.'
            };
        }
    },

    // 4. Graph Health
    {
        id: 'no_orphan_nodes',
        description: 'All components are connected',
        weight: 10,
        severity: 'warning',
        check: (nodes, connections) => {
            if (nodes.length === 0) return { pass: true, message: 'Empty canvas' };
            const connectedNodeIds = new Set<string>();
            connections.forEach(c => {
                connectedNodeIds.add(c.from);
                connectedNodeIds.add(c.to);
            });

            const orphanCount = nodes.filter(n => !connectedNodeIds.has(n.id)).length;
            const pass = orphanCount === 0;

            return {
                pass,
                message: pass ? 'Architecture is fully connected' : `${orphanCount} component(s) are floating and not connected to the system.`
            };
        }
    }
];

/**
 * Performs a deterministic structural evaluation of the canvas design
 */
export function evaluateStructure(
    nodes: ICanvasNode[],
    connections: IConnection[],
    requirements: string[],
    constraints: string[]
): StructuralEvaluation {
    const details: IRuleResult[] = [];
    let totalWeight = 0;
    let earnedWeight = 0;

    for (const rule of RULES) {
        const { pass, message } = rule.check(nodes, connections, requirements, constraints);

        details.push({
            rule: rule.description,
            status: pass ? 'pass' : 'fail',
            message,
            severity: rule.severity
        });

        totalWeight += rule.weight;
        if (pass) {
            earnedWeight += rule.weight;
        }
    }

    const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
    const passedRules = details.filter(d => d.status === 'pass').map(d => d.rule);
    const failedRules = details.filter(d => d.status === 'fail').map(d => d.rule);

    return {
        score,
        passedRules,
        failedRules,
        details
    };
}

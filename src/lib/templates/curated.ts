import { ITemplate } from './types';

export const curatedTemplates: ITemplate[] = [
    {
        id: 'curated-cache-001',
        title: 'Database Under Siege',
        description: 'Your SQL database is receiving 8,000 RPS directly from the app servers. It can only handle 3,000. Users are experiencing dropped requests and timeouts. Fix the bottleneck using the canvas.',
        category: 'Caching Optimization',
        difficulty: 'easy',
        targetRps: 8000,
        initialNodes: [
            { id: 'client', type: 'Client', icon: 'person', x: 500, y: 350, label: 'Users' },
            { id: 'lb', type: 'LB', icon: 'account_tree', x: 700, y: 350, label: 'Load Balancer' },
            { id: 'srv1', type: 'Server', icon: 'dns', x: 900, y: 250, label: 'App Server 1' },
            { id: 'srv2', type: 'Server', icon: 'dns', x: 900, y: 450, label: 'App Server 2' },
            { id: 'db', type: 'SQL', icon: 'database', x: 1100, y: 350, label: 'Primary DB' }
        ],
        initialConnections: [
            { id: 'c1', from: 'client', to: 'lb' },
            { id: 'c2', from: 'lb', to: 'srv1' },
            { id: 'c3', from: 'lb', to: 'srv2' },
            { id: 'c4', from: 'srv1', to: 'db' },
            { id: 'c5', from: 'srv2', to: 'db' }
        ],
        bottleneckNodeId: 'db',
        expectedSolution: ['add_cache'],
        modelSolution: {
            nodes: [
                { id: 'client', type: 'Client', icon: 'person', x: 500, y: 350, label: 'Users' },
                { id: 'lb', type: 'LB', icon: 'account_tree', x: 700, y: 350, label: 'Load Balancer' },
                { id: 'srv1', type: 'Server', icon: 'dns', x: 900, y: 250, label: 'App Server 1' },
                { id: 'srv2', type: 'Server', icon: 'dns', x: 900, y: 450, label: 'App Server 2' },
                { id: 'cache', type: 'Cache', icon: 'memory', x: 1100, y: 350, label: 'Redis Cache' },
                { id: 'db', type: 'SQL', icon: 'database', x: 1300, y: 350, label: 'Primary DB' }
            ],
            connections: [
                { id: 'c1', from: 'client', to: 'lb' },
                { id: 'c2', from: 'lb', to: 'srv1' },
                { id: 'c3', from: 'lb', to: 'srv2' },
                { id: 'c4', from: 'srv1', to: 'cache' },
                { id: 'c5', from: 'srv2', to: 'cache' },
                { id: 'c6', from: 'cache', to: 'db', label: 'Cache Misses' }
            ]
        },
        solutionExplanation: "Adding a Redis Cache (50k RPS capacity) in front of the SQL database absorbs 90% of read traffic. Only cache misses (10%) flow to the DB, reducing its load from 8k to ~800 RPS — well within its 3k capacity."
    },
    {
        id: 'curated-scale-001',
        title: 'The Monolith',
        description: 'A single App Server is handling all 10,000 RPS coming from the Load Balancer. It can only handle 5,000. Add another server and balance the load.',
        category: 'Scaling Systems',
        difficulty: 'easy',
        targetRps: 10000,
        initialNodes: [
            { id: 'client', type: 'Client', icon: 'person', x: 500, y: 350, label: 'Users' },
            { id: 'lb', type: 'LB', icon: 'account_tree', x: 700, y: 350, label: 'Load Balancer' },
            { id: 'srv1', type: 'Server', icon: 'dns', x: 900, y: 350, label: 'App Server 1' },
            { id: 'db', type: 'SQL', icon: 'database', x: 1100, y: 350, label: 'Primary DB' }
        ],
        initialConnections: [
            { id: 'c1', from: 'client', to: 'lb' },
            { id: 'c2', from: 'lb', to: 'srv1' },
            { id: 'c3', from: 'srv1', to: 'db' }
        ],
        bottleneckNodeId: 'srv1',
        expectedSolution: ['scale_horizontally'],
        modelSolution: {
            nodes: [
                { id: 'client', type: 'Client', icon: 'person', x: 500, y: 350, label: 'Users' },
                { id: 'lb', type: 'LB', icon: 'account_tree', x: 700, y: 350, label: 'Load Balancer' },
                { id: 'srv1', type: 'Server', icon: 'dns', x: 900, y: 250, label: 'App Server 1' },
                { id: 'srv2', type: 'Server', icon: 'dns', x: 900, y: 450, label: 'App Server 2' },
                { id: 'db', type: 'SQL', icon: 'database', x: 1100, y: 350, label: 'Primary DB' }
            ],
            connections: [
                { id: 'c1', from: 'client', to: 'lb' },
                { id: 'c2', from: 'lb', to: 'srv1' },
                { id: 'c3', from: 'lb', to: 'srv2' },
                { id: 'c4', from: 'srv1', to: 'db' },
                { id: 'c5', from: 'srv2', to: 'db' }
            ]
        },
        solutionExplanation: "By adding a second App Server (scaling horizontally) and connecting the Load Balancer to both, the 10,000 RPS is distributed equally. Each server now handles 5,000 RPS, which is exactly within their capacity."
    }
];

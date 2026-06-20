import { describe, it, expect } from 'vitest';
import { evaluateStructure } from './structuralRules';
import type { ICanvasNode, IConnection } from '../db/models/Design';

// ── Helpers ──────────────────────────────────────────────────────────
function node(id: string, type: string): ICanvasNode {
    return { id, type, icon: '🔲', x: 0, y: 0 };
}

function conn(from: string, to: string): IConnection {
    return { id: `${from}-${to}`, from, to };
}

// ── Tests ────────────────────────────────────────────────────────────
describe('evaluateStructure', () => {
    it('returns score 0 for an empty canvas', () => {
        const result = evaluateStructure([], [], [], []);
        // No nodes means most checks fail (LB, DB, Server all missing)
        expect(result.score).toBeLessThanOrEqual(25);
        expect(result.failedRules.length).toBeGreaterThan(0);
    });

    it('scores higher with core components present', () => {
        const nodes = [
            node('lb1', 'LB'),
            node('srv1', 'Server'),
            node('db1', 'SQL'),
        ];
        const connections = [
            conn('lb1', 'srv1'),
            conn('srv1', 'db1'),
        ];

        const result = evaluateStructure(nodes, connections, [], []);

        expect(result.score).toBeGreaterThanOrEqual(50);
        expect(result.passedRules).toContain('Design includes a Load Balancer');
        expect(result.passedRules).toContain('Design includes a Database');
        expect(result.passedRules).toContain('Design includes Application Servers');
        expect(result.passedRules).toContain('Load Balancer connects to Servers');
        expect(result.passedRules).toContain('Servers connect to Database');
        expect(result.passedRules).toContain('All components are connected');
    });

    it('detects orphan nodes', () => {
        const nodes = [
            node('lb1', 'LB'),
            node('srv1', 'Server'),
            node('orphan', 'Cache'),  // not connected to anything
        ];
        const connections = [conn('lb1', 'srv1')];

        const result = evaluateStructure(nodes, connections, [], []);

        expect(result.failedRules).toContain('All components are connected');
        const detail = result.details.find(d => d.rule === 'All components are connected');
        expect(detail?.message).toContain('1 component(s) are floating');
    });

    it('detects missing load balancer', () => {
        const nodes = [node('srv1', 'Server'), node('db1', 'SQL')];
        const connections = [conn('srv1', 'db1')];

        const result = evaluateStructure(nodes, connections, [], []);

        expect(result.failedRules).toContain('Design includes a Load Balancer');
    });

    it('rewards caching when scale requirements are present', () => {
        const nodes = [
            node('lb1', 'LB'),
            node('srv1', 'Server'),
            node('db1', 'SQL'),
            node('cache1', 'Cache'),
        ];
        const connections = [
            conn('lb1', 'srv1'),
            conn('srv1', 'db1'),
            conn('srv1', 'cache1'),
        ];

        const result = evaluateStructure(nodes, connections, ['must scale to 1M users'], []);

        expect(result.passedRules).toContain('Includes Caching for performance');
    });

    it('flags missing cache when scale requirements exist', () => {
        const nodes = [
            node('lb1', 'LB'),
            node('srv1', 'Server'),
            node('db1', 'SQL'),
        ];
        const connections = [conn('lb1', 'srv1'), conn('srv1', 'db1')];

        const result = evaluateStructure(nodes, connections, ['low latency required'], []);

        expect(result.failedRules).toContain('Includes Caching for performance');
    });

    it('returns a perfect score with a fully connected architecture', () => {
        const nodes = [
            node('lb1', 'LB'),
            node('srv1', 'Server'),
            node('db1', 'SQL'),
            node('cache1', 'Cache'),
            node('q1', 'Queue'),
        ];
        const connections = [
            conn('lb1', 'srv1'),
            conn('srv1', 'db1'),
            conn('srv1', 'cache1'),
            conn('srv1', 'q1'),
        ];

        const result = evaluateStructure(nodes, connections, [], []);

        expect(result.score).toBe(100);
        expect(result.failedRules).toHaveLength(0);
    });

    it('always returns details for every rule', () => {
        const result = evaluateStructure([], [], [], []);
        // There are 8 rules defined in structuralRules.ts
        expect(result.details.length).toBe(8);
        result.details.forEach(d => {
            expect(d).toHaveProperty('rule');
            expect(d).toHaveProperty('status');
            expect(d).toHaveProperty('message');
            expect(d).toHaveProperty('severity');
        });
    });
});

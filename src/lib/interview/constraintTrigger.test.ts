import { describe, it, expect } from 'vitest';
import {
    LIVE_CHANGE_MIN_PROGRESS,
    LIVE_CHANGE_MIN_NODES,
    resolveConstraintCanvas,
    shouldTriggerConstraintChange,
    type ConstraintTriggerSession,
} from './constraintTrigger';
import type { ICanvasNode, IConnection } from '../db/models/Design';

function session(overrides: Partial<ConstraintTriggerSession> = {}): ConstraintTriggerSession {
    return {
        difficulty: 'medium',
        startedAt: '2026-07-19T10:00:00.000Z',
        timeLimit: 45,
        constraintChanges: [],
        ...overrides,
    };
}

function node(id: string): ICanvasNode {
    return {
        id,
        type: 'Server',
        icon: 'dns',
        label: id,
        x: 0,
        y: 0,
    };
}

describe('shouldTriggerConstraintChange', () => {
    const startedAt = new Date('2026-07-19T10:00:00.000Z').getTime();

    it('triggers on easy after 25% progress (chaos is enabled for all difficulties)', () => {
        // 20/45 ≈ 0.444, well past the 25% threshold
        const now = startedAt + 20 * 60 * 1000;
        const result = shouldTriggerConstraintChange(session({ difficulty: 'easy' }), 5, now);
        expect(result.shouldTrigger).toBe(true);
    });

    it('does not trigger before 25% progress', () => {
        // 45 * 0.25 = 11.25 min → at 10 min still early
        const now = startedAt + 10 * 60 * 1000;
        const result = shouldTriggerConstraintChange(session(), LIVE_CHANGE_MIN_NODES, now);
        expect(result.shouldTrigger).toBe(false);
        expect(result.introducedAtMinute).toBe(10);
    });

    it('triggers after 25% with enough nodes on medium', () => {
        const now = startedAt + 12 * 60 * 1000; // 12/45 ≈ 0.267
        const result = shouldTriggerConstraintChange(session(), LIVE_CHANGE_MIN_NODES, now);
        expect(result.shouldTrigger).toBe(true);
        expect(result.introducedAtMinute).toBe(12);
    });

    it('triggers on hard after 25%', () => {
        const now = startedAt + 20 * 60 * 1000; // 20/60 ≈ 0.333
        const result = shouldTriggerConstraintChange(
            session({ difficulty: 'hard', timeLimit: 60 }),
            4,
            now
        );
        expect(result.shouldTrigger).toBe(true);
    });

    it('does not trigger when a constraint already exists', () => {
        const now = startedAt + 20 * 60 * 1000;
        const result = shouldTriggerConstraintChange(
            session({
                constraintChanges: [{ id: 'cc_1' }] as ConstraintTriggerSession['constraintChanges'],
            }),
            5,
            now
        );
        expect(result.shouldTrigger).toBe(false);
    });

    it('does not trigger with fewer than min nodes', () => {
        const now = startedAt + 20 * 60 * 1000;
        const result = shouldTriggerConstraintChange(session(), LIVE_CHANGE_MIN_NODES - 1, now);
        expect(result.shouldTrigger).toBe(false);
    });

    it('remains eligible past the old 75% upper bound (sticky)', () => {
        // Previously blocked at progress > 0.75; 40/45 ≈ 0.889
        const now = startedAt + 40 * 60 * 1000;
        const result = shouldTriggerConstraintChange(session(), 5, now);
        expect(result.shouldTrigger).toBe(true);
        expect(40 / 45).toBeGreaterThan(LIVE_CHANGE_MIN_PROGRESS);
    });

    it('returns false for invalid startedAt', () => {
        const result = shouldTriggerConstraintChange(
            session({ startedAt: 'not-a-date' }),
            5,
            Date.now()
        );
        expect(result.shouldTrigger).toBe(false);
    });
});

describe('resolveConstraintCanvas', () => {
    it('uses client canvas when it has nodes', () => {
        const clientNodes = [node('a'), node('b'), node('c')];
        const clientConnections: IConnection[] = [];
        const snapshot = { nodes: [node('x'), node('y')], connections: [] as IConnection[] };

        const resolved = resolveConstraintCanvas(clientNodes, clientConnections, snapshot);
        expect(resolved.nodes).toEqual(clientNodes);
        expect(resolved.nodeCount).toBe(3);
    });

    it('prefers live client canvas over a larger snapshot (respects deletions)', () => {
        const clientNodes = [node('a')];
        const clientConnections: IConnection[] = [];
        const snapshotNodes = [node('x'), node('y'), node('z'), node('w')];
        const snapshotConnections: IConnection[] = [
            { id: 'c1', from: 'x', to: 'y' },
        ];

        const resolved = resolveConstraintCanvas(clientNodes, clientConnections, {
            nodes: snapshotNodes,
            connections: snapshotConnections,
        });

        expect(resolved.nodes).toEqual(clientNodes);
        expect(resolved.connections).toEqual(clientConnections);
        expect(resolved.nodeCount).toBe(1);
    });

    it('falls back to snapshot only when client canvas is empty', () => {
        const snapshotNodes = [node('x'), node('y'), node('z'), node('w')];
        const snapshotConnections: IConnection[] = [
            { id: 'c1', from: 'x', to: 'y' },
        ];

        const resolved = resolveConstraintCanvas([], [], {
            nodes: snapshotNodes,
            connections: snapshotConnections,
        });

        expect(resolved.nodes).toEqual(snapshotNodes);
        expect(resolved.connections).toEqual(snapshotConnections);
        expect(resolved.nodeCount).toBe(4);
    });

    it('handles missing snapshot', () => {
        const clientNodes = [node('a'), node('b'), node('c')];
        const resolved = resolveConstraintCanvas(clientNodes, [], null);
        expect(resolved.nodeCount).toBe(3);
        expect(resolved.nodes).toEqual(clientNodes);
    });
});
